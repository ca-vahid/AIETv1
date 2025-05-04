import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, orderBy, getDocs, limit, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { DraftConversation, FinalRequest } from "@/lib/types/conversation";

/**
 * GET /api/chat/history - Fetches a user's chat history with request statuses
 */
export async function GET(req: NextRequest) {
  try {
    // Get the Firebase ID token from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // Verify the ID token
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Get URL parameters
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit') || '20';
    const maxResults = parseInt(limitParam, 10);
    const shouldCleanup = searchParams.get('cleanup') !== 'false'; // Default to true
    
    try {
      // Fetch both draft conversations and final requests
      const draftConversationsRef = collection(db, 'conversations');
      const draftQuery = query(
        draftConversationsRef,
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
        limit(maxResults)
      );
      
      const requestsRef = collection(db, 'requests');
      const requestsQuery = query(
        requestsRef,
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
        limit(maxResults)
      );
      
      // Execute both queries
      const [draftResults, requestResults] = await Promise.all([
        getDocs(draftQuery),
        getDocs(requestsQuery)
      ]);
      
      // Track empty drafts for potential cleanup
      const emptyDraftIds: string[] = [];
      
      // Process draft conversations
      const draftConversations: any[] = [];
      draftResults.forEach((doc) => {
        const data = doc.data() as DraftConversation;
        
        // Skip empty conversations - those that:
        // 1. Have no user messages, or
        // 2. Are still in the init state and have fewer than 2 total messages (just welcome)
        const hasUserMessages = data.messages.some(m => m.role === 'user');
        const isEmptyInitialState = data.state.currentStep === 'init' && data.messages.length < 3;
        const hasNoMeaningfulContent = !hasUserMessages && isEmptyInitialState;
        
        if (hasNoMeaningfulContent) {
          if (shouldCleanup) {
            // Track for cleanup if it's older than 2 hours
            const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
            if (data.createdAt < twoHoursAgo) {
              // Double-check for any user content before adding to cleanup list
              const userContent = data.messages.filter(m => m.role === 'user').map(m => m.content.trim()).join('');
              if (!userContent) {
                emptyDraftIds.push(doc.id);
                console.log(`Marking draft ${doc.id} for cleanup - No user messages, init state, ${data.messages.length} msgs`);
              }
            }
          }
          return; // Skip this conversation
        }
        
        // Get the task description if available, otherwise use first user message
        const previewText = data.state?.collectedData?.processDescription || 
                          data.messages.find(m => m.role === 'user')?.content || 
                          "No message content";
        const truncatedPreview = previewText.length > 100 
          ? `${previewText.substring(0, 100)}...` 
          : previewText;
        
        draftConversations.push({
          id: data.id,
          type: 'draft',
          status: getStateLabel(data.state.currentStep),
          statusCode: data.state.currentStep,
          preview: data.title || truncatedPreview,
          timestamp: data.updatedAt,
          progress: calculateProgress(data.state.currentStep),
        });
      });
      
      // Process submitted requests
      const submittedRequests: any[] = [];
      requestResults.forEach((doc) => {
        const data = doc.data() as FinalRequest;
        
        // Skip incomplete requests
        if (!data.request || !data.request.processDescription) {
          return; // Skip incomplete requests
        }
        
        submittedRequests.push({
          id: data.id,
          type: 'request',
          status: getRequestStatusLabel(data.status),
          statusCode: data.status,
          preview: data.title || data.request.processDescription || "No description available",
          timestamp: data.updatedAt,
          impactScore: data.request.impactScore,
          assignedTo: data.assignedTo,
          complexity: data.classification?.complexity || "unknown",
        });
      });
      
      // Combine and sort both types by timestamp
      const combinedHistory = [...draftConversations, ...submittedRequests]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, maxResults);
      
      // Cleanup empty drafts if requested and if any were found
      if (shouldCleanup && emptyDraftIds.length > 0) {
        // Use a batch to delete multiple documents efficiently
        cleanupEmptyDrafts(emptyDraftIds, draftConversationsRef).catch(err => {
          console.error('Failed to cleanup empty drafts:', err);
        });
      }
      
      return NextResponse.json({ 
        history: combinedHistory,
        totalDrafts: draftConversations.length,
        totalSubmitted: submittedRequests.length,
        emptyDraftsRemoved: emptyDraftIds.length
      });
    } catch (firestoreError: any) {
      // Check if the error is related to missing indexes
      if (firestoreError.code === 'failed-precondition' || firestoreError.message?.includes('index')) {
        console.error('Firestore index error:', firestoreError);
        return NextResponse.json({ 
          error: 'Database indexes are still being created. Please try again in a few moments.',
          indexError: true,
          history: []
        }, { status: 503 }); // Service Unavailable status
      }
      
      // Other Firestore errors
      console.error('Firestore query error:', firestoreError);
      throw firestoreError;
    }
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error',
      history: []
    }, { status: 500 });
  }
}

/**
 * Maps conversation state to user-friendly labels
 */
function getStateLabel(state: string): string {
  const stateLabels: Record<string, string> = {
    'init': 'Getting Started',
    'profile': 'Profile Information',
    'task_description': 'Task Description',
    'lite_description': 'Brief Overview',
    'lite_impact': 'Benefit Overview',
    'summary_lite': 'Ready to Submit',
    'pain': 'Pain Points',
    'frequency': 'Frequency & Duration',
    'tools': 'Tools & Roles',
    'impact': 'Impact Assessment',
    'attachments': 'Attachments',
    'summary': 'Summary Review',
    'submit': 'Ready to Submit'
  };
  
  return stateLabels[state] || 'In Progress';
}

/**
 * Maps request status to user-friendly labels
 */
function getRequestStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'new': 'Submitted - Awaiting Review',
    'in_review': 'Under Review',
    'pilot': 'Pilot Implementation',
    'completed': 'Completed',
    'rejected': 'Not Feasible'
  };
  
  return statusLabels[status] || 'Unknown Status';
}

/**
 * Calculates progress percentage based on conversation state
 */
function calculateProgress(state: string): number {
  const stateProgressMap: Record<string, number> = {
    'init': 5,
    'lite_description': 10,
    'lite_impact': 20,
    'summary_lite': 30,
    'profile': 40,
    'task_description': 50,
    'pain': 60,
    'frequency': 70,
    'tools': 80,
    'impact': 90,
    'attachments': 95,
    'summary': 98,
    'submit': 100
  };
  
  return stateProgressMap[state] ?? 0;
}

/**
 * Cleans up empty draft conversations
 */
async function cleanupEmptyDrafts(draftIds: string[], collectionRef: any) {
  if (draftIds.length === 0) return;
  
  // Firestore has a limit of 500 operations per batch
  const batchSize = 500;
  const batches = [];
  
  for (let i = 0; i < draftIds.length; i += batchSize) {
    const batch = writeBatch(db);
    const batch_ids = draftIds.slice(i, i + batchSize);
    
    batch_ids.forEach(id => {
      batch.delete(doc(collectionRef, id));
    });
    
    batches.push(batch.commit());
  }
  
  await Promise.all(batches);
  console.log(`Cleaned up ${draftIds.length} empty draft conversations`);
} 
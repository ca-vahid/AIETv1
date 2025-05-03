import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { FinalRequest } from "@/lib/types/conversation";

/**
 * GET /api/requests/[id] - Fetches details for a specific submitted automation request
 */
export async function GET(req: NextRequest, { params }: { params: { id: string }}) {
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
    
    // Get the request ID from the URL params
    const requestId = params.id;
    
    // Fetch the request from Firestore
    const requestDoc = await getDoc(doc(db, 'requests', requestId));
    
    if (!requestDoc.exists()) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    
    const requestData = requestDoc.data() as FinalRequest;
    
    // Check if the user is authorized to access this request
    // Either they created it or they're part of the AIET team
    const isOwner = requestData.userId === userId;
    // For now, we'll assume only the owner can view their requests
    // In a production system, you'd check if they're part of AIET team too
    
    if (!isOwner) {
      return NextResponse.json({ error: 'Not authorized to view this request' }, { status: 403 });
    }
    
    // Prepare the response data
    const requestDetail = {
      id: requestData.id,
      status: getRequestStatusLabel(requestData.status),
      statusCode: requestData.status,
      impactScore: requestData.request.impactScore,
      hoursSavedPerWeek: requestData.request.hoursSavedPerWeek,
      processDescription: requestData.request.processDescription,
      painNarrative: requestData.request.painNarrative,
      frequency: requestData.request.frequency,
      durationMinutes: requestData.request.durationMinutes,
      peopleInvolved: requestData.request.peopleInvolved,
      tools: requestData.request.tools,
      roles: requestData.request.roles,
      complexity: requestData.classification?.complexity,
      tags: requestData.classification?.tags,
      assignedTo: requestData.assignedTo,
      comments: requestData.comments || [],
      createdAt: requestData.createdAt,
      updatedAt: requestData.updatedAt,
    };
    
    return NextResponse.json({ request: requestDetail });
  } catch (error) {
    console.error('Error fetching request details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
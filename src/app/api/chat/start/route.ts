import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { DraftConversation } from '@/lib/types/conversation';
import { collection, doc, setDoc, getDoc, doc as adminDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { generatePromptForState } from '@/lib/chat/stateMachine';

/**
 * POST /api/chat/start - Creates a new conversation draft in Firestore
 */
export async function POST(req: Request) {
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
    const userEmail = decodedToken.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile for personalized greeting
    const userProfileDoc = await getDoc(adminDoc(db, 'users', userId));
    const userProfile = userProfileDoc.exists() ? userProfileDoc.data() : null;
    
    // Generate full system prompt (used by AI engine later)
    const systemPrompt = generatePromptForState(
      { currentStep: 'init', missingProfileFields: [], collectedData: {}, validations: {} },
      userProfile
    );
    // Derive UI greeting by stripping the first line (basePrompt)
    const uiLines = systemPrompt.split('\n');
    const uiPrompt = uiLines.slice(1).join('\n').trim();

    // Create new draft conversation
    const newConversation: DraftConversation = {
      id: crypto.randomUUID(),
      userId: userId,
      status: 'draft',
      messages: [
        {
          role: 'assistant',
          content: uiPrompt,
          timestamp: Date.now()
        }
      ],
      state: {
        currentStep: 'init',
        missingProfileFields: [],
        collectedData: {},
        validations: {},
        fastTrack: false
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save to Firestore
    const conversationsRef = collection(db, 'conversations');
    await setDoc(doc(conversationsRef, newConversation.id), newConversation);

    // Return both ID and UI prompt for immediate client display
    return NextResponse.json({
      conversationId: newConversation.id,
      uiPrompt
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
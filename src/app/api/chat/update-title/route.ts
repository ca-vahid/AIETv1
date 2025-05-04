import { NextRequest, NextResponse } from "next/server";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase/firebase';

/**
 * POST /api/chat/update-title - Update the title for a conversation
 */
export async function POST(req: NextRequest) {
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
    
    // Parse request body
    const { conversationId, title } = await req.json();
    
    if (!conversationId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the conversation exists and belongs to the user
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversationData = conversationDoc.data();
    if (conversationData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update the conversation with the title
    await updateDoc(conversationRef, {
      title: title,
      updatedAt: Date.now()
    });

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error("Error updating title:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
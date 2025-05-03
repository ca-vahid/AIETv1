import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { DraftConversation } from "@/lib/types/conversation";

/**
 * GET /api/chat/load - Loads an existing conversation by ID
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
    const conversationId = searchParams.get('id');
    
    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversation ID" }, { status: 400 });
    }
    
    // Fetch the conversation from Firestore
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    
    if (!conversationDoc.exists()) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    const conversationData = conversationDoc.data() as DraftConversation;
    
    // Verify the user has access to this conversation
    if (conversationData.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized access to conversation" }, { status: 403 });
    }
    
    // Return the conversation data
    return NextResponse.json({
      conversation: {
        id: conversationData.id,
        messages: conversationData.messages,
        state: conversationData.state,
        createdAt: conversationData.createdAt,
        updatedAt: conversationData.updatedAt
      }
    });
  } catch (error) {
    console.error("Error loading conversation:", error);
    return NextResponse.json({ 
      error: "Failed to load conversation", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 
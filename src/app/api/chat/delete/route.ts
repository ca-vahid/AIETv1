import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { DraftConversation } from "@/lib/types/conversation";

/**
 * DELETE /api/chat/delete - Deletes a conversation by ID
 */
export async function DELETE(req: NextRequest) {
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
    
    // Fetch the conversation to verify ownership
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    const conversationData = conversationDoc.data() as DraftConversation;
    
    // Verify the user has access to this conversation
    if (conversationData.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized: not the owner of this conversation" }, { status: 403 });
    }
    
    // Delete the conversation
    await deleteDoc(conversationRef);
    
    return NextResponse.json({
      success: true,
      message: "Conversation deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ 
      error: "Failed to delete conversation", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 
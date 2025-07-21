import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { DraftConversation, FinalRequest } from "@/lib/types/conversation";

/**
 * DELETE /api/chat/delete - Deletes a conversation or request by ID
 */
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];

    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'draft'; 

    if (!id) {
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 });
    }

    const collectionName = type === 'request' ? 'requests' : 'conversations';
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const itemData = docSnap.data();
    if (itemData.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await deleteDoc(docRef);

    return NextResponse.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
    });
  } catch (error) {
    console.error(`Error deleting item:`, error);
    return NextResponse.json({ 
      error: `Failed to delete ${error instanceof Error ? error.message : "Unknown error"}`,
    }, { status: 500 });
  }
} 
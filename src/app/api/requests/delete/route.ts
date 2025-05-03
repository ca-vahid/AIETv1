import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { FinalRequest } from "@/lib/types/conversation";

/**
 * DELETE /api/requests/delete - Deletes a submitted request by ID
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
    const requestId = searchParams.get('id');
    
    if (!requestId) {
      return NextResponse.json({ error: "Missing request ID" }, { status: 400 });
    }
    
    // Fetch the request to verify ownership
    const requestRef = doc(db, 'requests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    
    const requestData = requestDoc.data() as FinalRequest;
    
    // Verify the user has access to this request
    if (requestData.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized: not the owner of this request" }, { status: 403 });
    }
    
    // Only allow deletion of requests that are still 'new' and not yet reviewed
    // This prevents deleting requests that are in progress or completed
    if (requestData.status !== 'new') {
      return NextResponse.json({ 
        error: "Cannot delete request", 
        message: "Only new requests that haven't been reviewed yet can be deleted."
      }, { status: 403 });
    }
    
    // Delete the request
    await deleteDoc(requestRef);
    
    return NextResponse.json({
      success: true,
      message: "Request deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting request:", error);
    return NextResponse.json({ 
      error: "Failed to delete request", 
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 
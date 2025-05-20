import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { FinalRequest } from "@/lib/types/conversation";
import { getRequestStatusLabel } from '@/lib/utils/statusUtils';

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
    
    console.log('[API /requests/:id] Returning requestData:', JSON.stringify(requestData, null, 2)); // Debug log
    
    // Check if the user is authorized to access this request
    // Either they created it or they're part of the AIET team
    const isOwner = requestData.userId === userId;
    // For now, we'll assume only the owner can view their requests
    // In a production system, you'd check if they're part of AIET team too
    
    if (!isOwner) {
      return NextResponse.json({ error: 'Not authorized to view this request' }, { status: 403 });
    }
    
    // Simply return the fetched requestData, which conforms to FinalRequest
    // The client-side RequestDetailPage will handle mapping this to its local state type if needed,
    // or can directly use the FinalRequest structure.
    return NextResponse.json({ request: requestData });
  } catch (error) {
    console.error('Error fetching request details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
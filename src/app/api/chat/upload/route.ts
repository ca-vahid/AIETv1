import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { getStorage } from 'firebase-admin/storage';
import { db } from '@/lib/firebase/firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB per file
const TOTAL_MAX_SIZE = 250 * 1024 * 1024; // 250MB total

/**
 * POST /api/chat/upload - Upload a file to Firebase Storage and update conversation
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
    
    // Get form data with the file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    // Check if conversation exists and belongs to user
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    
    const conversationData = conversationSnap.data();
    if (conversationData.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized access to conversation" }, { status: 403 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Get current attachments to check total size
    const currentAttachments = conversationData.state?.collectedData?.attachments || [];
    let currentTotalSize = 0;
    
    // Check if adding this file would exceed the total size limit
    if (currentTotalSize + file.size > TOTAL_MAX_SIZE) {
      return NextResponse.json({ 
        error: `Total attachments exceed maximum size of ${TOTAL_MAX_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    // Generate a unique filename using UUID
    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${randomUUID()}.${fileExt}`;
    const storagePath = `attachments/${conversationId}/${uniqueFileName}`;

    // Convert File to Buffer for Firebase Storage
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Firebase Storage
    const storage = getStorage(adminApp);
    const bucket = storage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '');
    const fileRef = bucket.file(storagePath);
    
    // Set contentType based on file type
    const metadata = {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        size: file.size,
        uploadedBy: userId,
        conversationId
      }
    };

    await fileRef.save(buffer, {
      metadata,
      public: false, // Not publicly accessible
    });

    // Get the file URL (signed URL valid for 1 hour)
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    // Get thumbnail URL for images
    let thumbnailUrl = null;
    if (file.type.startsWith('image/')) {
      thumbnailUrl = url; // For now, use the same URL; could generate actual thumbnails later
    }

    // Prepare attachment data
    const attachment = {
      name: file.name,
      url,
      path: storagePath,
      type: file.type,
      size: file.size,
      thumbnailUrl,
      uploadedAt: Date.now()
    };

    // Add the attachment to the conversation document
    await updateDoc(conversationRef, {
      'state.collectedData.attachments': arrayUnion(attachment),
      updatedAt: Date.now()
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

/**
 * PUT /api/chat/language - Update the preferred language for a conversation
 */
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { conversationId, language } = await req.json();
    if (!conversationId || !language) {
      return NextResponse.json({ error: 'Missing conversationId or language' }, { status: 400 });
    }

    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists()) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    const data = convSnap.data();
    if (data.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the language in the conversation state
    await updateDoc(convRef, {
      'state.language': language,
      updatedAt: Date.now()
    });

    return NextResponse.json({ success: true, language });
  } catch (error) {
    console.error('[API] chat/language error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
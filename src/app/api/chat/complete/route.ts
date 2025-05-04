import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { DraftConversation, FinalRequest } from '@/lib/types/conversation';

/**
 * POST /api/chat/complete - Finalize a draft conversation into a request
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing auth' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const auth = getAuth(adminApp);
    const { uid: userId } = await auth.verifyIdToken(idToken);

    const { conversationId } = await req.json();
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    const draftRef = doc(db, 'conversations', conversationId);
    const draftSnap = await getDoc(draftRef);
    if (!draftSnap.exists()) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }
    const draft = draftSnap.data() as DraftConversation;
    if (draft.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build request payload
    const requestPayload: FinalRequest = {
      id: draft.id,
      userId: draft.userId,
      profileSnapshot: {},
      status: 'new',
      title: draft.title || 'Automation Request',
      request: {
        processDescription: draft.state.collectedData.processDescription || '',
        painType: draft.state.collectedData.painType || [],
        painNarrative: draft.state.collectedData.painNarrative || '',
        frequency: draft.state.collectedData.frequency || '',
        durationMinutes: draft.state.collectedData.durationMinutes || 0,
        peopleInvolved: draft.state.collectedData.peopleInvolved || 0,
        tools: draft.state.collectedData.tools || [],
        roles: draft.state.collectedData.roles || [],
        impactScore: draft.state.collectedData.impactScore || 0,
        hoursSavedPerWeek: draft.state.collectedData.hoursSavedPerWeek || 0,
        attachments: draft.state.collectedData.attachments || []
      },
      conversation: draft.messages,
      comments: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save final request
    const reqRef = collection(db, 'requests');
    await setDoc(doc(reqRef, draft.id), requestPayload);
    // Delete draft
    await deleteDoc(draftRef);

    return NextResponse.json({ success: true, requestId: draft.id });
  } catch (err) {
    console.error('Error completing chat:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
} 
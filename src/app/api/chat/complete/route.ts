import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { DraftConversation, FinalRequest } from '@/lib/types/conversation';
// @ts-ignore
import { GoogleGenerativeAI } from '@google/generative-ai';

const THINKING_MODEL = 'gemini-2.5-pro-preview-05-06';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

    // Idempotency – if request already exists, acknowledge success
    const existingReqSnap = await getDoc(doc(db, 'requests', conversationId));
    if (existingReqSnap.exists()) {
      return NextResponse.json({ success: true, requestId: conversationId });
    }

    // Fetch draft
    const draftRef = doc(db, 'conversations', conversationId);
    const draftSnap = await getDoc(draftRef);
    if (!draftSnap.exists()) {
      // Draft already deleted (possibly by another process) – treat as success
      return NextResponse.json({ success: true, requestId: conversationId });
    }
    const draft = draftSnap.data() as DraftConversation;
    if (draft.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    /* -------------------------------------------------
       1. Call Gemini to extract structured idea card
    --------------------------------------------------*/

    let extract: any = null;
    try {
      const model = genAI.getGenerativeModel({ model: THINKING_MODEL });

      const systemPrompt = `You are AIET Intake Analyzer for a business process automation program at a large company (BGC).\n\n` +
        `Goal: Given the full intake conversation between an employee (the submitter) and the AI assistant, output ONLY a JSON object that fills an IdeaCardExtract structure so it can be displayed in the public idea gallery.\n` +
        `The gallery is visible to all employees. Names and profile photos are allowed. Attachments are shown as thumbnails only (no download links).\n\n` +
        `IdeaCardExtract TypeScript definition (return exactly these keys, no extras):\n\n` +
        `interface IdeaCardExtract {\n` +
        `  title: string;                        // Concise headline (max 100 chars)\n` +
        `  category: string;                     // Try to determine the category of the process to the best of your ability. You know the goal. Try to categorize the process as accurately as possible.\n` +
        `  painPoints: string[];                 // Bullet-style problems (max 5)\n` +
        `  processSummary: string;               // Detailed description of today's process as described by the user. Imagine you were telling the story on behalf of the user to the audience. \'s manual process\n` +
        `  frequency: string;                    // e.g. \"Daily\", \"Weekly\"\n` +
        `  durationMinutes: number;              // Typical minutes per run (integer)\n` +
        `  peopleInvolved: number;               // Count of people affected\n` +
        `  hoursSavedPerWeek: number;            // Estimated total hours saved company-wide\n` +
        `  impactNarrative: string;              // Describe the envisioned automated solution and its benefits to the team/company (e.g., improved accuracy, morale, new capabilities)\n` +
        `  tools: string[];                      // Any tools that are in use or were mentioned or could be used to automate the process\n` +
        `  roles: string[];                      // Job roles that this would effect or involve, maybedepartments\n` +
        `  complexity: 'low' | 'medium' | 'high';// Rough effort guess\n` +
        `}\n\n` +
        `Return ONLY the JSON. Do NOT wrap in markdown or commentary.`;

      const contents = [
        { role: 'user', parts: [{ text: `FULL CONVERSATION:\n${JSON.stringify(draft.messages)}\n\nSUMMARY (if any):\n${draft.state.collectedData.processDescription || ''}` }] }
      ];

      const gemRes = await model.generateContent({ contents, systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] } });
      let rawJson = (gemRes.response as any)?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

      console.log('[API /chat/complete] Raw Gemini response for extraction:\n', rawJson); // Debug log

      // Strip markdown fences if present
      if (rawJson.startsWith('```json')) {
        rawJson = rawJson.substring(7);
      }
      if (rawJson.endsWith('```')) {
        rawJson = rawJson.substring(0, rawJson.length - 3);
      }
      rawJson = rawJson.trim();

      extract = JSON.parse(rawJson);
      console.log('[API /chat/complete] Parsed Gemini extract:', JSON.stringify(extract, null, 2)); // Debug log
    } catch (extractErr) {
      console.error('Gemini extraction failed:', extractErr);
      if (extractErr instanceof Error) {
        console.error('Gemini extraction error details:', extractErr.message, extractErr.stack);
      }
    }

    // Build request payload (merge Gemini extract when available)
    const requestPayload: FinalRequest = {
      id: draft.id,
      userId: draft.userId,
      profileSnapshot: {},
      status: 'new',
      title: extract?.title || draft.title || 'Automation Request',
      request: {
        processDescription: draft.state.collectedData.processDescription || extract?.processSummary || '',
        painType: draft.state.collectedData.painType || [],
        painNarrative: draft.state.collectedData.painNarrative || '',
        frequency: extract?.frequency || draft.state.collectedData.frequency || '',
        durationMinutes: extract?.durationMinutes ?? draft.state.collectedData.durationMinutes ?? 0,
        peopleInvolved: extract?.peopleInvolved ?? draft.state.collectedData.peopleInvolved ?? 0,
        tools: extract?.tools || draft.state.collectedData.tools || [],
        roles: extract?.roles || draft.state.collectedData.roles || [],
        impactScore: 0,
        hoursSavedPerWeek: extract?.hoursSavedPerWeek ?? draft.state.collectedData.hoursSavedPerWeek ?? 0,
        attachments: draft.state.collectedData.attachments || [],
        category: extract?.category || 'Other',
        painPoints: extract?.painPoints || [],
        processSummary: extract?.processSummary || '',
      },
      complexity: extract?.complexity || 'medium',
      attachmentsSummary: {
        count: (draft.state.collectedData.attachments || []).length,
        ...( (draft.state.collectedData.attachments || [])[0]?.url ? { firstThumbUrl: (draft.state.collectedData.attachments || [])[0]?.url } : {})
      },
      commentsCount: 0,
      upVotes: 0,
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
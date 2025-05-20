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
 * POST /api/chat/complete/stream - Finalize a draft conversation into a request (streaming)
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // Helper to wrap streaming logic
  const stream = new ReadableStream({
    async start(controller) {
      try {
        /* 1. Auth */
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          controller.enqueue(encoder.encode('ERROR:Missing auth'));
          controller.close();
          return;
        }
        const idToken = authHeader.split('Bearer ')[1];
        const auth = getAuth(adminApp);
        const { uid: userId } = await auth.verifyIdToken(idToken);

        /* 2. Body */
        const { conversationId } = await req.json();
        if (!conversationId) {
          controller.enqueue(encoder.encode('ERROR:Missing conversationId'));
          controller.close();
          return;
        }

        /* 3. Idempotency */
        const existingReqSnap = await getDoc(doc(db, 'requests', conversationId));
        if (existingReqSnap.exists()) {
          controller.enqueue(encoder.encode('Request already finalized.'));
          await new Promise(resolve => setTimeout(resolve, 300));
          controller.enqueue(encoder.encode(`\nREQUEST_ID:${conversationId}`));
          controller.close();
          return;
        }

        /* 4. Fetch draft */
        controller.enqueue(encoder.encode('Starting submission process...\n'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const draftRef = doc(db, 'conversations', conversationId);
        const draftSnap = await getDoc(draftRef);
        if (!draftSnap.exists()) {
          controller.enqueue(encoder.encode('ERROR:Draft not found'));
          controller.close();
          return;
        }
        const draft = draftSnap.data() as DraftConversation;
        if (draft.userId !== userId) {
          controller.enqueue(encoder.encode('ERROR:Unauthorized'));
          controller.close();
          return;
        }

        /* -------------------------------------------------
           Stream: processing starts
        --------------------------------------------------*/
        controller.enqueue(encoder.encode('Draft retrieved successfully.\n'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        controller.enqueue(encoder.encode('Processing your request...\n'));
        await new Promise(resolve => setTimeout(resolve, 500));
        
        controller.enqueue(encoder.encode('Calling Gemini to extract idea card...\n'));
        await new Promise(resolve => setTimeout(resolve, 300));

        /* 5. Gemini extraction (stream) */
        const model = genAI.getGenerativeModel({ model: THINKING_MODEL });
        const contents = [
          {
            role: 'user',
            parts: [
              {
                text: `FULL CONVERSATION:\n${JSON.stringify(draft.messages)}\n\nSUMMARY (if any):\n${draft.state.collectedData.processDescription || ''}`
              }
            ]
          }
        ];

        const systemPrompt = `You are AIET Intake Analyzer for a business process automation program at a large company (BGC).\n\n` +
          `Goal: Given the full intake conversation between an employee (the submitter) and the AI assistant, output ONLY a JSON object that fills an IdeaCardExtract structure so it can be displayed in the public idea gallery.\n` +
          `Return ONLY the JSON. Do NOT wrap in markdown or commentary.`;

        let rawJson = '';
        // Add a short delay to simulate thinking time before we actually start the LLM request
        controller.enqueue(encoder.encode('Analyzing conversation to extract submission details...\n'));
        await new Promise(resolve => setTimeout(resolve, 700));

        const llmStream = await model.generateContentStream({
          contents,
          systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] }
        });

        for await (const chunk of llmStream.stream) {
          const text = chunk.text();
          rawJson += text;
          controller.enqueue(encoder.encode(text)); // Stream LLM output directly
        }

        controller.enqueue(encoder.encode('\nExtraction complete!\n'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        controller.enqueue(encoder.encode('Parsing response & saving...\n'));
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clean fences and parse
        let cleaned = rawJson.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);

        let extract: any = {};
        try {
          extract = JSON.parse(cleaned);
          controller.enqueue(encoder.encode('Successfully parsed submission details.\n'));
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          // JSON parse failed, continue with empty extract
          console.error('Failed to parse Gemini extract:', err);
          controller.enqueue(encoder.encode('Warning: Encountered issues parsing the output, but continuing with available data...\n'));
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        /* 6. Build payload */
        controller.enqueue(encoder.encode('Building final request from collected data...\n'));
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const attachmentsArr = draft.state.collectedData.attachments || [];
        const firstThumbUrl = attachmentsArr[0]?.url;

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
            count: attachmentsArr.length,
            ...(firstThumbUrl ? { firstThumbUrl } : {})
          },
          commentsCount: 0,
          upVotes: 0,
          conversation: draft.messages,
          comments: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        /* 7. Save & cleanup */
        controller.enqueue(encoder.encode('Saving final request to database...\n'));
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const reqRef = collection(db, 'requests');
        await setDoc(doc(reqRef, draft.id), requestPayload);
        
        controller.enqueue(encoder.encode('Cleaning up draft conversation...\n'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await deleteDoc(draftRef);

        controller.enqueue(encoder.encode('Done! Your idea has been successfully submitted.\n'));
        await new Promise(resolve => setTimeout(resolve, 500));
        
        controller.enqueue(encoder.encode(`REQUEST_ID:${draft.id}`));
        controller.close();
      } catch (err) {
        console.error('Error in streaming complete:', err);
        controller.enqueue(encoder.encode('ERROR:Internal error processing your request. Please try again.\n'));
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
} 
import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { DraftConversation, FinalRequest } from '@/lib/types/conversation';
import { genAI, buildRequest } from '@/lib/genai';
import { Type } from '@google/genai';

const THINKING_MODEL = 'gemini-2.5-pro';

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
        
        controller.enqueue(encoder.encode('🧠 Calling AI to analyze and extract idea details...\n'));
        await new Promise(resolve => setTimeout(resolve, 300));

        /* ---------------- 5. Gemini extraction --------------- */
        // Build a text transcript the model can ingest
        const transcript = draft.messages
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n');

        const systemPrompt = `You are AIET Intake Analyzer for a business-process automation program at a large company (BGC Engineering).\n\n` +
          `Goal: Given the full intake conversation between an employee (the submitter) and the AI assistant, output ONLY a JSON object that fills an IdeaCardExtract structure so it can be displayed in the public idea gallery.\n` +
          `The gallery is visible to all employees. Names and profile photos are allowed. Attachments are shown as thumbnails only (no download links).\n\n` +
          `IdeaCardExtract TypeScript definition (return exactly these keys, no extras):\n\n` +
          `interface IdeaCardExtract {\n` +
          `  title                 // Concise headline (max 100 chars)\n` +
          `  category              // Category of the current process (e.g., Finance, HR, Field Work, IT)\n` +
          `  painPoints            // Bullet-style problems (max 5) the user is facing today\n` +
          `  processSummary        // Narrative of today’s manual process in first-person on behalf of the user\n` +
          `  frequency             // How often the process happens (e.g., Daily, Weekly)\n` +
          `  durationMinutes       // Typical minutes per run (integer)\n` +
          `  peopleInvolved        // Number of people affected or participating\n` +
          `  hoursSavedPerWeek     // Estimated total hours saved company-wide after automation (integer)\n` +
          `  impactNarrative       // Describe the envisioned automated solution and its benefits\n` +
          `  tools                 // Tools / systems currently used or mentioned\n` +
          `  roles                 // Job roles or departments involved or impacted\n` +
          `  complexity            // 'low' | 'medium' | 'high' – rough implementation effort\n` +
          `}\n\n` +
          `Return ONLY the JSON. Do NOT wrap in markdown or commentary.`;
        
        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            processSummary: { type: Type.STRING },
            frequency: { type: Type.STRING },
            durationMinutes: { type: Type.NUMBER },
            peopleInvolved: { type: Type.NUMBER },
            tools: { type: Type.ARRAY, items: { type: Type.STRING } },
            roles: { type: Type.ARRAY, items: { type: Type.STRING } },
            hoursSavedPerWeek: { type: Type.NUMBER },
            category: { type: Type.STRING },
            painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
            complexity: { type: Type.STRING },
          },
          required: [
            'title',
            'processSummary',
            'frequency',
            'durationMinutes',
            'peopleInvolved',
            'tools',
            'roles',
            'hoursSavedPerWeek',
            'category',
            'painPoints',
            'complexity',
          ],
        };

        // Use streaming so we can show thinking progress
        const analysisStream = await genAI.models.generateContentStream(
          buildRequest(
            THINKING_MODEL,
            [
              { role: 'user', parts: [{ text: transcript }] },
            ],
            undefined,
            {
              systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }],
              },
              config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                thinkingConfig: { includeThoughts: true },
              },
            }
          )
        );

        // Collect and stream JSON chunks so the client sees AI’s extraction progress
        let rawJson = '';
        for await (const chunk of analysisStream as any) {
          const candidates = chunk.candidates ?? [];
          for (const cand of candidates) {
            const partsArr = cand.content?.parts ?? [];
            for (const p of partsArr) {
              if (!p.text) continue;
              if (p.thought) {
                // Thought summary – stream prefixed so UI can style
                controller.enqueue(encoder.encode(`🤔 ${p.text}\n`));
              } else {
                // Actual JSON content
                rawJson += p.text;
                controller.enqueue(encoder.encode(p.text));
              }
            }
          }
        }

        // Remove markdown code fences if present
        rawJson = rawJson.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

        let extract: any = {};
        try {
          extract = JSON.parse(rawJson);
          controller.enqueue(encoder.encode('\n\n✅ Extraction complete!\n'));
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          console.error('Failed to parse Gemini extract:', err);
          controller.enqueue(encoder.encode('⚠️ Warning: Encountered issues parsing the AI output, continuing...\n'));
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        /* 6. Build payload */
        controller.enqueue(encoder.encode('\n🏗️ Building final request from collected data...\n'));
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const attachmentsArr = draft.state.collectedData.attachments || [];
        const firstThumbUrl = attachmentsArr[0]?.url;

        // Determine if this should be shared in gallery based on data quality
        const title = extract?.title || draft.title || 'Automation Request';
        const hasGoodTitle = title && title.trim() !== '' && title !== 'Automation Request';
        const hasDescription = (extract?.processSummary && extract.processSummary.trim() !== '') ||
                             (draft.state.collectedData.processDescription && draft.state.collectedData.processDescription.trim() !== '');
        const shouldShare = hasGoodTitle && hasDescription;

        const requestPayload: FinalRequest = {
          id: draft.id,
          userId: draft.userId,
          profileSnapshot: {},
          status: 'new',
          title,
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
            chatSummary: draft.state.collectedData.chatSummary || '',
          },
          complexity: extract?.complexity || 'medium',
          attachmentsSummary: {
            count: attachmentsArr.length,
            ...(firstThumbUrl ? { firstThumbUrl } : {})
          },
          commentsCount: 0,
          upVotes: 0,
          shared: shouldShare, // Only share if quality is good
          conversation: draft.messages,
          comments: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        // Log sharing decision for debugging
        console.log(`[Complete] Setting shared=${shouldShare} for "${title}" (hasGoodTitle=${hasGoodTitle}, hasDescription=${hasDescription})`);

        /* 7. Save & cleanup */
        controller.enqueue(encoder.encode('💾 Saving final request to database...\n'));
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const reqRef = collection(db, 'requests');
        await setDoc(doc(reqRef, draft.id), requestPayload);
        
        controller.enqueue(encoder.encode('🧹 Cleaning up draft conversation...\n'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await deleteDoc(draftRef);

        controller.enqueue(encoder.encode('\n🎉 Done! Your idea has been successfully submitted.\n'));
        await new Promise(resolve => setTimeout(resolve, 500));
        
        controller.enqueue(encoder.encode(`REQUEST_ID:${draft.id}`));
        controller.close();
      } catch (err) {
        console.error('Error in streaming complete:', err);
        controller.enqueue(encoder.encode('❌ ERROR: Internal error processing your request. Please try again.\n'));
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
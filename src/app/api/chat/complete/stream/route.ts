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
        
        controller.enqueue(encoder.encode('🧠 Calling AI to analyze and extract idea details...\n'));
        await new Promise(resolve => setTimeout(resolve, 300));

        /* 5. Gemini extraction (stream with thinking) */
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

        let rawJson = '';
        let thinkingBegan = false;
        
        // Add a short delay to simulate thinking time before we actually start the LLM request
        controller.enqueue(encoder.encode('\n🤔 AI is thinking...\n'));
        controller.enqueue(encoder.encode('───────────────────────\n'));

        // Cast to any to allow experimental thinkingConfig parameter
        const llmStream = await model.generateContentStream({
          contents,
          systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
          thinkingConfig: { includeThoughts: true }
        } as any);

        for await (const chunk of llmStream.stream) {
          const text = chunk.text();
          
          // Check if this is a thinking part (for models that support it)
          // Since thinking mode is experimental, we'll handle both cases
          const isThinking = chunk.candidates?.[0]?.content?.parts?.some((part: any) => part.thought === true);
          
          if (isThinking && text) {
            if (!thinkingBegan) {
              thinkingBegan = true;
              controller.enqueue(encoder.encode('💭 AI Thinking Process:\n'));
            }
            // Format thinking text with indentation
            const thoughtLines = text.split('\n').map(line => `   │ ${line}`).join('\n');
            controller.enqueue(encoder.encode(thoughtLines + '\n'));
          } else if (text) {
            // This is the actual output
            if (thinkingBegan) {
              controller.enqueue(encoder.encode('───────────────────────\n'));
              controller.enqueue(encoder.encode('📝 Extracting submission details:\n\n'));
              thinkingBegan = false;
            }
            rawJson += text;
            // Show the JSON being built but formatted nicely
            controller.enqueue(encoder.encode(text));
          }
        }

        controller.enqueue(encoder.encode('\n\n✅ Extraction complete!\n'));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        controller.enqueue(encoder.encode('🔍 Parsing response & validating...\n'));
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clean fences and parse
        let cleaned = rawJson.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);

        let extract: any = {};
        try {
          extract = JSON.parse(cleaned);
          controller.enqueue(encoder.encode('✅ Successfully parsed submission details.\n'));
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (err) {
          // JSON parse failed, continue with empty extract
          console.error('Failed to parse Gemini extract:', err);
          controller.enqueue(encoder.encode('⚠️ Warning: Encountered issues parsing the output, but continuing with available data...\n'));
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        /* 6. Build payload */
        controller.enqueue(encoder.encode('\n🏗️ Building final request from collected data...\n'));
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
          shared: true,
          conversation: draft.messages,
          comments: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

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
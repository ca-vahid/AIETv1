import { NextRequest, NextResponse } from "next/server";
import { 
  collection, doc, getDoc, updateDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { Message } from "@/lib/types/conversation";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
// @ts-ignore: missing type declarations for @google/generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  analyseUserMessage,
  reducer as conversationReducerNew,
  promptFor,
  Transition,
} from "@/lib/conversation/stateMachine";

// Remove Edge runtime configuration
// export const runtime = 'edge';

// Initialize the Gemini API with the key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Define models - use the latest ones

const STANDARD_MODEL = "gemini-2.5-flash-preview-04-17";
const THINKING_MODEL = "gemini-2.5-pro-preview-03-25";

/**
 * POST /api/chat/message - Processes a user message and generates a response using Gemini
 */
export async function POST(req: NextRequest) {
  console.log("\x1b[36m%s\x1b[0m", "[API] Chat message request received");
  
  try {
    // Get the Firebase ID token from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("\x1b[31m%s\x1b[0m", "[API] Missing or invalid authorization header");
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // Verify the ID token
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;
    const origin = req.nextUrl.origin;
    
    console.log("\x1b[32m%s\x1b[0m", `[API] Authenticated user: ${userEmail}`);
    
    if (!userEmail) {
      console.log("\x1b[31m%s\x1b[0m", "[API] User email not found in token");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const requestBody = await req.json();
    const { conversationId, message, command, isCommand } = requestBody;
    // Explicitly check if useThinkingModel is defined to distinguish between undefined and false
    const useThinkingModel = requestBody.useThinkingModel;
    
    if (!conversationId || (!message && !command)) {
      console.log("\x1b[31m%s\x1b[0m", "[API] Missing required fields in request");
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log("\x1b[36m%s\x1b[0m", `[API] Processing message for conversation: ${conversationId}`);

    // Get conversation from Firestore
    const conversationsRef = collection(db, 'conversations');
    const conversationDoc = await getDoc(doc(conversationsRef, conversationId));
    
    if (!conversationDoc.exists()) {
      console.log("\x1b[31m%s\x1b[0m", `[API] Conversation not found: ${conversationId}`);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversationData = conversationDoc.data();
    // Migrate legacy state steps to new flow
    const origState = conversationData.state;
    let baseState = origState;
    if (origState.currentStep === 'summary_lite') {
      baseState = { ...baseState, currentStep: 'decision' };
    }
    if (origState.currentStep === 'full_details') {
      baseState = { ...baseState, currentStep: 'details' };
    }

    if (conversationData.userId !== userId) {
      console.log("\x1b[31m%s\x1b[0m", `[API] User not authorized to access this conversation`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Normalize command string once (we'll reuse it later)
    const cmd = command?.toUpperCase();

    // Build a user message so the LLM sees explicit intent.
    // If a textual message is provided, use it directly. Otherwise, synthesize a marker message
    // for command-based actions (e.g., *GO DEEPER*, *SUBMIT*). This helps the model understand
    // the user decision and avoids repeating the decision prompt.
    let userMessage: Message | null = null;

    if (message) {
      userMessage = { role: 'user', content: message, timestamp: Date.now() };
    } else if (cmd === 'GO_DEEPER') {
      userMessage = { role: 'user', content: '*GO DEEPER*', timestamp: Date.now() };
    } else if (cmd === 'SUBMIT') {
      userMessage = { role: 'user', content: '*SUBMIT*', timestamp: Date.now() };
    }

    // Get user profile if needed (using migrated baseState)
    let userProfile;
    if (baseState.currentStep === 'init') {
      console.log("\x1b[36m%s\x1b[0m", "[API] Fetching user profile for initial conversation");
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        userProfile = userDoc.data();
      }
    }

    // Determine transition using migrated baseState
    let transition: Transition | null = null;
    if (cmd === 'GO_DEEPER') {
      transition = { type: 'NEXT', step: 'details' };
    } else if (cmd === 'SUBMIT') {
      transition = { type: 'NEXT', step: 'submit' };
    } else if (isCommand && message === 'continue_to_summary' && baseState.currentStep === 'attachments') {
      // Handle special command to continue from attachments to summary
      console.log("\x1b[36m%s\x1b[0m", "[API] Processing continue_to_summary command");
      transition = { type: 'NEXT', step: 'summary' };
      // Create a synthetic user message to show in chat
      userMessage = { 
        role: 'user', 
        content: "I'm done adding attachments. Let's continue to the summary.", 
        timestamp: Date.now() 
      };
    } else if (message) {
      // Need full history for the logic checker
      const fullHistory = conversationData.messages.concat([
        { role: 'user', content: message, timestamp: Date.now() }
      ]);
      transition = await analyseUserMessage(
         { role: 'user', content: message, timestamp: Date.now() },
         baseState,
         fullHistory // Pass history here
       );
    }

    const newStatePreLLM = transition
      ? conversationReducerNew(baseState, transition)
      : baseState;

    // Generate prompt for the *updated* state so LLM knows context and preferred language
    const language = conversationData.state.language || 'en';
    const systemPrompt = `Please respond in ${language}. ` + promptFor(newStatePreLLM, userProfile);
    console.log("\x1b[36m%s\x1b[0m", `[API] Prompting for state: ${newStatePreLLM.currentStep} (Previous: ${baseState.currentStep})`);

    try {
      // Choose model based on user preference (prioritize) over automatic state-based selection
      let MODEL;
      
      // If useThinkingModel is explicitly set (not undefined), honor that choice
      if (useThinkingModel !== undefined) {
        MODEL = useThinkingModel ? THINKING_MODEL : STANDARD_MODEL;
      } else {
        // Otherwise, fall back to state-based selection
        MODEL = newStatePreLLM.currentStep === 'summary' ? THINKING_MODEL : STANDARD_MODEL;
      }
      
      console.log("\x1b[33m%s\x1b[0m", `[API] Using model: ${MODEL} (state-based or user-selected thinking model: ${useThinkingModel})`);
      
      // Convert our message format to Gemini format
      const chatHistory = [];
      
      // Add past conversation messages in pairs
      for (let i = 0; i < conversationData.messages.length; i++) {
        const msg = conversationData.messages[i];
        chatHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
      
      console.log("\x1b[32m%s\x1b[0m", "[API] Creating model with system instructions");
      
      // Get the generative model
      const model = genAI.getGenerativeModel({
        model: MODEL,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          // Allow larger responses to reduce MAX_TOKENS truncation issues
          maxOutputTokens: 2048,
        }
      });
      
      console.log("\x1b[32m%s\x1b[0m", "[API] Preparing model contents with chat history");
      
      // Include the latest user action (text or synthesized) so the model sees the intent.
      const contents = [
        ...chatHistory,
        ...(userMessage ? [{ role: 'user', parts: [{ text: userMessage.content }] }] : [])
      ];
      
      // Track state that may change during streaming (e.g., details -> attachments auto jump)
      let finalState = newStatePreLLM;
      
      // Stream the response using generateContentStream
      console.log("\x1b[32m%s\x1b[0m", "[API] Sending message stream with Gemini API");
      const responseStream = await model.generateContentStream({
        contents,
        // systemInstruction must be a Content object, not plain string.
        systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
      });
      
      // Use ReadableStream for proper server-sent events
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Collect the full message
            let assistantMessage = '';
            let draftDeleted = false;
            
            // Stream each chunk directly to the client
            for await (const chunk of responseStream.stream) {
              const text = chunk.text();
              assistantMessage += text;
              
              // Send just the text without SSE formatting
              controller.enqueue(new TextEncoder().encode(text));
            }
            
            console.log("\x1b[32m%s\x1b[0m", "[API] Gemini response streaming complete");
            
            // Check finish reason – if the model stopped because we hit the token limit, treat as failure
            try {
              const finishReason = (responseStream as any).response?.candidates?.[0]?.finishReason;
              if (finishReason === 'MAX_TOKENS') {
                throw new Error('LLM_MAX_TOKENS');
              }
            } catch (_) {
              // best-effort – ignore if structure differs
            }
            
            // Create assistant message for Firestore
            const newAssistantMessage: Message = {
              role: 'assistant',
              content: assistantMessage,
              timestamp: Date.now()
            };
            
            // Auto-transition if assistant signals details completion
            let newState = newStatePreLLM;
            if (
              baseState.currentStep === 'details' &&
              newStatePreLLM.currentStep === 'details' &&
              /\[DETAILS COMPLETED\]/i.test(assistantMessage)
            ) {
              console.log(
                "\x1b[32m%s\x1b[0m",
                '[API] Detected [DETAILS COMPLETED], auto-transitioning: details -> attachments'
              );
              newState = conversationReducerNew(newStatePreLLM, {
                type: 'NEXT',
                step: 'attachments',
              });
            }
            
            // Update messages in conversation data
            const updatedMessages = [
              ...conversationData.messages,
              ...(userMessage ? [userMessage] : []),
              newAssistantMessage,
            ];
            
            if (transition) {
              console.log(
                "\x1b[33m%s\x1b[0m",
                `[API] State transition detected: ${conversationData.state.currentStep} -> ${newState.currentStep}`
              );
            }
            
            // Debug logging for details transition conditions
            if (conversationData.state.currentStep === 'details' && !transition) {
              const d = conversationData.state.collectedData;
              console.log("\x1b[35m%s\x1b[0m", `[API DEBUG] details data check:`);
              console.log("\x1b[35m%s\x1b[0m", `- tools: ${JSON.stringify(d.tools)}, isArray: ${Array.isArray(d.tools)}, length: ${Array.isArray(d.tools) ? d.tools.length : 0}`);
              console.log("\x1b[35m%s\x1b[0m", `- frequency: ${d.frequency}`);
              console.log("\x1b[35m%s\x1b[0m", `- impactNarrative: ${d.impactNarrative}`);
              const gotCount = [
                Array.isArray(d.tools) && d.tools.length > 0,
                !!d.frequency,
                !!d.impactNarrative
              ].filter(Boolean).length;
              console.log("\x1b[35m%s\x1b[0m", `- gotCount: ${gotCount} (needs 2+ to advance)`);
            }
            
            // Handle completion only once - prevent race conditions
            let shouldComplete = false;
            
            // Get the last user message once
            const lastUserMsg = updatedMessages.filter(m => m.role === 'user').pop();
            
            // Check if this is an explicit "go deeper" request to prevent auto-completion
            const isExplicitGoDeeper = lastUserMsg && /^\*GO DEEPER\*/i.test(lastUserMsg.content);
            
            // Check if we need to complete the chat (but don't do it yet)
            // Case 1: Just moved to submit state
            if (!isExplicitGoDeeper && conversationData.state.currentStep !== 'submit' && newState.currentStep === 'submit') {
              shouldComplete = true;
            }
            
            // Case 2: User confirmed in summary state
            if (!isExplicitGoDeeper && lastUserMsg && 
                conversationData.state.currentStep === 'summary' &&
                /\b(yes|confirm|looks good|submit|done|finish|send)\b/i.test(lastUserMsg.content) &&
                !shouldComplete) {
              shouldComplete = true;
            }
            
            // Save to Firestore first if we're not going to finalize
            if (!shouldComplete) {
              await updateDoc(doc(conversationsRef, conversationId), {
                messages: updatedMessages,
                state: newState,
                updatedAt: Date.now()
              });
              console.log("\x1b[32m%s\x1b[0m", "[API] Conversation updated in Firestore");
            }
            
            // Persist to outer scope for header usage
            finalState = newState;
            
            controller.close();
          } catch (streamError) {
            console.error("\x1b[31m%s\x1b[0m", `[API] Error processing stream: ${streamError}`);
            controller.enqueue(new TextEncoder().encode(`Error processing stream. Please try again.`));
            controller.close();
          }
        }
      });
      
      // Determine model name for display - include actual model name for debugging
      const modelType = MODEL === THINKING_MODEL ? "thinking" : "standard";
      const modelName = MODEL.split('/').pop() || MODEL;
      
      // Return the raw stream response with model info in headers
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Model-Used': modelType,
          'X-Model-Name': modelName,
          'X-Conversation-State': finalState.currentStep
        },
      });
    } catch (error) {
      console.error("\x1b[31m%s\x1b[0m", `[API] Error in streaming response: ${error}`);
      return NextResponse.json({ 
        error: 'Error generating response', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", `[API] Error processing message: ${error}`);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { 
  collection, doc, getDoc, updateDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { Message } from "@/lib/types/conversation";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  analyzeConversation, 
  conversationReducer, 
  generatePromptForState 
} from "@/lib/chat/stateMachine";

// Remove Edge runtime configuration
// export const runtime = 'edge';

// Initialize the Gemini API with the key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Define models - use the latest ones
// const STANDARD_MODEL = "gemini-1.5-flash";
// const THINKING_MODEL = "gemini-1.5-pro";
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
    const { conversationId, message } = requestBody;
    // Explicitly check if useThinkingModel is defined to distinguish between undefined and false
    const useThinkingModel = requestBody.useThinkingModel;
    
    if (!conversationId || !message) {
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
    if (conversationData.userId !== userId) {
      console.log("\x1b[31m%s\x1b[0m", "[API] User not authorized to access this conversation");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add user message to conversation
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };

    // Get user profile if needed
    let userProfile;
    if (conversationData.state.currentStep === 'init') {
      console.log("\x1b[36m%s\x1b[0m", "[API] Fetching user profile for initial conversation");
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        userProfile = userDoc.data();
      }
    }

    // Generate appropriate prompt based on current state
    const systemPrompt = generatePromptForState(conversationData.state, userProfile);
    console.log("\x1b[36m%s\x1b[0m", `[API] Current conversation state: ${conversationData.state.currentStep}`);

    try {
      // Choose model based on user preference (prioritize) over automatic state-based selection
      let MODEL;
      
      // If useThinkingModel is explicitly set (not undefined), honor that choice
      if (useThinkingModel !== undefined) {
        MODEL = useThinkingModel ? THINKING_MODEL : STANDARD_MODEL;
      } else {
        // Otherwise, fall back to state-based selection
        MODEL = conversationData.state.currentStep === 'summary' ? THINKING_MODEL : STANDARD_MODEL;
      }
      
      console.log("\x1b[33m%s\x1b[0m", `[API] Using model: ${MODEL} (user selected thinking model: ${useThinkingModel})`);
      
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
          maxOutputTokens: 1000,
        }
      });
      
      console.log("\x1b[32m%s\x1b[0m", "[API] Preparing model contents with chat history");
      
      // Create contents array with chat history plus the new message
      const contents = [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] }
      ];
      
      // Stream the response using generateContentStream
      console.log("\x1b[32m%s\x1b[0m", "[API] Sending message stream with Gemini API");
      const responseStream = await model.generateContentStream({
        contents: contents,
        systemInstruction: systemPrompt, // Set as a separate parameter
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
            
            // Create assistant message for Firestore
            const newAssistantMessage: Message = {
              role: 'assistant',
              content: assistantMessage,
              timestamp: Date.now()
            };
            
            // Update messages in conversation data
            const updatedMessages = [...conversationData.messages, userMessage, newAssistantMessage];
            
            // Analyze conversation for state transitions
            const stateTransition = analyzeConversation(updatedMessages, conversationData.state);
            const newState = stateTransition 
              ? conversationReducer(conversationData.state, stateTransition)
              : conversationData.state;
            
            if (stateTransition) {
              console.log("\x1b[33m%s\x1b[0m", `[API] State transition detected: ${conversationData.state.currentStep} -> ${newState.currentStep}`);
            }
            
            // Debug logging for full_details transition conditions
            if (conversationData.state.currentStep === 'full_details' && !stateTransition) {
              const d = conversationData.state.collectedData;
              console.log("\x1b[35m%s\x1b[0m", `[API DEBUG] full_details data check:`);
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
            
            // Check if we need to complete the chat (but don't do it yet)
            // Case 1: Just moved to submit state
            if (conversationData.state.currentStep !== 'submit' && newState.currentStep === 'submit') {
              shouldComplete = true;
            }
            
            // Case 2: User confirmed in summary state
            const lastUserMsg = updatedMessages.filter(m => m.role === 'user').pop();
            if (lastUserMsg && 
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
            
            // Now handle the completion if needed (after we've saved non-finalizing updates)
            if (shouldComplete) {
              try {
                console.log("\x1b[33m%s\x1b[0m", `[API] Finalizing draft into request: ${conversationId}`);
                const completeRes = await fetch(`${origin}/api/chat/complete`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                  },
                  body: JSON.stringify({ conversationId })
                });
                if (completeRes.ok) {
                  console.log("\x1b[32m%s\x1b[0m", `[API] Draft ${conversationId} finalized into request`);
                  draftDeleted = true; // don't try to update deleted doc
                } else {
                  console.error("\x1b[31m%s\x1b[0m", `[API] Failed to finalize draft: ${await completeRes.text()}`);
                  
                  // If we failed to finalize, still try to save the state update
                  if (!draftDeleted) {
                    await updateDoc(doc(conversationsRef, conversationId), {
                      messages: updatedMessages,
                      state: newState,
                      updatedAt: Date.now()
                    });
                  }
                }
              } catch (completeErr) {
                console.error("\x1b[31m%s\x1b[0m", `[API] Error calling complete endpoint: ${completeErr}`);
                
                // If completion failed, still try to save the state update
                if (!draftDeleted) {
                  await updateDoc(doc(conversationsRef, conversationId), {
                    messages: updatedMessages,
                    state: newState,
                    updatedAt: Date.now()
                  });
                }
              }
            }
            
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
          'X-Model-Name': modelName
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
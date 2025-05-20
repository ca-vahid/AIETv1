import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { DraftConversation } from '@/lib/types/conversation';
import { collection, doc, setDoc, getDoc, doc as adminDoc } from 'firebase/firestore';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { promptFor } from '@/lib/conversation/stateMachine';
// @ts-ignore - No types available for @google/generative-ai
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini for start prompt generation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const START_MODEL_NAME = process.env.GEMINI_START_MODEL || 'gemini-2.5-flash-preview-04-17';
const startModel = genAI.getGenerativeModel({ model: START_MODEL_NAME });

/**
 * POST /api/chat/start - Creates a new conversation draft in Firestore
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
    const userEmail = decodedToken.email;
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile for personalized greeting
    const userProfileDoc = await getDoc(adminDoc(db, 'users', userId));
    const userProfile = userProfileDoc.exists() ? userProfileDoc.data() : null;
    
    // Scaffold: Generate personalized first prompt via Gemini API
    let uiPrompt: string;
    // Default language code
    let detectedLanguage = 'en';
    const defaultName = userProfile?.name?.split(' ')[0] || 'there';
    const defaultGreeting = `Hi ${defaultName}! Welcome to the AIET Intake Portal. ` +
      `I'm AIET-IntakeBot, here to help you submit tasks for automation. ` +
      `What task would you like to automate today?`;
    // Debug vars to track prompt and AI response
    let extractionPrompt = '';
    let aiText = '';
    try {
      // Remove photoUrl before sending profile to Gemini
      const { photoUrl, ...profileWithoutPhoto } = userProfile || {};
      const userProfileJson = JSON.stringify(profileWithoutPhoto);
      extractionPrompt = `You are a AI assistant working for BGC Engineering & Cambio Earth's AI Efficiency Team.
Your goal is to welcome and guide new users into our AI Intake Portal, which helps them share processes that can be streamlined or enhanced using Generative AI.
You have the user's profile as JSON: ${userProfileJson}.
Extract the following details:
- Location: as an object with "country" and "city"
- First Name
- Job
- Title
- Preferred Language: infer from location and name
Then generate a personalized greeting in the user's preferred language. The greeting should:
- Use a warm, engaging tone, be witty, and customize your tone based on the user job and title.
- Reference the user's name, and try to reference thier location and role indirectly, but dont just mention it word by word, be creative. Try to make it personal, not generic that you just read it from their card!
- Briefly explain our AI Intake Portal purpose and invite them to describe a task to automate
Output a JSON object with two keys:
  "extracted": { "location": { "country": string, "city": string }, "firstName": string, "job": string, "title": string, "language": string },
  "prompt": "HTML with emojis and highlighitng important points <personalized greeting in the inferred language>"`;
      // Debug: log the prompt sent to Gemini
      console.debug("Gemini extraction prompt:", extractionPrompt);
      // Simple single argument call - most compatible format
      const result = await startModel.generateContent(extractionPrompt);
      aiText = await result.response.text(); // capture raw AI response
      // Debug: log the raw AI response from Gemini
      console.debug("Gemini raw response:", aiText);
      // Strip Markdown code fences if present
      let jsonString = aiText.trim();
      const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
      const match = jsonString.match(codeBlockRegex);
      if (match && match[1]) {
        jsonString = match[1];
      }
      // Parse JSON output from Gemini
      const parsed = JSON.parse(jsonString);
      // Debug: log the parsed JSON object from Gemini
      console.debug("Parsed Gemini output:", parsed);
      // Capture inferred language from extracted data
      if (parsed.extracted?.language) {
        detectedLanguage = parsed.extracted.language;
      }
      uiPrompt = typeof parsed.prompt === 'string' ? parsed.prompt : defaultGreeting;
      // const extracted = parsed.extracted; // extracted details if needed
    } catch (err) {
      console.error("Error generating or parsing personalized prompt via Gemini:", err);
      console.error("Extraction prompt was:", extractionPrompt);
      console.error("Raw AI response was:", aiText);
      uiPrompt = defaultGreeting;
    }

    // Create new draft conversation
    const newConversation: DraftConversation = {
      id: crypto.randomUUID(),
      userId: userId,
      status: 'draft',
      messages: [
        {
          role: 'assistant',
          content: uiPrompt,
          timestamp: Date.now()
        }
      ],
      state: {
        currentStep: 'init',
        missingProfileFields: [],
        collectedData: {},
        validations: {},
        // Initialize conversation language
        language: detectedLanguage,
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Save to Firestore
    const conversationsRef = collection(db, 'conversations');
    await setDoc(doc(conversationsRef, newConversation.id), newConversation);

    // Return both ID, UI prompt, and detected language for immediate client display
    return NextResponse.json({
      conversationId: newConversation.id,
      uiPrompt,
      language: detectedLanguage
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
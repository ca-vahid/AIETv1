import { NextRequest, NextResponse } from "next/server";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase/firebase';
import { genAI, buildRequest } from "@/lib/genai";

const MODEL_NAME = "gemini-1.5-flash";

/**
 * POST /api/chat/generate-title
 * Generates a title for the conversation using Gemini based on full conversation history.
 */
export async function POST(req: NextRequest) {
  try {
    // Get the Firebase ID token from the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    
    // Verify the ID token
    const auth = getAuth(adminApp);
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Parse request body; only conversationId and isDetailed needed
    const { conversationId, isDetailed = false } = await req.json();
    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    // Check if the conversation exists and belongs to the user
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const conversationData = conversationDoc.data();
    if (conversationData.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Build full conversation transcript from stored messages
    const allMessages = conversationData.messages as Array<{ role: string; content: string }>;
    const transcript = allMessages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // Generate title using Gemini with full conversation history
    const prompt = isDetailed
      ? `You have access to a user's request and the assistant's response for creating an automation using new AI methods and system  Generate a title for their request. Make it engaging and intersting (max 15 words) \n\n${transcript}`
      : `You have access to a user's request and the assistant's response for creating an automation using new AI methods and system  Generate a title for their request. Make it engaging and intersting (max 15 words) \n\n${transcript}`;

    const response = await genAI.models.generateContent(
      buildRequest(MODEL_NAME, prompt)
    );
    const titleProp = (response as any).text;
    const title = typeof titleProp === 'function' ? titleProp() : titleProp;

    if (!title) {
      throw new Error("Failed to generate title text from LLM");
    }

    console.log(`[API TitleGen] ${isDetailed ? 'Detailed' : 'Initial'} Title: "${title}" using full conversation history`);

    // Update the conversation with the generated title
    await updateDoc(conversationRef, {
      title: title,
      updatedAt: Date.now()
    });

    return NextResponse.json({ title: title });
  } catch (error) {
    console.error("[API TitleGen] Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate title", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 
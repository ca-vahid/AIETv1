import { NextRequest, NextResponse } from "next/server";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase/firebase';
// @ts-ignore: missing type declarations for @google/generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with the key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use a fast model for titles

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
      ? `Generate a concise and informative (max 15 words) detailed title for this conversation:\n\n${transcript}`
      : `Generate a concise and informative (max 15 words) title for this conversation:\n\n${transcript}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const generatedTitle = response.text().trim().replace(/^"|"$/g, ''); // Clean up quotes

    if (!generatedTitle) {
      throw new Error("Failed to generate title text from LLM");
    }

    console.log(`[API TitleGen] ${isDetailed ? 'Detailed' : 'Initial'} Title: "${generatedTitle}" using full conversation history`);

    // Update the conversation with the generated title
    await updateDoc(conversationRef, {
      title: generatedTitle,
      updatedAt: Date.now()
    });

    return NextResponse.json({ title: generatedTitle });
  } catch (error) {
    console.error("[API TitleGen] Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate title", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from '@/lib/firebase/firebase';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with the key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * POST /api/chat/generate-title - Generate a title for an automation request from the process description
 */
export async function POST(req: NextRequest) {
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
    
    // Parse request body
    const { conversationId, description } = await req.json();
    
    if (!conversationId || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if the conversation exists and belongs to the user
    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversationData = conversationDoc.data();
    if (conversationData.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate title using Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 100
      }
    });

    const prompt = `
Generate a concise, professional title for this automation request. 
The title should capture the essence of what is being automated in 4-8 words.
Do not include phrases like "Automation of" or "Request for" - just the core concept.

Process Description: ${description}

Respond ONLY with a JSON object in the following format:
{"title": "Your generated title here"}

No explanation, markdown, or any other text. Just the JSON object.
`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    // Parse the JSON response
    const responseText = result.response.text();
    let titleData: { title: string };
    
    try {
      // Try to parse the JSON response
      titleData = JSON.parse(responseText.trim());
    } catch (e) {
      // If parsing fails, extract the title using regex (fallback)
      const titleMatch = responseText.match(/"title"\s*:\s*"([^"]+)"/);
      if (titleMatch && titleMatch[1]) {
        titleData = { title: titleMatch[1] };
      } else {
        // Last resort fallback - use the response text directly if it's short and sensible
        const cleanText = responseText.trim().replace(/^"|"$/g, '');
        if (cleanText.length > 0 && cleanText.length < 50 && !cleanText.includes('{') && !cleanText.includes('}')) {
          titleData = { title: cleanText };
        } else {
          // Final fallback
          titleData = { title: "Automation Request" };
        }
      }
    }

    // Update the conversation with the generated title
    await updateDoc(conversationRef, {
      title: titleData.title,
      updatedAt: Date.now()
    });

    return NextResponse.json({ title: titleData.title });
  } catch (error) {
    console.error("Error generating title:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
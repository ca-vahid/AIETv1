import { genAI, buildRequest } from "@/lib/genai";
import { Message } from "@/lib/types/conversation";

/**
 * Result from logic checker.
 */
export interface CheckResult {
  /** Whether the criterion is met (yes = true, no = false) */
  satisfied: boolean;
  /** LLM's explanation of its decision */
  reasoning: string;
  /** Raw parsed JSON from LLM for debugging */
  rawResponse: any;
}

// Use the thinking model for logic checks
const THINKING_MODEL = "gemini-2.5-flash-preview-05-20";

/**
 * Checks if a criterion is satisfied by the conversation messages using an LLM.
 * @param messages   Array of past conversation messages.
 * @param criterion  A one-sentence requirement to test (e.g. "User provided a lite description").
 * @returns          Promise resolving to CheckResult.
 */
export async function checkCriterion(
  messages: Message[],
  criterion: string
): Promise<CheckResult> {
  // Build JSON-only prompt
  const prompt = `You are a logic-checker that evaluates a chat transcript against a criterion.
Reply ONLY with valid JSON:

{
  "satisfied": true|false,
  "reasoning": "..."
}

Transcript:
${JSON.stringify(messages, null, 2)}

Criterion:
"${criterion}"`;

  // Call the LLM with error handling for max tokens or throttling errors
  let result;
  try {
    const request = buildRequest(THINKING_MODEL, prompt, undefined, {
      config: { temperature: 0 },
    });
    result = await genAI.models.generateContent(request);
  } catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "[LogicChecker] Error generating content:", error);
    return {
      satisfied: false,
      reasoning: `LLM error: ${error instanceof Error ? error.message : error}`,
      rawResponse: error
    };
  }
  const response = result as any;
  console.log("[LogicChecker] Full API Response Object:", JSON.stringify(response, null, 2));

  if (!response) {
     console.error("\x1b[31m%s\x1b[0m", "[LogicChecker] Error: API response object is missing.");
     return { satisfied: false, reasoning: "API response object missing", rawResponse: null };
  }
  
  let text: string;
  try {
    const maybeText = (response as any).text;
    text = typeof maybeText === 'function' ? maybeText() : maybeText;
  } catch (e) {
    console.error("\x1b[31m%s\x1b[0m", "[LogicChecker] Error extracting text:", e);
    return { satisfied: false, reasoning: `Error extracting text: ${e}`, rawResponse: response };
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    console.warn("\x1b[33m%s\x1b[0m", "[LogicChecker] Warning: API returned empty or non-string text.", `Raw text: '${text}'`);
    // Attempt to get reasoning from potential safety feedback if text is empty
    const safetyReason = response.candidates?.[0]?.finishReason === 'SAFETY' ? 'Blocked due to safety concerns.' : 'No text content received from API.';
    return { satisfied: false, reasoning: safetyReason, rawResponse: response }; // Return the full response object for inspection
  }

  console.log("\x1b[35m%s\x1b[0m", "[LogicChecker] Raw text from API:", text);

  // Try parsing JSON
  try {
    // Strip potential markdown fences (```json ... ``` or ``` ... ```)
    const cleanedText = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(cleanedText);
    return {
      satisfied: Boolean(parsed.satisfied),
      reasoning: String(parsed.reasoning || '').trim(),
      rawResponse: parsed,
    };
  } catch (err) {
    // Fallback: attempt to extract satisfied and reasoning via regex
    const cleaned = text.replace(/```/g, '').trim();
    const satMatch = /"satisfied"\s*:\s*(true|false)/i.exec(cleaned);
    const satisfied = satMatch ? satMatch[1].toLowerCase() === 'true' : false;
    const reasonMatch = /"reasoning"\s*:\s*"([^"]*)"/i.exec(cleaned);
    const reasoning = reasonMatch
      ? reasonMatch[1]
      : `Incomplete or malformed JSON from LLM: ${cleaned}`;
    console.warn("[LogicChecker] Falling back on regex parse:", { satisfied, reasoning });
    return {
      satisfied,
      reasoning,
      rawResponse: cleaned,
    };
  }
} 
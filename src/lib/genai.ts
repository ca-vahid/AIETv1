import { GoogleGenAI } from "@google/genai";

// Shared singleton instance configured with env var key (if present)
export const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export type GenerationConfig = NonNullable<Parameters<(typeof genAI)["models"]["generateContent"]>[0]["config"]>;

// Convenience helper to build the request payload consistently
export function buildRequest(
  model: string,
  contents: any,
  generationConfig?: GenerationConfig,
  extra?: Omit<Parameters<(typeof genAI)["models"]["generateContent"]>[0], "model" | "contents" | "config">,
) {
  return {
    model,
    contents,
    ...(generationConfig ? { config: generationConfig } : {}),
    ...(extra || {}),
  } as const;
} 
import AppHeader from "@/components/AppHeader";
import { useTheme } from "@/lib/contexts/ThemeContext";
import React from "react";

export default function Changelog() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
          <div className="p-8 md:p-12">
            <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-4">
              What's New in AIET v1.5.1
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Release Date: July 19, 2024
            </p>

            <div className="space-y-10">
              {/* Feature: Quick Submit */}
              <div>
                <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-3 border-b-2 border-blue-200 dark:border-blue-800 pb-2">
                  🚀 New Feature: Quick Submit Workflow
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  Introducing a streamlined way to submit your automation ideas! For users who have their thoughts and documents ready, the new "Quick Submit" path allows you to bypass the guided chat. Simply paste your text, upload supporting files, and send it off for AI analysis.
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                  <li><strong>Modal-based selection:</strong> Choose between "Chat with AI" and "Quick Upload" right from the home page.</li>
                  <li><strong>Rich text and file uploads:</strong> A dedicated page to paste detailed descriptions and upload multiple documents.</li>
                  <li><strong>Automated Submission:</strong> The system automatically packages your content and runs it through the same powerful AI analysis and submission pipeline as the chat, without requiring further interaction.</li>
                </ul>
              </div>

              {/* Improvement: Redesigned Home Page */}
              <div>
                <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-3 border-b-2 border-emerald-200 dark:border-emerald-800 pb-2">
                  ✨ Improvement: Redesigned Post-Login Experience
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  We've overhauled the page you see after logging in to provide a cleaner, more professional, and intuitive experience.
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                  <li><strong>Modern UI:</strong> Replaced large, colorful cards with a sleek, button-based design that aligns with a professional enterprise look.</li>
                  <li><strong>Clearer Actions:</strong> Renamed "Discover & Innovate" to "Submit Idea" and "My Projects" to "My Ideas" for better clarity.</li>
                  <li><strong>New Admin Link:</strong> Added a quick link to the Admin Portal for easy access.</li>
                </ul>
              </div>

              {/* Tech Upgrade: Gemini SDK Migration */}
              <div>
                <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-3 border-b-2 border-purple-200 dark:border-purple-800 pb-2">
                  🔧 Tech Upgrade: Migration to Latest Google Gemini SDK
                </h2>
                <p className="text-slate-700 dark:text-slate-300 mb-4">
                  The entire backend has been migrated from the legacy <code>@google/generative-ai</code> to the new <code>@google/genai</code> SDK. This significant upgrade unlocks powerful new capabilities and improves reliability.
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                  <li><strong>Enforced JSON Output:</strong> We now use `responseSchema` to force the AI to return structured JSON, dramatically improving the reliability of data extraction during the final submission analysis.</li>
                  <li><strong>Streaming "Thinking":</strong> The submission modal now shows the AI's "thought process" in real-time by streaming `thinking summaries`, giving you better insight as it analyzes your idea.</li>
                  <li><strong>Improved Stability:</strong> Resolved numerous bugs related to API instruction handling, ensuring the AI consistently follows its system prompts.</li>
                </ul>
              </div>

              {/* Bug Fixes */}
              <div>
                <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-3 border-b-2 border-amber-200 dark:border-amber-800 pb-2">
                  🐞 Bug Fixes & General Polish
                </h2>
                <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                  <li>Fixed a critical bug where the `systemInstruction` was being ignored by the Gemini API during submission, causing poor quality data extraction.</li>
                  <li>Corrected multiple `TypeError: chunk.text is not a function` errors by properly handling streaming responses from the new SDK.</li>
                  <li>Ensured the submission modal remains open and displays the full, real-time log of the AI's analysis and thinking process.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
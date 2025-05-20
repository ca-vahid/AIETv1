'use client';

import React, { useState, useCallback } from 'react';
import ChatWindow from "@/components/ChatWindow";
import AppHeader from "@/components/AppHeader";
import StateStepper from "@/components/StateStepper";
import Link from "next/link";
import { useSessionProfile } from "@/lib/contexts/SessionProfileContext";
import { getIdToken } from "firebase/auth";

export default function ChatPage() {
  const { firebaseUser } = useSessionProfile();
  const [currentStep, setCurrentStep] = useState<string>('init');

  // Handler for StateStepper click
  const handleGotoStep = useCallback(async (step: string) => {
    if (!firebaseUser) return;
    
    try {
      const idToken = await getIdToken(firebaseUser);
      // For the root chat page, we don't have conversationId in URL
      // It will need to be provided by ChatWindow once created
      // This will be hooked up when the user starts a chat
      console.log(`Would navigate to step ${step} if chatId was available`);
    } catch (err) {
      console.error("Error navigating to step:", err);
    }
  }, [firebaseUser]);

  // Callback for ChatWindow to update the step
  const handleStepChange = useCallback((newStep: string) => {
    setCurrentStep(newStep);
  }, []);

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <AppHeader />
      
      <main className="flex-1 bg-gradient-to-b from-slate-900 to-transparent p-4 md:p-6 flex gap-4 md:gap-6 overflow-hidden">
        <div className="flex-shrink-0 w-48 hidden md:block">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-800/60 rounded-lg shadow-md mb-4 backdrop-blur-sm">
            <Link 
              href="/"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        <div className="flex-1 h-full">
          <ChatWindow 
            currentStep={currentStep} 
            onStepChange={handleStepChange} 
          />
        </div>

        <div className="flex-shrink-0 w-16 h-full flex items-center">
          <StateStepper currentStep={currentStep} onStepClick={handleGotoStep} />
        </div>
      </main>
    </div>
  );
} 
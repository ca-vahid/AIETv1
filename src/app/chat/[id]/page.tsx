'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ChatWindow from "@/components/ChatWindow";
import AppHeader from "@/components/AppHeader";
import StateStepper from "@/components/StateStepper";
import Link from "next/link";
import { useSessionProfile } from "@/lib/contexts/SessionProfileContext";
import { getIdToken } from "firebase/auth";

interface ChatIdPageProps {
  params: { id: string };
}

export default function ChatIdPage({ params }: ChatIdPageProps) {
  const { id: conversationId } = params;
  const { firebaseUser } = useSessionProfile();
  const [currentStep, setCurrentStep] = useState<string>('init');
  const [isLoading, setIsLoading] = useState(false);

  const handleGotoStep = useCallback(async (step: string) => {
    if (!firebaseUser || !conversationId || isLoading) return;
    setIsLoading(true);
    try {
      const idToken = await getIdToken(firebaseUser);
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          conversationId: conversationId,
          command: `GO_TO_${step.toUpperCase()}`,
        }),
      });
      if (!res.ok) throw new Error('Failed state change');
      const headerState = res.headers.get('X-Conversation-State');
      if (headerState) setCurrentStep(headerState);
      console.log("TODO: Wire up streaming response display after step jump.")
    } catch (err) {
      console.error("Error jumping state:", err);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser, conversationId, isLoading]);

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
              className="text-blue-400 hover:text-blue-300 text-fluid-sm flex items-center"
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
            conversationId={conversationId} 
            currentStep={currentStep}
            onStepChange={handleStepChange}
          />
        </div>

        <div className="flex-shrink-0 w-20 md:w-[clamp(4rem,5vw,6rem)] h-full flex items-center mr-2">
          <StateStepper currentStep={currentStep} onStepClick={handleGotoStep} />
        </div>
      </main>
    </div>
  );
} 
'use client';

import ChatWindow from "@/components/ChatWindow";
import AppHeader from "@/components/AppHeader";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ExistingChatPage() {
  const params = useParams();
  const conversationId = params.id as string;
  
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 bg-gradient-to-b from-slate-900 to-transparent p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-800/60 rounded-lg shadow-md mb-4 backdrop-blur-sm">
            <Link 
              href="/chats"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to My Requests
            </Link>
          </div>
          
          <div className="h-[70vh] md:h-[calc(100vh-10rem)]">
            <ChatWindow conversationId={conversationId} />
          </div>
        </div>
      </main>
    </div>
  );
} 
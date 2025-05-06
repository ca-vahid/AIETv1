'use client';

import Link from 'next/link';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import { signOut } from '@/lib/firebase/firebaseUtils';
import { useState, useEffect } from 'react';
import { useTheme } from "@/lib/contexts/ThemeContext";
import { usePathname } from 'next/navigation';

// Current version of the application
const APP_VERSION = 'v1.3.8';
// Release date
const RELEASE_DATE = 'May 5, 2024';

// Changelog entries - newest first
const CHANGELOG = [
  {
    version: 'v1.3.8',
    date: 'May 5, 2024',
    changes: [
      'Enhanced state visualization with premium glassmorphism effects',
      'Added special color-coding for decision and submit step icons',
      'Improved progress indicator with gradient animation',
      'Fixed line extension bug at final state',
      'Added subtle animation effects to active icons',
      'Upgraded loading indicators with fluid animations'
    ]
  },
  {
    version: 'v1.3.7',
    date: 'May 5, 2024',
    changes: [
      'Redesigned landing page with improved layout and visual hierarchy',
      'Added multilingual support indicators with six language options',
      'Enhanced sign-in experience with dark/light mode compatibility',
      'Improved "How It Works" section with more detailed process explanation',
      'Added file upload capability indicator for better user guidance',
      'Streamlined login panel design to match application style'
    ]
  },
  {
    version: 'v1.3.6',
    date: 'May 4, 2024',
    changes: [
      'Improved details phase completion with automatic transition on [DETAILS COMPLETED]',
      'Fixed LLM system instructions for Go Deeper flow to ensure correct prompting',
      'Enhanced conversation state management for smoother user experience',
      'Optimized state transitions to require fewer user interactions',
      'Fixed detection of LLM markers to ensure proper state progression'
    ]
  },
  {
    version: 'v1.3.5',
    date: 'May 4, 2024',
    changes: [
      'Added interactive state visualization with vertical stepper UI',
      'Implemented smooth animations between conversation states',
      'Added ability to navigate directly to any state by clicking on the stepper',
      'Improved dark mode support with automatic theme detection',
      'Fixed scrollbar issues for cleaner UI appearance',
      'Enhanced title generation to provide better summaries based on context',
      'Added two-stage title generation for more detailed titles after deeper conversations',
      'Improved layout spacing and visual hierarchy for better user experience'
    ]
  },
  {
    version: 'v1.3.0',
    date: 'May 4, 2024',
    changes: [
      'Added voice input functionality for chat messages',
      'Integrated Microsoft Azure Speech Services for superior speech recognition',
      'Improved voice input UI with direct text input to chat box',
      'Enhanced microphone button with visual recording indicators',
      'Added support for appending voice input to existing text'
    ]
  },
  {
    version: 'v1.2.6',
    date: 'May 3, 2024',
    changes: [
      'Added automatic title generation for automation requests',
      'Updated request list view to display generated titles instead of conversation snippets',
      'Generated titles appear after first description message and in the requests list',
      'Improved request browsing experience with more descriptive titles'
    ]
  },
  {
    version: 'v1.2.5',
    date: 'May 3, 2025',
    changes: [
      'Added fast-track intake flow with first two questions only',
      'Introduced multilingual greeting and automatic language detection',
      'Hid the initial system prompt from UI for cleaner chat view',
      'Restored bootstrapping logic to load initial prompt via API',
      'Added UI decision buttons (Submit Now / Go Deeper)',
      'UX refinements and stability improvements'
    ]
  },
  {
    version: 'v1.2.1',
    date: 'May 3, 2025',
    changes: [
      'Fixed chat history bug causing unintended deletion of valid drafts',
      'Fixed text rendering issues with unescaped apostrophes',
      'Improved theme consistency across various UI elements'
    ]
  },
  {
    version: 'v1.2.0',
    date: 'May 3, 2025',
    changes: [
      'Added Dark/Light mode toggle with system preference detection',
      'Improved color schemes and contrast in both light and dark modes',
      'Enhanced UI styling for better readability and visual consistency',
      'Updated button colors and styling for better accessibility',
      'Improved text contrast in chat interface',
      'Various UI refinements and performance improvements'
    ]
  },
  {
    version: 'v1.1.0',
    date: 'May 3, 2025',
    changes: [
      'Improved UI for better user experience',
      'Moved "My Requests" from header to home page',
      'Added request statistics and status breakdown on home page',
      'Enhanced chat history filtering to hide empty conversations',
      'Fixed index creation error handling',
      'Improved error handling for undefined values'
    ]
  },
  {
    version: 'v1.0',
    date: 'May 3, 2025',
    changes: [
      'Initial release of the AIET Intake Portal',
      'Added Azure AD integration with Firebase Auth',
      'Added Microsoft Graph API integration to fetch user profiles',
      'Created profile card component with automatic profile photo fetching',
      'Implemented modern chat interface with streaming responses',
      'Added support for rich text formatting in chat messages',
      'Implemented conversation state machine for guided task submission',
      'Added model selection toggle between standard and advanced AI models',
      'Added support for Gemini API with streaming responses',
      'Optimized chat page layout for better screen utilization'
    ]
  }
];

// Changelog Modal Component
function ChangelogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="theme-panel rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Changelog</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          {CHANGELOG.map((release, index) => (
            <div key={index} className={index > 0 ? "mt-6" : ""}>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-blue-400">{release.version}</h3>
                <span className="text-sm text-slate-400">({release.date})</span>
              </div>
              <ul className="mt-2 space-y-1 list-disc list-inside text-slate-300">
                {release.changes.map((change, idx) => (
                  <li key={idx} className="text-sm">{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppHeader() {
  const { profile, isLoading } = useSessionProfile();
  const isLoggedIn = !!profile;
  const [changelogOpen, setChangelogOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [useThinkingModel, setUseThinkingModel] = useState(false);
  
  // Determine if we're in a chat page by checking URL
  const isChatPage = pathname && pathname.includes('/chat/');
  const chatId = isChatPage ? pathname.split('/').pop() : '';
  
  // Toggle model function that will be used when in a chat
  const toggleModel = () => {
    setUseThinkingModel(prev => !prev);
    // Export function to window for ChatWindow to access
    if (typeof window !== 'undefined') {
      (window as any).chatWindowToggleModel = () => {
        setUseThinkingModel(prev => !prev);
      };
    }
  };

  // Call toggleModel on mount to initialize window function
  useEffect(() => {
    toggleModel();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/'; // Redirect to home page
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header className={`${theme === "dark" ? "theme-panel" : "theme-panel-light"} shadow-md sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Left side: Logo and optional back button */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold text-blue-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1.5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
              </svg>
              AIET Portal
            </Link>
            
            {/* Version tag moved near logo */}
            <button 
              onClick={() => setChangelogOpen(true)}
              className="text-xs px-2 py-0.5 bg-blue-900 text-blue-300 rounded hover:bg-blue-800 transition"
            >
              {APP_VERSION}
            </button>
          </div>
          
          {/* Center: Chat controls when in chat page */}
          <div className="flex-1 flex justify-center items-center">
            {isChatPage && (
              <div className="flex items-center gap-6">
                <Link 
                  href="/chats"
                  className="text-slate-200 hover:text-white text-sm flex items-center px-3 py-1 bg-slate-700/40 rounded-lg transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to Home
                </Link>
                
                <div className="text-white/90 text-sm flex items-center">
                  <div className="w-5 h-5 rounded-full bg-blue-700 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  </div>
                  <span className="text-white">AIET Intake Chat</span>
                </div>
                
                <div className="flex items-center bg-slate-700/50 py-0.5 px-2 rounded-full">
                  <span className="text-sm mr-2 whitespace-nowrap text-white/90">
                    Standard
                  </span>
                  <button 
                    onClick={toggleModel}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                      useThinkingModel ? 'bg-blue-400' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                        useThinkingModel ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Right side: Theme toggle and user controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3.75A.75.75 0 0 1 12.75 3h.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-.5A.75.75 0 0 1 12 4.25v-.5zM6.22 5.03a.75.75 0 0 1 1.06 0l.35.35a.75.75 0 0 1-1.06 1.06l-.35-.35a.75.75 0 0 1 0-1.06zM3 11.25A.75.75 0 0 1 3.75 10.5h.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-.5A.75.75 0 0 1 3 12.25v-.5zM6.22 18.97a.75.75 0 0 1 1.06 0l.35-.35a.75.75 0 0 1 1.06 1.06l-.35.35a.75.75 0 0 1-1.06-1.06zM11.25 21a.75.75 0 0 1-.75-.75v-.5a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-.5zM17.43 18.62a.75.75 0 0 1 0-1.06l.35-.35a.75.75 0 0 1 1.06 1.06l-.35.35a.75.75 0 0 1-1.06 0zM20.25 11.25A.75.75 0 0 1 21 10.5h.5a.75.75 0 0 1 .75.75v.5a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1-.75-.75v-.5zM17.43 5.38a.75.75 0 0 1 1.06 0l.35.35a.75.75 0 0 1-1.06 1.06l-.35-.35a.75.75 0 0 1 0-1.06z" />
                  <path d="M12 6.75a5.25 5.25 0 1 0 5.25 5.25A5.26 5.26 0 0 0 12 6.75Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-200" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21.752 15.002a9 9 0 0 1-11.807-11.8a.75.75 0 0 0-1.071-.858A10.501 10.501 0 1 0 22.61 16.073a.75.75 0 0 0-.858-1.071Z" />
                </svg>
              )}
            </button>
            
            {/* User info and sign out */}
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-300 hidden sm:inline">
                  Hello, {profile.name.split(' ')[0]}
                </span>
                {profile.photoUrl && (
                  <img 
                    src={profile.photoUrl} 
                    alt={profile.name}
                    className="w-7 h-7 rounded-full border border-slate-600 shadow-sm object-cover hidden sm:block"
                  />
                )}
                <button
                  onClick={handleSignOut}
                  className="text-sm text-red-400 hover:text-red-300 transition flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              null
            )}
          </div>
        </div>
      </header>
      
      {/* Changelog Modal */}
      <ChangelogModal isOpen={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </>
  );
} 
'use client';

import Link from 'next/link';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import { signOut } from '@/lib/firebase/firebaseUtils';
import { useState, useEffect } from 'react';
import { useTheme } from "@/lib/contexts/ThemeContext";
import { usePathname } from 'next/navigation';

// Current version of the application
const APP_VERSION = 'v1.5.0';
// Release date
const RELEASE_DATE = 'May 30, 2025';

// Changelog entries - newest first
const CHANGELOG = [
  {
    version: 'v1.5.0',
    date: 'May 30, 2025',
    changes: [
      'Added password-protected admin portal for managing submissions',
      'Implemented search and filter functionality in admin dashboard',
      'Updated admin page layout to 40/60 split for better alignment',
      'Clamped chat card previews and ensured delete button visibility',
      'Refined 3D card effects and removed excessive lift',
      'Standardized header and footer logos for BGC consistency',
      'Multiple bug fixes and performance improvements'
    ]
  },
  {
    version: 'v1.4.5',
    date: 'May 19, 2025',
    changes: [
      'Redesigned landing page with three clear primary options: Submit Idea, View Submissions, and Browse Gallery',
      'Streamlined profile card with compact view option and removed edit button',
      'Improved layout with card-based design for better user experience',
      'Enhanced visual hierarchy with dedicated action cards for main user flows',
      'Optimized profile information display for better readability',
      'Added hover effects to navigation cards for improved interactivity'
    ]
  },
  {
    version: 'v1.4.0',
    date: 'May 18, 2025',
    changes: [
      'Completely redesigned decision UI for a more compact, intuitive experience',
      'Added ultra-compact floating action buttons for decision choices',
      'Improved user experience by disabling chat input during decision phase',
      'Enhanced error handling with automatic retry button for LLM token limit errors',
      'Fixed MAX_TOKENS errors with larger output token allowance',
      'Added distinct visual styling for decision buttons with vivid gradients'
    ]
  },
  {
    version: 'v1.3.9',
    date: 'May 17, 2025',
    changes: [
      'Added dynamic pulsing color-loading bar and "Loading... Please Wait" indicator',
      'Added streaming text animation for initial assistant message',
      'Updated personalized greeting logic to use new Gemini prompts',
      'Removed default greeting override to allow dynamic Gemini prompts',
      'Bumped version to v1.3.9'
    ]
  },
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
  const { theme } = useTheme();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col ${
        theme === 'dark' 
          ? 'bg-slate-800 border border-slate-700' 
          : 'bg-white border border-slate-200'
      }`}>
        <div className={`p-4 flex items-center justify-between ${
          theme === 'dark' 
            ? 'border-b border-slate-700 bg-slate-800' 
            : 'border-b border-slate-200 bg-slate-50'
        }`}>
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>Changelog</h2>
          <button onClick={onClose} className={`${theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          {CHANGELOG.map((release, index) => (
            <div key={index} className={index > 0 ? "mt-6" : ""}>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>{release.version}</h3>
                <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>({release.date})</span>
              </div>
              <ul className={`mt-2 space-y-1 list-disc list-inside ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                {release.changes.map((change, idx) => (
                  <li key={idx} className="text-sm">{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className={`p-4 ${
          theme === 'dark' 
            ? 'border-t border-slate-700 bg-slate-800' 
            : 'border-t border-slate-200 bg-slate-50'
        }`}>
          <button 
            onClick={onClose}
            className={`w-full py-2 rounded transition ${
              theme === 'dark' 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
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
      <header className={`sticky top-0 z-50 backdrop-blur-xl ${ 
        theme === 'dark'
          ? 'bg-gradient-to-r from-[#0a1628]/95 via-[#0f1f3d]/95 to-[#0a1628]/95 shadow-2xl border-b border-[#0066cc]/20'
          : 'bg-gradient-to-r from-[#e6f0ff]/90 via-[#f0f6ff]/95 to-[#e6f0ff]/90 shadow-lg border-b border-[#0066cc]/15'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-1.5 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Left side: Logo and optional back button */}
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold flex items-center transition-all transform hover:scale-105 group">
              <div className={`relative p-1.5 rounded-xl border border-[#0066cc]/30 shadow-lg group-hover:shadow-[#0066cc]/25 transition-all backdrop-blur-sm ${
                theme === 'dark' 
                  ? 'bg-white/90' 
                  : 'bg-gradient-to-br from-[#0066cc]/20 to-[#004080]/20'
              }`}>
                <img 
                  src="/images/bgc-logo.png" 
                  alt="BGC Engineering Logo" 
                  className="h-8 w-8 object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="ml-3">
                <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#0080ff]">AI Idea Portal</span>
                <div className={`text-xs font-medium -mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-[#0066cc]/70'}`}>BGC Engineering</div>
              </div>
            </Link>
            
            {/* Version tag updated with animation */}
            <button 
              onClick={() => setChangelogOpen(true)}
              className="relative px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#0066cc] to-[#004080] text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-[#0066cc]/30"
            >
              <span className="relative z-10">{APP_VERSION}</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0066cc] to-[#004080] opacity-70 blur-sm"></div>
            </button>
          </div>
          
          {/* Center: Chat controls when in chat page */}
          <div className="flex-1 flex justify-center items-center">
            {isChatPage && (
              <div className="flex items-center gap-6">
                <Link 
                  href="/chats"
                  className={`text-sm font-semibold flex items-center px-3 py-1.5 rounded-xl transition-all transform hover:scale-105 shadow-lg border backdrop-blur-sm ${
                    theme === 'dark'
                      ? 'text-slate-200 hover:text-white bg-[#0066cc]/20 hover:bg-[#0066cc]/30 border-[#0066cc]/30'
                      : 'text-[#0066cc] hover:text-[#004080] bg-white/70 hover:bg-white/90 border-[#0066cc]/20'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Back to Excavation Site
                </Link>
                
                <Link 
                  href="/requests"
                  className={`text-sm font-semibold flex items-center px-3 py-1.5 rounded-xl transition-all transform hover:scale-105 shadow-lg border backdrop-blur-sm ${
                    theme === 'dark'
                      ? 'text-slate-200 hover:text-white bg-[#0066cc]/20 hover:bg-[#0066cc]/30 border-[#0066cc]/30'
                      : 'text-[#0066cc] hover:text-[#004080] bg-white/70 hover:bg-white/90 border-[#0066cc]/20'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Innovation Gallery
                </Link>
              </div>
            )}
          </div>
          
          {/* Right side: Theme toggle and user controls */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className={`p-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0066cc] transition-all transform hover:scale-105 backdrop-blur-sm ${
                theme === 'light' ? 'bg-white/70 hover:bg-white/90 border border-[#0066cc]/20' : 'bg-[#0066cc]/10 hover:bg-[#0066cc]/20 border border-[#0066cc]/30'
              }`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <span className={`ml-2 text-sm font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-[#0066cc]'}`}>
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
            
            {/* User info and sign out */}
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-3 px-3 py-1.5 rounded-xl border backdrop-blur-sm ${
                  theme === 'dark' 
                    ? 'bg-[#0066cc]/20 border-[#0066cc]/30'
                    : 'bg-white/70 border-[#0066cc]/20'
                }`}>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0066cc] to-[#004080] flex items-center justify-center text-white font-bold text-xs">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-white ${theme === 'dark' ? 'border-[#0a1628]' : 'border-white'}`}></div>
                  </div>
                  <div className="hidden md:block">
                    <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-[#0066cc]'}`}>{profile.name}</p>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-400' : 'text-[#0066cc]/70'}`}>{profile.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleSignOut}
                  className={`text-sm font-semibold flex items-center px-3 py-1.5 rounded-xl transition-all transform hover:scale-105 shadow-lg border backdrop-blur-sm ${
                    theme === 'dark'
                      ? 'text-slate-200 hover:text-white bg-red-600/20 hover:bg-red-600/30 border-red-600/30'
                      : 'text-red-600 hover:text-red-700 bg-white/70 hover:bg-white/90 border-red-600/20'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-[#0066cc]/70'}`}>
                Welcome to AIET Portal
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Changelog Modal */}
      <ChangelogModal isOpen={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </>
  );
} 
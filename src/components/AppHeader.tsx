'use client';

import Link from 'next/link';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import { signOut } from '@/lib/firebase/firebaseUtils';
import { useState } from 'react';

// Current version of the application
const APP_VERSION = 'v1.0';
// Release date
const RELEASE_DATE = 'May 3, 2025';

// Changelog entries - newest first
const CHANGELOG = [
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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Changelog</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          {CHANGELOG.map((release, index) => (
            <div key={index} className={index > 0 ? "mt-6" : ""}>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-blue-700">{release.version}</h3>
                <span className="text-sm text-gray-500">({release.date})</span>
              </div>
              <ul className="mt-2 space-y-1 list-disc list-inside text-gray-700">
                {release.changes.map((change, idx) => (
                  <li key={idx} className="text-sm">{change}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t">
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

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/'; // Redirect to home page
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleRefreshProfileData = () => {
    window.location.href = '/?refresh=true';
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
              </svg>
              AIET Intake Portal
            </Link>
            <button 
              onClick={() => setChangelogOpen(true)}
              className="ml-3 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition"
            >
              {APP_VERSION}
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefreshProfileData}
              className="text-sm text-blue-600 underline hover:text-blue-800 transition"
            >
              Refresh Profile Data
            </button>
            
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden sm:inline">
                  Hello, {profile.name.split(' ')[0]}
                </span>
                {profile.photoUrl && (
                  <img 
                    src={profile.photoUrl} 
                    alt={profile.name}
                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm object-cover hidden sm:block"
                  />
                )}
                <button
                  onClick={handleSignOut}
                  className="text-sm text-red-600 hover:text-red-800 transition flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
      
      {/* Changelog Modal */}
      <ChangelogModal isOpen={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </>
  );
} 
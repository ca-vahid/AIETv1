'use client';

import SignInWithAzureAD from "@/components/SignInWithAzureAD";
import ProfileCard from "@/components/ProfileCard";
import Link from "next/link";
import { useSessionProfile } from "@/lib/contexts/SessionProfileContext";
import AppHeader from "@/components/AppHeader";
import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";

// Define types for request statistics
interface RequestStats {
  totalDrafts: number;
  totalSubmitted: number;
  statusCounts: {
    new: number;
    in_review: number;
    pilot: number;
    completed: number;
    rejected: number;
  };
  loading: boolean;
  error: string | null;
}

export default function Home() {
  const { profile, isLoading, firebaseUser } = useSessionProfile();
  const isLoggedIn = !!profile;
  const [stats, setStats] = useState<RequestStats>({
    totalDrafts: 0,
    totalSubmitted: 0,
    statusCounts: { new: 0, in_review: 0, pilot: 0, completed: 0, rejected: 0 },
    loading: false,
    error: null
  });

  // Fetch request statistics
  useEffect(() => {
    if (isLoggedIn && firebaseUser) {
      const fetchStats = async () => {
        try {
          setStats(prev => ({ ...prev, loading: true, error: null }));
          
          const idToken = await getIdToken(firebaseUser);
          const response = await fetch('/api/chat/history?cleanup=false', {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch request statistics');
          }
          
          const data = await response.json();
          
          // Calculate status counts
          const statusCounts = { new: 0, in_review: 0, pilot: 0, completed: 0, rejected: 0 };
          
          // Count the statuses from the history
          if (data.history && Array.isArray(data.history)) {
            data.history.forEach((item: any) => {
              if (item.type === 'request' && item.statusCode && statusCounts.hasOwnProperty(item.statusCode)) {
                statusCounts[item.statusCode as keyof typeof statusCounts]++;
              }
            });
          }
          
          setStats({
            totalDrafts: data.totalDrafts || 0,
            totalSubmitted: data.totalSubmitted || 0,
            statusCounts,
            loading: false,
            error: null
          });
        } catch (err) {
          console.error('Error fetching request stats:', err);
          setStats(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load request statistics'
          }));
        }
      };
      
      fetchStats();
    }
  }, [isLoggedIn, firebaseUser]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Use the common AppHeader component */}
      <AppHeader />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isLoggedIn && (
          <div className="sign-in-panel rounded-xl overflow-hidden w-full max-w-lg mx-auto flex flex-col items-center relative mb-12">
            <div className="p-6 border-b border-indigo-500/30 w-full">
              <h2 className="text-xl font-semibold text-white text-center">Sign in to get started</h2>
            </div>
            <div className="p-8 flex flex-col items-center">
              <p className="theme-text-muted mb-6 text-center">Log in with your BGC Engineering or Cambio Earth account</p>
              <div className="w-full max-w-xs">
                <SignInWithAzureAD />
              </div>
            </div>
          </div>
        )}

        {isLoggedIn && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Compact Profile Card */}
            <div className="lg:col-span-4">
              <ProfileCard compact={true} />
            </div>

            {/* Main options section */}
            <div className="lg:col-span-8">
              <h2 className="text-3xl font-bold text-indigo-400 mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-indigo-100">
                Supercharge Your Workflow with AI
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Option 1: Submit an Idea */}
                <div className="theme-panel rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:ring-2 hover:ring-blue-500/50">
                  <div className="p-6 bg-gradient-to-r from-blue-900/50 to-indigo-900/50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-2">Submit an Idea</h3>
                    <p className="theme-text-muted mb-4">Start a conversation with our AI assistant to share your automation idea and challenges.</p>
                    <Link
                      href="/chat"
                      className="theme-button-primary w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md"
                    >
                      Start Chat
                    </Link>
                  </div>
                </div>

                {/* Option 2: My Submissions */}
                <div className="theme-panel rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:ring-2 hover:ring-purple-500/50">
                  <div className="p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-2">My Submissions</h3>
                    <p className="theme-text-muted mb-4">View all your submitted ideas and track their progress through the workflow.</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-slate-400">Drafts</span>
                      <span className="text-lg font-semibold text-blue-400">{stats.totalDrafts}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-slate-400">Submitted</span>
                      <span className="text-lg font-semibold text-blue-400">{stats.totalSubmitted}</span>
                    </div>
                    <Link
                      href="/chats"
                      className="theme-button-secondary w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md"
                    >
                      View Ideas
                    </Link>
                  </div>
                </div>

                {/* Option 3: Gallery */}
                <div className="theme-panel rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:ring-2 hover:ring-teal-500/50">
                  <div className="p-6 bg-gradient-to-r from-teal-900/50 to-blue-900/50 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white mb-2">Ideas Gallery</h3>
                    <p className="theme-text-muted mb-4">Explore all submitted ideas and innovations from across the organization.</p>
                    <Link
                      href="/requests"
                      className="theme-button-secondary w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md"
                    >
                      Browse Gallery
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* What Can We Automate section */}
        <div className="theme-panel rounded-xl shadow-md overflow-hidden mt-12">
          <div className="p-6 border-b border-indigo-500/30">
            <h2 className="text-2xl font-semibold text-white">What Can We Automate?</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Instrumentation Data Processing",
                  description: "Convert raw sensor readings into clean, actionable dashboards",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )
                },
                {
                  title: "Environmental Reporting & Compliance",
                  description: "Generate recurring monitoring reports and visual summaries automatically",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                },
                {
                  title: "Document Review & Summaries",
                  description: "AI-generated highlights of lengthy reports, proposals, and specifications",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  title: "Geospatial Analysis & Mapping",
                  description: "Automate GIS workflows, contour generation, and map production",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )
                }
              ].map((item, index) => (
                <div key={index} className="feature-card flex space-x-4 p-4">
                  <div className="flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-white mb-1">{item.title}</h3>
                    <p className="text-sm theme-text-muted">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="theme-panel-light border-t border-slate-600 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center theme-text-muted text-sm">
            © 2025 BGC Engineering - AI Efficiency Team
          </p>
        </div>
      </footer>
    </main>
  );
}

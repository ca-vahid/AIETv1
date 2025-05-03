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
        {/* Hero section with main CTA and profile card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left column: Welcome and CTA */}
          <div className="lg:col-span-6 flex flex-col pt-4">
            <h2 className="text-3xl leading-tight font-bold text-white mb-3">
              Simplify Your Workflow with AI Automation
            </h2>
            <p className="text-lg text-[#d1e4f1] max-w-prose mb-6">
              Got a task that's time-consuming, error-prone, or just plain annoying? 
              Let the AI Efficiency Team help automate it!
            </p>
            
            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              {!isLoggedIn && (
                <div className="theme-panel p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-medium text-white mb-3">Sign in to get started</h3>
                  <p className="theme-text-muted mb-4">Use your corporate account to access all features</p>
                  <SignInWithAzureAD />
                </div>
              )}
              
              {isLoggedIn && (
                <Link
                  href="/chat"
                  className="theme-button-primary inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Start Chat with AI Assistant
                </Link>
              )}
            </div>
            
            {/* My Requests Section (Only shown when logged in) */}
            {isLoggedIn && (
              <div className="theme-panel p-5 rounded-lg shadow-md mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">My Requests</h3>
                  <Link 
                    href="/chats" 
                    className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    View All
                  </Link>
                </div>
                
                {stats.loading ? (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
                    </div>
                  </div>
                ) : stats.error ? (
                  <p className="text-sm text-red-400 py-2">{stats.error}</p>
                ) : (
                  <div className="space-y-4">
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                        <div className="text-2xl font-semibold text-blue-400">{stats.totalDrafts}</div>
                        <div className="text-xs text-slate-300">Drafts</div>
                      </div>
                      <div className="bg-slate-800/60 rounded-lg p-3 text-center">
                        <div className="text-2xl font-semibold text-blue-400">{stats.totalSubmitted}</div>
                        <div className="text-xs text-slate-300">Submitted</div>
                      </div>
                    </div>
                    
                    {/* Status breakdown */}
                    {stats.totalSubmitted > 0 && (
                      <div>
                        <div className="text-xs font-medium text-slate-400 mb-2">Status Breakdown</div>
                        <div className="space-y-2">
                          {/* New requests */}
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-yellow-600 mr-2"></div>
                            <div className="text-xs text-slate-300 flex-1">Awaiting Review</div>
                            <div className="text-xs font-medium text-white">{stats.statusCounts.new}</div>
                          </div>
                          
                          {/* In review */}
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                            <div className="text-xs text-slate-300 flex-1">Under Review</div>
                            <div className="text-xs font-medium text-white">{stats.statusCounts.in_review}</div>
                          </div>
                          
                          {/* Pilot */}
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-600 mr-2"></div>
                            <div className="text-xs text-slate-300 flex-1">Pilot Implementation</div>
                            <div className="text-xs font-medium text-white">{stats.statusCounts.pilot}</div>
                          </div>
                          
                          {/* Completed */}
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-emerald-600 mr-2"></div>
                            <div className="text-xs text-slate-300 flex-1">Completed</div>
                            <div className="text-xs font-medium text-white">{stats.statusCounts.completed}</div>
                          </div>
                          
                          {/* Rejected */}
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                            <div className="text-xs text-slate-300 flex-1">Not Feasible</div>
                            <div className="text-xs font-medium text-white">{stats.statusCounts.rejected}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {stats.totalDrafts === 0 && stats.totalSubmitted === 0 && (
                      <p className="text-sm text-slate-400 text-center py-1">
                        No requests yet. Start a chat to create one!
                      </p>
                    )}
                    
                    {/* Create new request button */}
                    <div className="pt-2">
                      <Link
                        href="/chat"
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 rounded flex items-center justify-center transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        New Request
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Right column: Profile card */}
          <div className="lg:col-span-6 flex justify-end">
            {isLoggedIn ? (
              <ProfileCard onEditClick={() => window.location.href = "/profile/edit"} />
            ) : (
              <div className="theme-panel p-8 rounded-lg shadow-md flex flex-col items-center justify-center h-full min-h-[300px] max-w-md">
                <div className="rounded-full bg-blue-900/50 p-6 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Your Profile</h3>
                <p className="theme-text-muted text-center">Sign in to view your profile information</p>
              </div>
            )}
          </div>
        </div>
        
        {/* How It Works section (simplified) */}
        <div className="theme-panel rounded-xl shadow-md mb-12 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">How It Works</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-400">1</span>
                </div>
                <h3 className="font-medium text-white mb-2">Sign in with Azure AD</h3>
                <p className="theme-text-muted text-sm">We'll use your existing corporate account to pre-fill your profile info.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-400">2</span>
                </div>
                <h3 className="font-medium text-white mb-2">Tell us about your task</h3>
                <p className="theme-text-muted text-sm">Our AI assistant will have a quick chat to understand what you need.</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-900/50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-semibold text-blue-400">3</span>
                </div>
                <h3 className="font-medium text-white mb-2">Confirm and submit</h3>
                <p className="theme-text-muted text-sm">Review the summary and we'll get back to you within one business day.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* What Can We Automate section - simplified card grid */}
        <div className="theme-panel rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">What Can We Automate?</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: "Data Entry & Processing",
                  description: "Manual form filling, data extraction from documents, spreadsheet work",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )
                },
                {
                  title: "Report Generation",
                  description: "Monthly reports, status updates, data visualization",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )
                },
                {
                  title: "Document Processing",
                  description: "Contract analysis, document classification, content extraction",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  title: "Repetitive Communications",
                  description: "Email templates, status updates, notifications",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )
                }
              ].map((item, index) => (
                <div key={index} className="theme-panel-light flex space-x-4 p-4 rounded-lg border hover:shadow-md transition-shadow">
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

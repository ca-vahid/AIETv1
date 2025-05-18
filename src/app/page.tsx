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
            <h2 className="text-4xl sm:text-5xl leading-tight font-bold text-white mb-5 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-indigo-100">
              Unlock AI &amp; Automation Opportunities at BGC Engineering&nbsp;&amp; Cambio Earth
            </h2>
            <p className="text-xl text-blue-100 max-w-prose mb-8">
              We&apos;re on a mission to uncover everyday processes that can be streamlined or enhanced with the latest Generative&nbsp;AI models. Share your pain points—from spreadsheet wrangling to document review—and our AI Efficiency Team will explore how automation can help.
            </p>
            
            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              {!isLoggedIn && (
                <div className="sign-in-panel rounded-xl overflow-hidden w-full max-w-lg mx-auto flex flex-col items-center relative">
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
              <div className="theme-panel rounded-xl shadow-md overflow-hidden w-full flex flex-col">
                <div className="p-6 border-b border-indigo-500/30">
                  <h2 className="text-2xl font-semibold text-white">How Our Intake System Works</h2>
                </div>
                <div className="p-8">
                  {/* AI Chatbot Intake Process */}
                  <div className="flex flex-col space-y-8">
                    
                    {/* AI Assistant Section */}
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-blue-400 animated-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-lg mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">AI-Guided Intake Process</h3>
                        <p className="theme-text-muted mb-3">Our AI assistant chatbot will guide you through sharing your automation idea. It asks targeted questions to help you articulate needs and pain points in your workflow.</p>
                        
                        {/* Multilingual Support & Features */}
                        <div className="mt-4">
                          {/* Combined Multilingual & Attachment Row */}
                          <div className="flex flex-wrap items-center text-gray-300 mb-3 gap-x-4 gap-y-2">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                              <span className="text-sm font-medium mr-2">Multilingual:</span>
                            </div>
                            
                            {/* Compact Language List */}
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm bg-slate-700/50 px-2 py-0.5 rounded">English</span>
                              <span className="text-sm bg-slate-700/50 px-2 py-0.5 rounded">Français</span>
                              <span className="text-sm bg-slate-700/50 px-2 py-0.5 rounded">Español</span>
                              <span className="text-sm bg-slate-700/50 px-2 py-0.5 rounded">فارسی</span>
                              <span className="text-sm bg-slate-700/50 px-2 py-0.5 rounded">हिंदी</span>
                              <span className="text-sm bg-slate-700/50 px-2 py-0.5 rounded">中文</span>
                            </div>
                            
                            {/* Attachment Info - Integrated inline */}
                            <div className="flex items-center text-amber-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="text-sm font-medium">File Uploads Supported</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pathway Choice Section */}
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-purple-400 animated-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-lg mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">Choose Your Path</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          <div className="feature-card p-4">
                            <h4 className="text-white font-medium flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                              Fast Path
                            </h4>
                            <p className="theme-text-muted text-sm mt-2">Quick submission with basic information. Perfect for simple ideas or initial concepts that don&apos;t require extensive detail.</p>
                          </div>
                          <div className="feature-card p-4">
                            <h4 className="text-white font-medium flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              Deep-Dive Path
                            </h4>
                            <p className="theme-text-muted text-sm mt-2">Comprehensive assessment with detailed questions. Ideal for complex workflows or ideas requiring thorough exploration.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Submission & Review */}
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-green-400 animated-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white text-lg mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-green-200">Submit & Get Expert Assessment</h3>
                        <p className="theme-text-muted">Once submitted, our AI Efficiency Team reviews your idea, assesses feasibility, and explores automation potential using generative AI and other technologies. We&apos;ll follow up with next steps based on our evaluation.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* What Can We Automate section - simplified card grid */}
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

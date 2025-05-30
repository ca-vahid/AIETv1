'use client';

import SignInWithAzureAD from "@/components/SignInWithAzureAD";
import ProfileCard from "@/components/ProfileCard";
import Link from "next/link";
import { useSessionProfile } from "@/lib/contexts/SessionProfileContext";
import AppHeader from "@/components/AppHeader";
import { useEffect, useState } from "react";
import { getIdToken } from "firebase/auth";
import { useTheme } from "@/lib/contexts/ThemeContext";

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
  const { theme } = useTheme();
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

      {/* Animated geological background layers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Topographical map animation */}
        <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-20" viewBox="0 0 1200 800">
          <defs>
            <pattern id="topographic" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-600 dark:text-amber-400" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-600 dark:text-amber-400" />
              <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-600 dark:text-amber-400" />
              <circle cx="100" cy="100" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-600 dark:text-amber-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topographic)" />
        </svg>

        {/* Geological strata layers */}
        <div className="absolute bottom-0 left-0 right-0 h-96">
          <div className="relative w-full h-full">
            <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-amber-900/20 to-amber-800/10 dark:from-amber-800/30 dark:to-amber-700/20 animate-pulse" />
            <div className="absolute bottom-20 w-full h-24 bg-gradient-to-t from-orange-900/20 to-orange-800/10 dark:from-orange-800/30 dark:to-orange-700/20 animate-pulse delay-300" />
            <div className="absolute bottom-44 w-full h-28 bg-gradient-to-t from-red-900/20 to-red-800/10 dark:from-red-800/30 dark:to-red-700/20 animate-pulse delay-700" />
            <div className="absolute bottom-72 w-full h-24 bg-gradient-to-t from-stone-900/20 to-stone-800/10 dark:from-stone-800/30 dark:to-stone-700/20 animate-pulse delay-1000" />
          </div>
        </div>

        {/* Floating geological elements */}
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-400/20 dark:to-orange-400/20 blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-40 h-40 rounded-full bg-gradient-to-br from-red-500/10 to-amber-500/10 dark:from-red-400/20 dark:to-amber-400/20 blur-3xl animate-float-delayed" />
        <div className="absolute bottom-40 left-1/3 w-36 h-36 rounded-full bg-gradient-to-br from-stone-500/10 to-orange-500/10 dark:from-stone-400/20 dark:to-orange-400/20 blur-3xl animate-float-slow" />
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!isLoggedIn && (
          <>
            {/* Hero section with geological theme */}
            <div className="text-center mb-12 relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-20">
                <svg className="w-96 h-96 animate-spin-slow" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600" strokeDasharray="20 5" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600" strokeDasharray="15 5" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600" strokeDasharray="10 5" />
                </svg>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 relative">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-400">
                  Unearth
                </span>
                <span className="text-slate-800 dark:text-white"> the Power of </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                  AI
                </span>
              </h1>
              
              <p className="text-xl text-slate-700 dark:text-slate-300 mb-2">
                Transform your geological workflows with intelligent automation
              </p>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                BGC Engineering • AI Efficiency Team
              </p>

              {/* Animated seismic wave */}
              <svg className="w-full h-20 mt-8" viewBox="0 0 1200 100">
                <path
                  d="M0,50 Q300,20 600,50 T1200,50"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  className="animate-seismic"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Sign-in panel with geological theme */}
            <div className="geological-panel rounded-2xl overflow-hidden w-full max-w-lg mx-auto flex flex-col items-center relative mb-12 backdrop-blur-xl">
              <div className="p-6 border-b border-amber-500/30 dark:border-amber-400/30 w-full bg-gradient-to-r from-amber-900/20 via-orange-900/20 to-red-900/20 dark:from-amber-800/30 dark:via-orange-800/30 dark:to-red-800/30">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-white text-center flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  Access the Portal
                </h2>
              </div>
              <div className="p-8 flex flex-col items-center w-full">
                <p className="text-slate-600 dark:text-slate-300 mb-6 text-center">
                  Log in with your BGC Engineering or Cambio Earth account to start your automation journey
                </p>
                <div className="w-full max-w-xs">
                  <SignInWithAzureAD />
                </div>
              </div>
            </div>

            {/* Features grid with geological icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
              {/* Feature 1 */}
              <div className="geological-card rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 dark:from-amber-400/30 dark:to-orange-400/30 flex items-center justify-center">
                  <svg className="w-12 h-12 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Map Your Ideas</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Transform complex geological processes into streamlined AI workflows</p>
              </div>

              {/* Feature 2 */}
              <div className="geological-card rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 dark:from-red-400/30 dark:to-orange-400/30 flex items-center justify-center">
                  <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Seismic Efficiency</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Experience ground-breaking improvements in your daily workflows</p>
              </div>

              {/* Feature 3 */}
              <div className="geological-card rounded-xl p-6 text-center transform hover:scale-105 transition-all duration-300">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-stone-500/20 to-amber-500/20 dark:from-stone-400/30 dark:to-amber-400/30 flex items-center justify-center">
                  <svg className="w-12 h-12 text-stone-600 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Rock-Solid Results</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Built on bedrock principles of reliability and precision</p>
              </div>
            </div>
          </>
        )}

        {isLoggedIn && (
          <div className="space-y-8">
            {/* Personalized greeting with geological metaphor */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-slate-800 dark:text-white">Welcome back, </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-400">
                  {profile.name.split(' ')[0]}
                </span>
              </h1>
              <p className="text-xl text-slate-700 dark:text-slate-300">
                Ready to excavate new possibilities with AI?
              </p>
            </div>

            {/* Main dashboard grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Compact Profile Card with geological theme */}
              <div className="lg:col-span-4">
                <div className="geological-panel rounded-2xl overflow-hidden">
                  <ProfileCard compact={true} />
                </div>
              </div>

              {/* Main action cards */}
              <div className="lg:col-span-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Submit Idea Card */}
                  <div className="action-card-geology group">
                    <div className="card-terrain">
                      <div className="terrain-layer layer-1" />
                      <div className="terrain-layer layer-2" />
                      <div className="terrain-layer layer-3" />
                    </div>
                    <div className="relative z-10 p-6">
                      <div className="icon-container mb-4">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Submit New Idea</h3>
                      <p className="text-sm text-slate-200 mb-4">Start exploring AI automation possibilities</p>
                      <Link href="/chat" className="geological-button-primary w-full">
                        Start Discovery
                      </Link>
                    </div>
                  </div>

                  {/* My Submissions Card */}
                  <div className="action-card-geology group">
                    <div className="card-terrain">
                      <div className="terrain-layer layer-4" />
                      <div className="terrain-layer layer-5" />
                      <div className="terrain-layer layer-6" />
                    </div>
                    <div className="relative z-10 p-6">
                      <div className="icon-container mb-4">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">My Excavations</h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-200">In Progress</span>
                          <span className="text-lg font-semibold text-amber-400">{stats.totalDrafts}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-200">Submitted</span>
                          <span className="text-lg font-semibold text-green-400">{stats.totalSubmitted}</span>
                        </div>
                      </div>
                      <Link href="/chats" className="geological-button-secondary w-full">
                        View All
                      </Link>
                    </div>
                  </div>

                  {/* Gallery Card */}
                  <div className="action-card-geology group">
                    <div className="card-terrain">
                      <div className="terrain-layer layer-7" />
                      <div className="terrain-layer layer-8" />
                      <div className="terrain-layer layer-9" />
                    </div>
                    <div className="relative z-10 p-6">
                      <div className="icon-container mb-4">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Core Samples</h3>
                      <p className="text-sm text-slate-200 mb-4">Browse the repository of submitted ideas</p>
                      <Link href="/requests" className="geological-button-secondary w-full">
                        Explore
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Quick stats with geological theme */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="stat-card-geology">
                    <div className="stat-icon bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-400/30 dark:to-indigo-400/30">
                      <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.statusCounts.completed}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
                    </div>
                  </div>
                  
                  <div className="stat-card-geology">
                    <div className="stat-icon bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-400/30 dark:to-pink-400/30">
                      <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.statusCounts.in_review}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">In Review</p>
                    </div>
                  </div>

                  <div className="stat-card-geology">
                    <div className="stat-icon bg-gradient-to-br from-green-500/20 to-teal-500/20 dark:from-green-400/30 dark:to-teal-400/30">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.statusCounts.pilot}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">In Pilot</p>
                    </div>
                  </div>

                  <div className="stat-card-geology">
                    <div className="stat-icon bg-gradient-to-br from-amber-500/20 to-orange-500/20 dark:from-amber-400/30 dark:to-orange-400/30">
                      <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.statusCounts.new}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">New Ideas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What We Can Automate - Geological themed */}
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-center mb-8">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 dark:from-amber-400 dark:via-orange-400 dark:to-red-400">
                  Automation Horizons
                </span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Geological automation examples */}
                {[
                  {
                    title: "Core Sample Analysis",
                    description: "AI-powered mineral identification and stratigraphic interpretation",
                    icon: (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    gradient: "from-amber-500 to-orange-500"
                  },
                  {
                    title: "Seismic Data Processing",
                    description: "Automated waveform analysis and subsurface mapping",
                    icon: (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    ),
                    gradient: "from-red-500 to-pink-500"
                  },
                  {
                    title: "Pipeline Integrity",
                    description: "Real-time monitoring and predictive maintenance analytics",
                    icon: (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    ),
                    gradient: "from-purple-500 to-indigo-500"
                  },
                  {
                    title: "Geotechnical Reports",
                    description: "Smart document generation from field data and lab results",
                    icon: (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ),
                    gradient: "from-green-500 to-teal-500"
                  }
                ].map((item, index) => (
                  <div key={index} className="automation-card group">
                    <div className={`automation-icon bg-gradient-to-br ${item.gradient}`}>
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with geological pattern */}
      <footer className="geological-footer mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-slate-600 dark:text-slate-400 text-sm">
            © 2025 BGC Engineering - AI Efficiency Team • Innovating at Every Layer
          </p>
        </div>
      </footer>
    </main>
  );
}

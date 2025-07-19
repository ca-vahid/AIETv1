'use client';

import SignInWithAzureAD from "@/components/SignInWithAzureAD";
import ProfileCard from "@/components/ProfileCard";
import SubmissionMethodModal from "@/components/SubmissionMethodModal";
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
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [stats, setStats] = useState<RequestStats>({
    totalDrafts: 0,
    totalSubmitted: 0,
    statusCounts: { new: 0, in_review: 0, pilot: 0, completed: 0, rejected: 0 },
    loading: false,
    error: null
  });
  const [scrollY, setScrollY] = useState(0);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top after successful login
  useEffect(() => {
    if (isLoggedIn) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isLoggedIn]);

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

      {/* BGC-themed topographical background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Animated topographical lines */}
        <div className="absolute inset-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="topo-line"
              style={{
                top: `${20 + i * 15}%`,
                animationDelay: `${i * 3}s`,
                opacity: 0.1 + i * 0.05
              }}
            />
          ))}
        </div>

        {/* Geological strata layers with parallax */}
        <div className="absolute bottom-0 left-0 right-0 h-screen">
          <div className="relative w-full h-full">
            <div 
              className="stratum-layer stratum-1 h-32"
              style={{ 
                bottom: 0,
                transform: `translateY(${scrollY * 0.1}px)`
              }}
            />
            <div 
              className="stratum-layer stratum-2 h-28"
              style={{ 
                bottom: '128px',
                transform: `translateY(${scrollY * 0.15}px)`
              }}
            />
            <div 
              className="stratum-layer stratum-3 h-36"
              style={{ 
                bottom: '240px',
                transform: `translateY(${scrollY * 0.2}px)`
              }}
            />
            <div 
              className="stratum-layer stratum-4 h-32"
              style={{ 
                bottom: '376px',
                transform: `translateY(${scrollY * 0.25}px)`
              }}
            />
          </div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/20 dark:bg-blue-300/10 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `floatUp ${10 + Math.random() * 20}s linear infinite`,
                animationDelay: `${Math.random() * 10}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!isLoggedIn && (
          <>
            {/* Hero section with BGC Engineering theme */}
            <div className="text-center mb-16 relative">
              <div className="mx-auto max-w-3xl px-6 py-8 bg-white/30 dark:bg-[#0a1628]/60 backdrop-blur-md rounded-3xl border border-[#0066cc]/20 shadow-2xl flex flex-col items-center gap-2">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
                  <span className="block text-slate-800 dark:text-white mb-2">
                    Transform Your
                  </span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] via-[#0052a3] to-[#004080]">
                    Earth Science Workflows
                  </span>
                  <span className="block text-slate-800 dark:text-white mt-2">
                    with AI Innovation
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-300 mb-4 font-medium">
                  Pioneering responsible solutions through intelligent automation
                </p>
                <p className="text-lg text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 bg-[#0066cc] rounded-full"></span>
                  BGC Engineering × AI Efficiency Team
                  <span className="inline-block w-2 h-2 bg-[#0066cc] rounded-full"></span>
                </p>
              </div>

              {/* Animated BGC logo-inspired element */}
              <div className="relative w-48 h-48 mx-auto mb-12" style={{ transform: `translateY(${scrollY * -0.2}px)` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0066cc] to-[#004080] opacity-20 animate-geologicalPulse"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0066cc] to-[#004080] opacity-30 animate-geologicalPulse animation-delay-300"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0066cc] to-[#004080] opacity-40 animate-geologicalPulse animation-delay-600"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                    <path d="M2 17L12 22L22 17M2 12L12 17L22 12" />
                  </svg>
                </div>
              </div>

              {/* Scroll indicator */}
              <div className="scroll-indicator">
                <svg className="w-6 h-6 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              </div>
            </div>

            {/* Sign-in panel with BGC theme */}
            <div className="bgc-panel rounded-2xl overflow-hidden w-full max-w-lg mx-auto flex flex-col items-center relative mb-16 hover-lift">
              <div className="p-6 border-b border-[#0066cc]/30 w-full bg-gradient-to-r from-[#0066cc]/10 via-[#0052a3]/10 to-[#004080]/10">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white text-center flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0066cc] to-[#004080] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  </div>
                  Access the AIET Portal
                </h2>
              </div>
              <div className="p-8 flex flex-col items-center w-full">
                <p className="text-slate-600 dark:text-slate-300 mb-6 text-center">
                  Sign in with your BGC Engineering or Cambio Earth credentials to begin streamlining your geological workflows
                </p>
                <div className="w-full max-w-xs">
                  <SignInWithAzureAD />
                </div>
              </div>
            </div>

            {/* Features section with BGC sectors */}
            <div className="mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                <span className="text-slate-800 dark:text-white">Automate Across All </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#004080]">BGC Sectors</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Mining */}
                <div className="geo-card card-3d-subtle p-6 text-center group">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#d97706]/20 to-[#ea580c]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-12 h-12 text-[#d97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Mining Operations</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Automate core sample analysis, tailings management, and geological mapping workflows</p>
                </div>

                {/* Pipelines */}
                <div className="geo-card card-3d-subtle p-6 text-center group">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#0066cc]/20 to-[#004080]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-12 h-12 text-[#0066cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Pipeline Integrity</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Streamline geohazard assessment, monitoring data analysis, and inspection workflows</p>
                </div>

                {/* Transportation */}
                <div className="geo-card card-3d-subtle p-6 text-center group">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#78716c]/20 to-[#57534e]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-12 h-12 text-[#78716c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Transportation Assets</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Optimize geotechnical assessments and infrastructure monitoring processes</p>
                </div>

                {/* Communities */}
                <div className="geo-card card-3d-subtle p-6 text-center group">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#10b981]/20 to-[#059669]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-12 h-12 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Community Development</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Enhance groundwater resource assessment and risk management workflows</p>
              </div>

                {/* Energy */}
                <div className="geo-card card-3d-subtle p-6 text-center group">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#eab308]/20 to-[#ca8a04]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-12 h-12 text-[#eab308]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Energy Infrastructure</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Accelerate renewable energy site assessments and transmission line surveys</p>
                </div>

                {/* Data Science */}
                <div className="geo-card card-3d-subtle p-6 text-center group">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#8b5cf6]/20 to-[#7c3aed]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-12 h-12 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Data Analytics</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Transform complex geological data into actionable insights with AI</p>
                </div>
              </div>
            </div>

            {/* How it works section */}
            <div className="mb-20">
              <div className="mx-auto max-w-5xl px-6 py-10 bg-white/30 dark:bg-[#0a1628]/60 backdrop-blur-md rounded-3xl border border-[#0066cc]/20 shadow-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                  <span className="text-slate-800 dark:text-white">How </span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#004080]">AIET</span>
                  <span className="text-slate-800 dark:text-white"> Works</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center group p-6 flex flex-col items-center transition-all duration-300">
                    <div className="w-24 h-24 mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc] to-[#004080] rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-black text-[#0066cc]">1</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Describe Your Process</h3>
                    <p className="text-slate-600 dark:text-slate-400">Tell our AI about your repetitive geological workflows in plain English</p>
                  </div>

                  <div className="text-center group p-6 flex flex-col items-center transition-all duration-300">
                    <div className="w-24 h-24 mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc] to-[#004080] rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-black text-[#0066cc]">2</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">AI Analysis</h3>
                    <p className="text-slate-600 dark:text-slate-400">Our system analyzes your needs and suggests intelligent automation solutions</p>
                  </div>

                  <div className="text-center group p-6 flex flex-col items-center transition-all duration-300">
                    <div className="w-24 h-24 mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0066cc] to-[#004080] rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-black text-[#0066cc]">3</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">Transform & Deploy</h3>
                    <p className="text-slate-600 dark:text-slate-400">Your ideas become efficient automated workflows, saving hours every week</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {isLoggedIn && (
          <div className="space-y-12">
            {/* Professional Header Section */}
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-slate-800 dark:text-white">Welcome back, </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  {profile.name.split(' ')[0]}
                </span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">
                Transform your workflows with AI-powered automation
              </p>
              <p className="text-lg text-slate-500 dark:text-slate-500">
                Submit your process improvement ideas, track their progress, and explore innovations from across the organization
              </p>
            </div>

            {/* Main Action Section */}
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Profile Card - Compact */}
                <div className="lg:col-span-1">
                  <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <ProfileCard compact={true} />
                  </div>
                </div>

                {/* Action Buttons - Professional Layout */}
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* Submit Idea Button */}
                    <button
                      onClick={() => setShowSubmissionModal(true)}
                      className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 text-left"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Submit Idea</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">New automation request</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Share your workflow challenges and let AI discover automation opportunities
                      </p>
                      <div className="absolute bottom-4 right-4 text-blue-500 group-hover:translate-x-1 transition-transform duration-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </button>

                    {/* My Ideas Button */}
                    <Link
                      href="/chats"
                      className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-emerald-300 dark:hover:border-emerald-600 text-left"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">My Ideas</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{stats.totalDrafts + stats.totalSubmitted} total</p>
                  </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        View and manage your submitted automation requests
                      </p>
                      <div className="absolute bottom-4 right-4 text-emerald-500 group-hover:translate-x-1 transition-transform duration-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </Link>

                    {/* Gallery Button */}
                    <div className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm opacity-60 cursor-not-allowed text-left">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Gallery</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Coming soon</p>
                    </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Explore automation ideas from teams across the organization
                      </p>
                      <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                        Soon
                      </div>
                    </div>
                    
                  </div>
                  
                  {/* Admin Portal Link */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Link
                      href="/admin"
                      className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Admin Portal</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Stats Section */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Your Activity Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.statusCounts.completed}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.statusCounts.in_review}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">In Review</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.statusCounts.pilot}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">In Pilot</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalDrafts}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Drafts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submission Method Modal */}
        <SubmissionMethodModal 
          isOpen={showSubmissionModal} 
          onClose={() => setShowSubmissionModal(false)} 
        />

      </div>
      
      {/* Footer with BGC theme */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-white/90 flex items-center justify-center p-1">
                <img 
                  src="/images/bgc-logo.png" 
                  alt="BGC Engineering Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                © 2025 BGC Engineering - AI Efficiency Team
              </p>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pioneering responsible solutions to complex earth science challenges
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

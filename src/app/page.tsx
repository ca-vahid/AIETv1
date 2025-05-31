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
          <div className="space-y-8">
            {/* Personalized greeting with BGC theme */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-black mb-4">
                <span className="text-slate-800 dark:text-white">Welcome back, </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#004080]">
                  {profile.name.split(' ')[0]}
                </span>
              </h1>
              <p className="text-xl text-slate-700 dark:text-slate-300">
                Ready to innovate and automate your workflows?
              </p>
            </div>

            {/* Dashboard container */}
            <div className="mx-auto max-w-7xl p-6 bg-white/20 dark:bg-gray-900/20 backdrop-blur-md rounded-3xl">
              {/* Main dashboard grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Professional Profile Card */}
                <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 rounded-3xl overflow-hidden min-h-[380px] max-w-xs mx-auto shadow-2xl border-2 border-slate-200 dark:border-slate-600 relative">
                  {/* Professional background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-r from-blue-600 to-indigo-600 transform -skew-y-1"></div>
                    <div className="absolute top-6 left-0 w-full h-6 bg-gradient-to-r from-slate-500 to-slate-600 transform skew-y-1"></div>
                    <div className="absolute top-10 left-0 w-full h-10 bg-gradient-to-r from-purple-600 to-purple-700 transform -skew-y-1"></div>
                  </div>
                  {/* Professional badge icon */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <ProfileCard compact={true} />
                </div>

                {/* Innovation & Automation Discovery Card */}
                <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-3xl overflow-hidden min-h-[380px] max-w-xs mx-auto shadow-2xl border-2 border-blue-300 relative group transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                  {/* Innovation background */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 rounded-full animate-pulse"></div>
                    <div className="absolute top-1/3 -left-8 w-20 h-20 bg-amber-500/15 rounded-full animate-bounce"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-orange-400/20 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Process flow pattern */}
                  <div className="absolute right-2 top-8 w-2 h-32 bg-gradient-to-b from-blue-400 via-purple-500 via-pink-500 via-red-500 to-orange-500 rounded-full opacity-40"></div>
                  
                  <Link href="/chat" className="relative z-10 h-full flex flex-col items-center justify-between p-6 text-white">
                    {/* Innovation icon with tech elements */}
                    <div className="relative">
                      <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      {/* Automation symbol */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-2 text-center">💡 Discover & Innovate</h3>
                    <p className="text-sm text-blue-100 mb-4 text-center leading-relaxed">Share your workflow challenges and let AI discover automation opportunities</p>
                    
                    {/* Large attractive button */}
                    <div className="w-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-300 hover:via-orange-400 hover:to-red-400 text-white font-bold py-4 px-6 rounded-2xl text-center shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-yellow-300">
                      🚀 Start Innovation
                    </div>
                  </Link>
                </div>

                {/* My Projects & Initiatives Card */}
                <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 rounded-3xl overflow-hidden min-h-[380px] max-w-xs mx-auto shadow-2xl border-2 border-emerald-300 relative group transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                  {/* Progress flow background */}
                  <div className="absolute inset-0 overflow-hidden opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0,20 Q25,10 50,20 T100,20" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                      <path d="M0,40 Q25,30 50,40 T100,40" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                      <path d="M0,60 Q25,50 50,60 T100,60" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                      <path d="M0,80 Q25,70 50,80 T100,80" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                    </svg>
                  </div>
                  
                  {/* Dashboard icon */}
                  <div className="absolute top-4 left-4 w-8 h-8 text-yellow-400 opacity-60">
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                    </svg>
                  </div>

                  <Link href="/chats" className="relative z-10 h-full flex flex-col items-center justify-between p-6 text-white">
                    {/* Project management icon */}
                    <div className="relative">
                      <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      {/* Progress indicator */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-2 text-center">📊 My Projects</h3>
                    <div className="space-y-2 mb-4 w-full">
                      <div className="flex justify-between items-center text-sm bg-white/10 rounded-lg px-3 py-2">
                        <span className="text-emerald-100">⚡ In Progress</span>
                        <span className="font-bold text-yellow-300">{stats.totalDrafts}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm bg-white/10 rounded-lg px-3 py-2">
                        <span className="text-emerald-100">✅ Completed</span>
                        <span className="font-bold text-green-300">{stats.totalSubmitted}</span>
                      </div>
                    </div>
                    
                    {/* Large attractive button */}
                    <div className="w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:from-emerald-300 hover:via-teal-400 hover:to-cyan-400 text-white font-bold py-4 px-6 rounded-2xl text-center shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-emerald-300">
                      📈 View Dashboard
                    </div>
                  </Link>
                </div>

                {/* Company Innovation Hub */}
                <div className="bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 rounded-3xl overflow-hidden min-h-[380px] max-w-xs mx-auto shadow-2xl border-2 border-slate-300 relative cursor-not-allowed">
                  {/* Innovation network pattern background */}
                  <div className="absolute inset-0 overflow-hidden opacity-20">
                    <div className="absolute top-4 left-8 w-3 h-3 bg-purple-400 rounded-full"></div>
                    <div className="absolute top-12 right-6 w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="absolute bottom-16 left-4 w-4 h-4 bg-green-400 rounded-full"></div>
                    <div className="absolute top-8 left-12 w-1 h-16 bg-purple-300 transform rotate-45"></div>
                    <div className="absolute top-16 right-8 w-1 h-12 bg-blue-300 transform -rotate-45"></div>
                  </div>

                  {/* Under Construction Banner */}
                  <div className="absolute top-0 right-0 z-20 transform rotate-45 translate-x-8 translate-y-4">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-8 py-1 shadow-lg">🚧 COMING SOON</div>
                  </div>
                  
                  {/* Construction Overlay */}
                  <div className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-bounce">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <p className="text-white font-bold text-lg mb-1">Under Construction</p>
                      <p className="text-amber-300 text-sm">Company innovation hub coming soon!</p>
                    </div>
                  </div>
                  
                  {/* Original Content (behind overlay) */}
                  <div className="relative z-0 h-full flex flex-col items-center justify-between p-6 opacity-50">
                    <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl">
                      <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 text-center">🌟 Innovation Hub</h3>
                    <p className="text-sm text-slate-200 mb-4 text-center">Explore automation ideas from teams across the company</p>
                    <div className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl text-center shadow-2xl border-2 border-purple-300">
                      🚀 Explore Gallery
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats with BGC theme */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="geo-card card-3d-subtle p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.statusCounts.completed}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
                </div>
              </div>
              
              <div className="geo-card card-3d-subtle p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
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

              <div className="geo-card card-3d-subtle p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.statusCounts.pilot}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">In Pilot</p>
                </div>
              </div>

              <div className="geo-card card-3d-subtle p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
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

            {/* BGC Expertise Areas */}
            <div className="mt-20">
              {/* Value Proposition Section */}
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  <span className="text-slate-900 dark:text-white">Why Teams Choose </span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#004080]">AIET</span>
              </h2>
                <p className="text-xl text-slate-900 dark:text-slate-300 max-w-3xl mx-auto font-medium">
                  Transform your geological workflows with AI-powered automation that saves time, reduces errors, and unlocks new insights from your earth science data
                </p>
              </div>

              {/* Metrics Section */}
              <div className="mx-auto max-w-5xl px-6 py-8 bg-white/30 dark:bg-[#0a1628]/60 backdrop-blur-md rounded-3xl border border-[#0066cc]/20 shadow-2xl mb-20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="text-center">
                    <div className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#0066cc] to-[#004080] mb-3">
                      87%
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Time Saved</p>
                    <p className="text-base text-slate-800 dark:text-slate-300 font-medium">On repetitive geological analysis tasks</p>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#d97706] to-[#ea580c] mb-3">
                      2.5x
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Faster Processing</p>
                    <p className="text-base text-slate-800 dark:text-slate-300 font-medium">For complex earth science datasets</p>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-[#059669] mb-3">
                      99.9%
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Accuracy Rate</p>
                    <p className="text-base text-slate-800 dark:text-slate-300 font-medium">In automated data extraction</p>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] mb-3">
                      24/7
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-2">Availability</p>
                    <p className="text-base text-slate-800 dark:text-slate-300 font-medium">Continuous workflow automation</p>
                  </div>
                </div>
              </div>

              {/* Visual Process Flow */}
              <div className="mb-20">
                <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">
                  Your Journey to Automated Excellence
                </h3>
                
                <div className="relative">
                  {/* Connection Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#0066cc]/20 via-[#0066cc]/40 to-[#0066cc]/20 -translate-y-1/2 hidden md:block"></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                    {/* Step 1 */}
                    <div className="relative">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white dark:bg-[#0a1628] border-4 border-[#0066cc] flex items-center justify-center relative z-10 shadow-lg">
                        <span className="text-3xl font-black text-[#0066cc]">1</span>
                      </div>
                      <h4 className="text-xl font-bold text-center mb-3 text-slate-900 dark:text-white">Submit</h4>
                      <p className="text-base text-center text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                        Describe your repetitive geological workflows in plain language
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white dark:bg-[#0a1628] border-4 border-[#d97706] flex items-center justify-center relative z-10 shadow-lg">
                        <span className="text-3xl font-black text-[#d97706]">2</span>
                      </div>
                      <h4 className="text-xl font-bold text-center mb-3 text-slate-900 dark:text-white">Analyze</h4>
                      <p className="text-base text-center text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                        AI evaluates your process and identifies automation opportunities
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white dark:bg-[#0a1628] border-4 border-[#10b981] flex items-center justify-center relative z-10 shadow-lg">
                        <span className="text-3xl font-black text-[#10b981]">3</span>
                      </div>
                      <h4 className="text-xl font-bold text-center mb-3 text-slate-900 dark:text-white">Build</h4>
                      <p className="text-base text-center text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                        Our team develops custom automation solutions for your needs
                      </p>
                    </div>

                    {/* Step 4 */}
                    <div className="relative">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white dark:bg-[#0a1628] border-4 border-[#8b5cf6] flex items-center justify-center relative z-10 shadow-lg">
                        <span className="text-3xl font-black text-[#8b5cf6]">4</span>
                      </div>
                      <h4 className="text-xl font-bold text-center mb-3 text-slate-900 dark:text-white">Transform</h4>
                      <p className="text-base text-center text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                        Deploy automated workflows and watch your productivity soar
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="mb-20">
                <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">
                  Built for Earth Science Professionals
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-lg bg-[#0066cc]/15 dark:bg-[#0066cc]/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#0066cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Lightning Fast Analysis</h4>
                      <p className="text-base text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                        Process months of geological data in minutes with AI-powered automation
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-lg bg-[#d97706]/15 dark:bg-[#d97706]/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#d97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Error-Free Processing</h4>
                      <p className="text-base text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                        Eliminate human errors in repetitive tasks with consistent automation
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-lg bg-[#10b981]/15 dark:bg-[#10b981]/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Cost Savings</h4>
                      <p className="text-base text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                        Reduce operational costs by automating time-consuming manual processes
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-lg bg-[#8b5cf6]/15 dark:bg-[#8b5cf6]/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Custom Solutions</h4>
                      <p className="text-base text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                        Tailored automation designed specifically for your unique workflows
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="text-center py-16 px-8 rounded-3xl bg-gradient-to-r from-[#0066cc]/10 via-[#0052a3]/10 to-[#004080]/10 border border-[#0066cc]/20">
                <h3 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">
                  Ready to Transform Your Workflow?
                </h3>
                <p className="text-xl text-slate-800 dark:text-slate-300 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
                  Join hundreds of earth science professionals who are already saving time and improving accuracy with AIET
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/chat" className="bgc-button-primary px-8 py-4 text-lg font-semibold">
                    Start Your First Automation
                  </Link>
                  <Link href="/requests" className="px-8 py-4 text-lg font-semibold border-2 border-[#0066cc] text-[#0066cc] dark:text-[#3399ff] rounded-lg hover:bg-[#0066cc]/10 transition-all duration-300">
                    Browse Success Stories
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
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

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';
import { getRequestStatusLabel } from '@/lib/utils/statusUtils';

// Types
interface RequestDetail {
  id: string;
  status: string;
  statusCode: string;
  title: string;
  userId: string;
  assignedTo?: string;
  complexity?: 'low' | 'medium' | 'high';
  attachmentsSummary?: { 
    count: number; 
    firstThumbUrl?: string 
  };
  commentsCount?: number;
  upVotes?: number;
  createdAt: number;
  updatedAt: number;
  
  request: {
    processDescription: string;
    painNarrative?: string;
    painPoints?: string[];
    processSummary?: string;
    frequency?: string;
    durationMinutes?: number;
    peopleInvolved?: number;
    tools?: string[];
    roles?: string[];
    hoursSavedPerWeek?: number;
    category?: string;
    attachments?: {
      url: string;
      name: string;
      type?: string;
      thumbnailUrl?: string;
    }[];
    impactNarrative?: string;
  };
  
  comments?: {
    userId: string;
    content: string;
    timestamp: number;
  }[];
}

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;
  const router = useRouter();
  const { profile, firebaseUser, isLoading } = useSessionProfile();
  
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchRequestDetail() {
      if (!firebaseUser) return;
      
      try {
        setIsLoadingRequest(true);
        const idToken = await getIdToken(firebaseUser);
        
        const response = await fetch(`/api/requests/${requestId}`, {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Request not found');
          }
          throw new Error('Failed to fetch request');
        }
        
        const data = await response.json();
        setRequest(data.request);
      } catch (err) {
        console.error('Error fetching request:', err);
        setError('Unable to load request details. Please try again later.');
      } finally {
        setIsLoadingRequest(false);
      }
    }
    
    if (firebaseUser) {
      fetchRequestDetail();
    }
  }, [firebaseUser, requestId]);
  
  // Format date 
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status badge color based on status
  const getStatusColor = (statusCode: string) => {
    switch (statusCode) {
      case 'new':
        return 'bg-amber-500 text-white dark:bg-amber-600';
      case 'in_review':
        return 'bg-purple-500 text-white dark:bg-purple-600';
      case 'pilot':
        return 'bg-teal-500 text-white dark:bg-teal-600';
      case 'completed':
        return 'bg-emerald-500 text-white dark:bg-emerald-600';
      case 'rejected':
        return 'bg-rose-500 text-white dark:bg-rose-600';
      default:
        return 'bg-slate-500 text-white dark:bg-slate-600';
    }
  };
  
  // Get category color
  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    
    switch (category.toLowerCase()) {
      case 'data-entry':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'analysis':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'reporting':
        return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      case 'automation':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'integration':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300';
      default:
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-slate-800 dark:text-white">Loading...</div>
        </main>
      </div>
    );
  }
  
  if (!profile) {
    router.push('/');
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppHeader />
      
      <main className="flex-1 p-4 md:p-6 relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float1"></div>
          <div className="absolute top-1/3 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float2"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float3"></div>
        </div>
        
        <div className="mx-auto max-w-5xl relative z-10">
          <div className="flex justify-between items-center px-4 py-3 mb-6 bg-white/60 dark:bg-slate-800/60 rounded-xl backdrop-blur-md border border-white/80 dark:border-slate-700/50 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-500/30 hover:scale-[1.01]">
            <Link 
              href="/chats"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center transition-all duration-200 hover:translate-x-[-2px] font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to My Requests
            </Link>
          </div>
          
          {isLoadingRequest ? (
            <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-8 flex justify-center shadow-xl border border-white/80 dark:border-slate-700/50">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-8 text-center shadow-xl border border-white/80 dark:border-slate-700/50">
              <p className="text-red-500 dark:text-red-400">{error}</p>
              <Link
                href="/chats"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Return to Requests
              </Link>
            </div>
          ) : request ? (
            <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/80 dark:border-slate-700/50 shadow-[0_10px_50px_rgba(8,_112,_184,_0.2)] transition-all duration-300 hover:shadow-[0_20px_70px_rgba(8,_112,_184,_0.3)]">
                {/* Header - Updated with more vibrant gradient */}
                <header className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 dark:from-blue-600 dark:via-indigo-600 dark:to-purple-700 p-6 shadow-lg relative overflow-hidden">
                  {/* Abstract background shapes */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-white blur-3xl -translate-x-1/2 -translate-y-1/2 animate-float1"></div>
                    <div className="absolute top-1/2 right-0 w-60 h-60 rounded-full bg-teal-300 blur-3xl translate-x-1/2 -translate-y-1/2 animate-float2"></div>
                    <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-pink-300 blur-3xl -translate-y-1/2 animate-float3"></div>
                  </div>
                  
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(request.statusCode)} shadow-md transform transition-transform duration-300 hover:scale-[1.05] hover:translate-y-[-2px]`}>
                        {request.status}
                      </span>
                      {request.request?.category && (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-md transform transition-transform duration-300 hover:scale-[1.05] hover:translate-y-[-2px] ${getCategoryColor(request.request.category)}`}>
                          {request.request.category}
                        </span>
                      )}
                      {request.complexity && (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full shadow-md ml-auto transform transition-transform duration-300 hover:scale-[1.05] hover:translate-y-[-2px] ${
                          request.complexity === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                          request.complexity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}>
                          {request.complexity.charAt(0).toUpperCase() + request.complexity.slice(1)} Complexity
                        </span>
                      )}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-3 leading-tight drop-shadow-md">{request.title || 'Automation Request'}</h1>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                      <div className="text-blue-100">
                        Submitted: <span className="font-medium">{formatDate(request.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {request.upVotes !== undefined && (
                          <button className="flex items-center gap-1.5 text-blue-100 hover:text-white transition-all duration-300 hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                            <span className="font-medium">{request.upVotes}</span>
                          </button>
                        )}
                        {request.commentsCount !== undefined && (
                          <button className="flex items-center gap-1.5 text-blue-100 hover:text-white transition-all duration-300 hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                            <span className="font-medium">{request.commentsCount}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </header>
                
                {/* Main Content Area */}
                <div className="p-6 space-y-8 text-slate-700 dark:text-slate-200 bg-gradient-to-br from-white/95 to-blue-50/80 dark:from-slate-800/95 dark:to-slate-900/90">
                  {/* Process Overview Section */}
                  {(request.request?.processSummary || request.request?.processDescription) && (
                    <section className="transform transition-all duration-300 hover:translate-y-[-4px] hover:scale-[1.01]">
                      <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Process Overview
                      </h2>
                      <div className="bg-white dark:bg-slate-700/60 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.2)] transform transition-all duration-300 hover:translate-y-[-4px]">
                        <p className="text-slate-700 dark:text-slate-100 leading-relaxed whitespace-pre-wrap text-base">
                          {request.request.processSummary || request.request.processDescription}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Pain Points & Expected Impact (Side by Side) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pain Points */}
                    <section className="transform transition-all duration-300 hover:translate-y-[-4px] hover:rotate-[-0.5deg]">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Pain Points
                      </h2>
                      <div className="bg-gradient-to-br from-white to-rose-50 dark:from-slate-700/90 dark:to-rose-900/20 p-6 rounded-xl border border-rose-100 dark:border-rose-900/30 min-h-[200px] shadow-[0_8px_30px_rgb(244,63,94,0.07)] dark:shadow-[0_8px_30px_rgb(244,63,94,0.1)] hover:shadow-[0_20px_40px_rgb(244,63,94,0.1)] dark:hover:shadow-[0_20px_40px_rgb(244,63,94,0.15)] transform transition-all duration-300 hover:translate-y-[-4px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-rose-200/30 dark:bg-rose-500/10 rounded-full blur-2xl -translate-x-10 -translate-y-5"></div>
                        {request.request?.painPoints && request.request.painPoints.length > 0 ? (
                          <ul className="list-none space-y-3 text-slate-700 dark:text-slate-100 relative">
                            {request.request.painPoints.map((point, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm leading-relaxed">
                                <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        ) : request.request?.painNarrative ? (
                          <p className="text-slate-700 dark:text-slate-100 text-sm leading-relaxed whitespace-pre-wrap relative">
                            {request.request.painNarrative}
                          </p>
                        ) : (
                          <p className="text-slate-500 dark:text-slate-400 italic text-sm">No specific pain points detailed.</p>
                        )}
                      </div>
                    </section>

                    {/* Expected Impact */}
                    <section className="transform transition-all duration-300 hover:translate-y-[-4px] hover:rotate-[0.5deg]">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                         <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                        Envisioned Solution & Impact
                      </h2>
                      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-slate-700/90 dark:to-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-900/30 min-h-[200px] shadow-[0_8px_30px_rgb(16,185,129,0.07)] dark:shadow-[0_8px_30px_rgb(16,185,129,0.1)] hover:shadow-[0_20px_40px_rgb(16,185,129,0.1)] dark:hover:shadow-[0_20px_40px_rgb(16,185,129,0.15)] transform transition-all duration-300 hover:translate-y-[-4px] relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-emerald-200/30 dark:bg-emerald-500/10 rounded-full blur-2xl translate-x-5 translate-y-10"></div>
                        {request.request?.impactNarrative ? (
                           <p className="text-slate-700 dark:text-slate-100 text-sm leading-relaxed whitespace-pre-wrap relative">
                            {request.request.impactNarrative}
                          </p>
                        ) : (
                          <p className="text-slate-500 dark:text-slate-400 italic text-sm relative">Details on the envisioned solution and its impact are being generated or were not provided.</p>
                        )}
                      </div>
                    </section>
                  </div>
                  
                  {/* Attachments Section */}
                  {request.attachmentsSummary && request.attachmentsSummary.count > 0 && request.request?.attachments && (
                    <section className="transform transition-all duration-300 hover:translate-y-[-4px]">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                        <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                        </svg>
                        Attachments ({request.attachmentsSummary.count})
                      </h2>
                      <div className="bg-white dark:bg-slate-700/60 p-6 rounded-xl border border-amber-100 dark:border-amber-900/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {request.request.attachments.map((attachment, index) => (
                            <a 
                              key={index}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800/60 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-600/50 transition-all duration-300 block aspect-square flex flex-col items-center justify-center text-center shadow-md hover:shadow-xl hover:translate-y-[-8px] hover:rotate-3 overflow-hidden"
                            >
                              {/* Decorative element */}
                              <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-amber-200/20 dark:bg-amber-400/10 rounded-full blur-xl transform group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500"></div>
                              
                              <div className="w-16 h-16 mb-2 flex items-center justify-center transform transition-transform duration-300 group-hover:scale-[1.15] relative">
                                {(attachment.type?.startsWith('image/') || attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && attachment.url ? (
                                  <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md bg-white dark:bg-slate-800 p-0.5">
                                    <img 
                                      src={attachment.thumbnailUrl || attachment.url} 
                                      alt={attachment.name}
                                      className="w-full h-full object-cover rounded-md"
                                    />
                                  </div>
                                ) : attachment.name.match(/\.(pdf)$/i) ? (
                                  <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 rounded-lg flex items-center justify-center shadow-md">
                                    <svg className="w-8 h-8 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                    </svg>
                                  </div>
                                ) : attachment.name.match(/\.(doc|docx)$/i) ? (
                                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shadow-md">
                                    <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                  </div>
                                ) : attachment.name.match(/\.(xls|xlsx|csv)$/i) ? (
                                  <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center shadow-md">
                                    <svg className="w-8 h-8 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center shadow-md">
                                    <svg className="w-8 h-8 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                  </div>
                                )}
                              </div>
                              <div className="relative">
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors truncate w-full max-w-[90px]" title={attachment.name}>
                                  {attachment.name.length > 15 ? attachment.name.substring(0, 12) + '...' : attachment.name}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {attachment.name.split('.').pop()?.toUpperCase()}
                                </p>
                              </div>
                              
                              {/* Download hint */}
                              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/0 to-amber-500/80 dark:from-amber-600/0 dark:to-amber-600/80 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <span className="text-white text-xs font-medium pb-3">Click to download</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Resources (Tools & Roles) */}
                  <section className="transform transition-all duration-300 hover:translate-y-[-4px]">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                      <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                      Resources Involved
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-700/80 dark:to-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-lg hover:shadow-xl transform transition-all duration-300 hover:translate-y-[-4px] hover:rotate-[-0.5deg] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-2xl -translate-x-5 -translate-y-5"></div>
                        <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400 mb-4 relative">Tools & Systems</h3>
                        {request.request?.tools && request.request.tools.length > 0 ? (
                          <div className="flex flex-wrap gap-2 relative">
                            {request.request.tools.map((tool, index) => (
                              <span key={index} className="text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full text-blue-600 dark:text-blue-300 font-medium shadow-md transform transition-transform duration-200 hover:scale-105 hover:translate-y-[-2px] border border-blue-100 dark:border-blue-900/50">
                                {tool}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400 italic relative">No specific tools mentioned.</p>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-white to-violet-50 dark:from-slate-700/80 dark:to-violet-900/20 p-6 rounded-xl border border-violet-100 dark:border-violet-900/30 shadow-lg hover:shadow-xl transform transition-all duration-300 hover:translate-y-[-4px] hover:rotate-[0.5deg] relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-200/30 dark:bg-violet-500/10 rounded-full blur-2xl translate-x-5 translate-y-5"></div>
                        <h3 className="text-base font-semibold text-violet-600 dark:text-violet-400 mb-4 relative">Roles & Departments</h3>
                        {request.request?.roles && request.request.roles.length > 0 ? (
                          <div className="flex flex-wrap gap-2 relative">
                            {request.request.roles.map((role, index) => (
                              <span key={index} className="text-xs bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full text-violet-600 dark:text-violet-300 font-medium shadow-md transform transition-transform duration-200 hover:scale-105 hover:translate-y-[-2px] border border-violet-100 dark:border-violet-900/50">
                                {role}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400 italic relative">No specific roles mentioned.</p>
                        )}
                      </div>
                    </div>
                  </section>
                  
                  {/* Key Metrics */}
                  <section className="transform transition-all duration-300 hover:translate-y-[-4px]">
                     <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                       <svg className="w-6 h-6 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                       </svg>
                        Key Metrics
                      </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[ 
                        { 
                          label: 'Frequency', 
                          value: request.request?.frequency || 'N/A', 
                          icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', 
                          color: 'blue',
                          gradientFrom: 'from-blue-50',
                          gradientTo: 'to-white',
                          darkFrom: 'dark:from-blue-900/20',
                          darkTo: 'dark:to-slate-800/60',
                          borderColor: 'border-blue-100',
                          darkBorderColor: 'dark:border-blue-900/30'
                        }, 
                        { 
                          label: 'Duration', 
                          value: `${request.request?.durationMinutes || 0} mins`, 
                          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', 
                          color: 'amber',
                          gradientFrom: 'from-amber-50',
                          gradientTo: 'to-white',
                          darkFrom: 'dark:from-amber-900/20',
                          darkTo: 'dark:to-slate-800/60',
                          borderColor: 'border-amber-100',
                          darkBorderColor: 'dark:border-amber-900/30'
                        }, 
                        { 
                          label: 'People Involved', 
                          value: request.request?.peopleInvolved || 0, 
                          icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', 
                          color: 'violet',
                          gradientFrom: 'from-violet-50',
                          gradientTo: 'to-white',
                          darkFrom: 'dark:from-violet-900/20',
                          darkTo: 'dark:to-slate-800/60',
                          borderColor: 'border-violet-100',
                          darkBorderColor: 'dark:border-violet-900/30'
                        }, 
                        { 
                          label: 'Hours Saved/Week', 
                          value: request.request?.hoursSavedPerWeek || 0, 
                          icon: 'M13 10V3L4 14h7v7l9-11h-7z', 
                          color: 'emerald',
                          gradientFrom: 'from-emerald-50',
                          gradientTo: 'to-white',
                          darkFrom: 'dark:from-emerald-900/20',
                          darkTo: 'dark:to-slate-800/60',
                          borderColor: 'border-emerald-100',
                          darkBorderColor: 'dark:border-emerald-900/30'
                        } 
                      ].map(metric => (
                        <div 
                          key={metric.label} 
                          className={`bg-gradient-to-br ${metric.gradientFrom} ${metric.gradientTo} ${metric.darkFrom} ${metric.darkTo} p-5 rounded-xl ${metric.borderColor} ${metric.darkBorderColor} border text-center shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:translate-y-[-6px] hover:scale-[1.05] group relative overflow-hidden`}
                        >
                          {/* Decorative blob */}
                          <div className={`absolute -bottom-6 -right-6 w-20 h-20 bg-${metric.color}-200/30 dark:bg-${metric.color}-500/10 rounded-full blur-xl`}></div>
                          
                          <div className="flex items-center justify-center mb-3 relative">
                            <div className={`w-12 h-12 rounded-full bg-${metric.color}-100/90 dark:bg-${metric.color}-900/40 flex items-center justify-center shadow-md group-hover:scale-110 transform transition-all duration-300`}>
                              <svg className={`h-6 w-6 text-${metric.color}-500 dark:text-${metric.color}-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={metric.icon} />
                              </svg>
                            </div>
                          </div>
                          <div className="relative">
                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">{metric.label}</div>
                            <div className={`text-xl font-bold text-${metric.color}-600 dark:text-${metric.color}-400 group-hover:scale-110 transform transition-all duration-300`}>{metric.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  
                  {/* AIET Status & Assignment */}
                  <section className="bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800/90 dark:to-indigo-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:translate-y-[-4px] relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-x-10 -translate-y-10"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl translate-x-10 translate-y-10"></div>
                    
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 relative flex items-center gap-2">
                      <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      AIET Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                      <div className="bg-white/80 dark:bg-slate-800/50 p-5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20 shadow-lg">
                        <h3 className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-3 uppercase tracking-wider">Current Status</h3>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${
                            request.statusCode === 'new' ? 'bg-amber-400 dark:bg-amber-500' :
                            request.statusCode === 'in_review' ? 'bg-purple-400 dark:bg-purple-500' : 
                            request.statusCode === 'pilot' ? 'bg-teal-400 dark:bg-teal-500' :
                            request.statusCode === 'completed' ? 'bg-emerald-400 dark:bg-emerald-500' : 'bg-rose-400 dark:bg-rose-500'
                          } shadow-lg animate-pulse`}></div>
                          <span className="text-slate-800 dark:text-white font-medium text-lg">{request.status}</span>
                        </div>
                        
                        {/* Status timeline */}
                        <div className="mt-5 relative">
                          <div className="absolute left-3.5 top-0 h-full w-0.5 bg-slate-200 dark:bg-slate-700"></div>
                          
                          {['new', 'in_review', 'pilot', 'completed'].map((status, index) => (
                            <div key={status} className="relative flex items-center mb-4 last:mb-0">
                              <div className={`z-10 flex items-center justify-center w-7 h-7 rounded-full ${
                                getStatusForTimeline(status, request.statusCode)
                              } border-2 border-white dark:border-slate-900 shadow-md`}>
                                {isStatusCompleted(status, request.statusCode) && (
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-4 text-sm">
                                <p className={`font-medium ${
                                  status === request.statusCode ? 'text-indigo-600 dark:text-indigo-400' : 
                                  isStatusCompleted(status, request.statusCode) ? 'text-slate-700 dark:text-slate-300' :
                                  'text-slate-500 dark:text-slate-500'
                                }`}>
                                  {getStatusLabel(status)}
                                </p>
                                {status === request.statusCode && request.updatedAt && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {formatDate(request.updatedAt)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-white/80 dark:bg-slate-800/50 p-5 rounded-xl border border-indigo-100/50 dark:border-indigo-900/20 shadow-lg flex flex-col">
                        <h3 className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4 uppercase tracking-wider">Assignment Details</h3>
                        
                        <div className="flex-1 flex flex-col justify-center">
                          {request.assignedTo ? (
                            <div className="flex flex-col items-center justify-center text-center p-3">
                              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-3 flex items-center justify-center">
                                <svg className="w-8 h-8 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <p className="text-lg font-semibold text-slate-800 dark:text-white mb-1">{request.assignedTo}</p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">AIET Engineer</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-center p-5">
                              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 flex items-center justify-center">
                                <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <p className="text-base font-medium text-slate-600 dark:text-slate-400">Not yet assigned</p>
                              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Pending review by AIET team</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  {/* Comments Section */}
                  {request.comments && request.comments.length > 0 && (
                    <section className="transform transition-all duration-300 hover:translate-y-[-4px]">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                         <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                         </svg>
                        Discussion ({request.comments.length})
                      </h2>
                      <div className="space-y-4">
                        {request.comments.map((comment, index) => (
                          <article key={index} className="bg-gradient-to-br from-white to-sky-50 dark:from-slate-700/90 dark:to-sky-900/20 p-5 rounded-xl border border-sky-100 dark:border-sky-900/30 shadow-lg hover:shadow-xl transform transition-all duration-300 hover:translate-y-[-4px] hover:rotate-[0.25deg] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-sky-200/20 dark:bg-sky-500/10 rounded-full blur-xl -translate-x-3 -translate-y-3"></div>
                            <div className="flex justify-between items-center mb-3 relative">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/40 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-sky-500 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">{comment.userId}</p>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(comment.timestamp)}</p>
                            </div>
                            <div className="pl-10 relative">
                              <p className="text-sm text-slate-700 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

// Helper functions for status timeline
function getStatusForTimeline(status: string, currentStatus: string) {
  if (status === currentStatus) {
    return 'bg-indigo-500 dark:bg-indigo-600';
  } else if (isStatusCompleted(status, currentStatus)) {
    return 'bg-emerald-500 dark:bg-emerald-600';
  }
  return 'bg-slate-300 dark:bg-slate-600';
}

function isStatusCompleted(status: string, currentStatus: string) {
  const statusOrder = ['new', 'in_review', 'pilot', 'completed'];
  const statusIndex = statusOrder.indexOf(status);
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  return statusIndex < currentIndex;
}

function getStatusLabel(statusCode: string) {
  switch(statusCode) {
    case 'new': return 'New Request';
    case 'in_review': return 'In Review';
    case 'pilot': return 'Pilot Testing';
    case 'completed': return 'Completed';
    default: return statusCode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
} 
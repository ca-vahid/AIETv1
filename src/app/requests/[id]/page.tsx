'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';

// Types
interface RequestDetail {
  id: string;
  status: string;
  statusCode: string;
  impactScore: number;
  hoursSavedPerWeek: number;
  processDescription: string;
  painNarrative: string;
  frequency: string;
  durationMinutes: number;
  peopleInvolved: number;
  tools: string[];
  roles: string[];
  complexity?: string;
  tags?: string[];
  assignedTo?: string;
  comments: {
    userId: string;
    content: string;
    timestamp: number;
  }[];
  createdAt: number;
  updatedAt: number;
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
        return 'bg-yellow-600/70';
      case 'in_review':
        return 'bg-purple-600/70';
      case 'pilot':
        return 'bg-green-600/70';
      case 'completed':
        return 'bg-emerald-600/70';
      case 'rejected':
        return 'bg-red-600/70';
      default:
        return 'bg-gray-600/70';
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-white">Loading...</div>
        </main>
      </div>
    );
  }
  
  if (!profile) {
    router.push('/');
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 bg-gradient-to-b from-slate-900 to-transparent p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-between items-center px-4 py-2 bg-slate-800/60 rounded-lg shadow-md mb-4 backdrop-blur-sm">
            <Link 
              href="/chats"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to My Requests
            </Link>
          </div>
          
          {isLoadingRequest ? (
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-8 text-center">
              <p className="text-red-400">{error}</p>
              <Link
                href="/chats"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Return to Requests
              </Link>
            </div>
          ) : request ? (
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
              {/* Header with status */}
              <div className="bg-slate-800/60 p-4 border-b border-slate-700">
                <div className="flex justify-between items-center">
                  <div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(request.statusCode)} text-white mr-2`}>
                      {request.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Submitted: {formatDate(request.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="text-xs text-slate-400 mr-2">Impact Score:</div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg 
                          key={i}
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-4 w-4 ${i < request.impactScore ? 'text-yellow-400' : 'text-slate-600'}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                
                <h1 className="text-xl font-bold text-white mt-2 line-clamp-2">{request.processDescription}</h1>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Request Summary Section */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white">Request Summary</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Pain Points</h3>
                      <p className="text-white text-sm">{request.painNarrative}</p>
                    </div>
                    
                    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Time & Frequency</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">Frequency:</span>
                          <span className="text-sm text-white">{request.frequency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">Duration:</span>
                          <span className="text-sm text-white">{request.durationMinutes} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">People Involved:</span>
                          <span className="text-sm text-white">{request.peopleInvolved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-300">Hours Saved Weekly:</span>
                          <span className="text-sm text-white">{request.hoursSavedPerWeek} hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Tools Used</h3>
                      {request.tools.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {request.tools.map((tool, index) => (
                            <span key={index} className="text-xs bg-slate-700 px-2 py-1 rounded text-blue-300">
                              {tool}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No tools specified</p>
                      )}
                    </div>
                    
                    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Roles Involved</h3>
                      {request.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {request.roles.map((role, index) => (
                            <span key={index} className="text-xs bg-slate-700 px-2 py-1 rounded text-purple-300">
                              {role}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No roles specified</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* AIET Assessment Section */}
                <div className="pt-4 border-t border-slate-700">
                  <h2 className="text-lg font-semibold text-white mb-4">AIET Assessment</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Complexity</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        request.complexity === 'low' ? 'bg-green-900/60 text-green-300' :
                        request.complexity === 'medium' ? 'bg-yellow-900/60 text-yellow-300' :
                        request.complexity === 'high' ? 'bg-red-900/60 text-red-300' :
                        'bg-slate-900/60 text-slate-300'
                      }`}>
                        {request.complexity ? request.complexity.charAt(0).toUpperCase() + request.complexity.slice(1) : 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Assigned To</h3>
                      {request.assignedTo ? (
                        <p className="text-sm text-white">{request.assignedTo}</p>
                      ) : (
                        <p className="text-sm text-slate-400">Not yet assigned</p>
                      )}
                    </div>
                    
                    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
                      <h3 className="text-sm font-medium text-slate-300 mb-2">Tags</h3>
                      {request.tags && request.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {request.tags.map((tag, index) => (
                            <span key={index} className="text-xs bg-blue-900/40 px-2 py-1 rounded text-blue-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">No tags assigned</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Comments Section */}
                {request.comments && request.comments.length > 0 && (
                  <div className="pt-4 border-t border-slate-700">
                    <h2 className="text-lg font-semibold text-white mb-4">Team Comments</h2>
                    <div className="space-y-3">
                      {request.comments.map((comment, index) => (
                        <div key={index} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-medium text-blue-400">{comment.userId}</p>
                            <p className="text-xs text-slate-400">{formatDate(comment.timestamp)}</p>
                          </div>
                          <p className="text-sm text-white">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
} 
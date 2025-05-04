'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';

// Types for chat history items
interface HistoryItem {
  id: string;
  type: 'draft' | 'request';
  status: string;
  statusCode: string;
  preview: string;
  timestamp: number;
  progress?: number;
  impactScore?: number;
  assignedTo?: string;
  complexity?: 'low' | 'medium' | 'high' | 'unknown';
}

// Confirmation dialog component
function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatsPage() {
  const router = useRouter();
  const { profile, firebaseUser, isLoading } = useSessionProfile();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for delete confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  
  useEffect(() => {
    async function fetchChatHistory() {
      if (!firebaseUser) return;
      
      try {
        setIsLoadingHistory(true);
        const idToken = await getIdToken(firebaseUser);
        
        const response = await fetch('/api/chat/history', {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          
          // Special handling for index errors
          if (response.status === 503 && errorData.indexError) {
            throw new Error('Database indexes are still being created. This typically takes 1-2 minutes. Please try again shortly.');
          }
          
          throw new Error(errorData.error || 'Failed to fetch chat history');
        }
        
        const data = await response.json();
        setHistory(data.history || []);
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError('Unable to load your chat history. Please try again later.');
        // Keep the previous history if there was an error
        setHistory(prev => prev || []);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    
    if (firebaseUser) {
      fetchChatHistory();
    }
  }, [firebaseUser]);
  
  // Handle navigation to chat detail
  const handleChatClick = (item: HistoryItem) => {
    if (item.type === 'draft') {
      router.push(`/chat/${item.id}`);
    } else {
      router.push(`/requests/${item.id}`);
    }
  };
  
  // Handle delete request
  const handleDeleteClick = async (event: React.MouseEvent, item: HistoryItem) => {
    // Stop propagation to prevent navigation
    event.stopPropagation();
    
    // Set the item to delete and open confirmation dialog
    setItemToDelete(item);
    setConfirmDialogOpen(true);
  };
  
  // Perform the actual deletion
  const confirmDelete = async () => {
    if (!itemToDelete || !firebaseUser) return;
    
    setDeleteInProgress(true);
    
    try {
      const idToken = await getIdToken(firebaseUser);
      
      const endpoint = itemToDelete.type === 'draft' 
        ? `/api/chat/delete?id=${itemToDelete.id}`
        : `/api/requests/delete?id=${itemToDelete.id}`;
        
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete item');
      }
      
      // Remove the deleted item from the history
      setHistory(current => current.filter(item => item.id !== itemToDelete.id));
      
    } catch (err) {
      console.error('Error deleting item:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      alert(`Failed to delete: ${errorMessage}`);
    } finally {
      setDeleteInProgress(false);
      setItemToDelete(null);
    }
  };
  
  // Format date using date-fns for relative time
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    // Use relative time for updates within the last day
    if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    // Use absolute date for older updates
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status badge color based on status
  const getStatusColor = (item: HistoryItem) => {
    if (item.type === 'draft') {
      return 'bg-blue-600/70';
    }
    
    // For submitted requests
    switch (item.statusCode) {
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
  
  // Get impact score stars
  const renderImpactScore = (score?: number) => {
    if (score === undefined) return null;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i}
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-4 w-4 ${i < score ? 'text-yellow-400' : 'text-slate-600'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };
  
  // Check if an item can be deleted
  const canDelete = (item: HistoryItem) => {
    // Draft conversations can always be deleted
    if (item.type === 'draft') return true;
    
    // Only 'new' requests can be deleted
    return item.type === 'request' && item.statusCode === 'new';
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Your Automation Requests</h1>
            
            <Link 
              href="/chat" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Request
            </Link>
          </div>
          
          {isLoadingHistory ? (
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
              <button 
                onClick={() => {
                  setError(null);
                  setIsLoadingHistory(true);
                  setTimeout(() => {
                    if (firebaseUser) {
                      getIdToken(firebaseUser).then(idToken => {
                        fetch('/api/chat/history', {
                          headers: { Authorization: `Bearer ${idToken}` }
                        })
                        .then(res => {
                          if (!res.ok) {
                            throw new Error(`Failed with status: ${res.status}`);
                          }
                          return res.json();
                        })
                        .then(data => {
                          setHistory(data.history || []);
                          setIsLoadingHistory(false);
                        })
                        .catch(err => {
                          console.error(err);
                          // Check if the error message contains index-related content
                          if (err.message?.includes('index') || 
                              /firestore.*index/i.test(err.message) ||
                              err.code === 'failed-precondition') {
                            setError('Database indexes are still being created. This typically takes 1-2 minutes. Please try again shortly.');
                          } else {
                            setError('Failed to reload. Please try again.');
                          }
                          // Maintain existing history array
                          setHistory(prev => prev || []);
                          setIsLoadingHistory(false);
                        });
                      }).catch(err => {
                        console.error('Auth error:', err);
                        setError('Authentication error. Please try signing in again.');
                        setIsLoadingHistory(false);
                      });
                    } else {
                      setError('You need to be signed in.');
                      setIsLoadingHistory(false);
                    }
                  }, 500);
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="rounded-full bg-blue-900/50 p-6 mb-4 mx-auto w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No Automation Requests Yet</h3>
              <p className="text-slate-300 mb-6">Start a new conversation to submit your first automation request.</p>
              <Link
                href="/chat"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
              >
                Start New Request
              </Link>
            </div>
          ) : (
            <div className="grid gap-6">
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleChatClick(item)}
                  className={
                    `rounded-xl p-4 cursor-pointer transition-all border hover:shadow-lg relative group
                    ${item.type === 'draft' ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600 hover:bg-slate-800/60' : 'bg-slate-700/40 border-slate-600 hover:border-slate-500 hover:bg-slate-700/60'}`
                  }
                >
                  {/* Delete button - only shown on hover and for eligible items */}
                  {canDelete(item) && (
                    <button
                      onClick={(e) => handleDeleteClick(e, item)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-700/80 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-700 hover:text-red-300"
                      aria-label="Delete"
                      disabled={deleteInProgress}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(item)} text-white`}>
                        {item.status}
                      </span>
                      {item.type === 'draft' && item.progress !== undefined && (
                        <div className="ml-2 w-24 bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full" 
                            style={{ width: `${item.progress}%` }}
                          ></div>
                          <span className="text-xs text-slate-400 ml-2">{item.progress}%</span>
                        </div>
                      )}
                      {item.type === 'request' && renderImpactScore(item.impactScore)}
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                  
                  <p className="text-white text-sm font-medium mb-1 line-clamp-2">{item.preview}</p>
                  
                  {item.type === 'request' && (
                    <div className="flex items-center mt-2 flex-wrap gap-x-4 gap-y-1">
                      {item.complexity && (
                        <div className="flex items-center">
                          <span className="text-xs text-slate-400 mr-1">Complexity:</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            item.complexity === 'low' ? 'bg-green-900/60 text-green-300' :
                            item.complexity === 'medium' ? 'bg-yellow-900/60 text-yellow-300' :
                            item.complexity === 'high' ? 'bg-red-900/60 text-red-300' :
                            'bg-slate-900/60 text-slate-300'
                          }`}>
                            {item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1)}
                          </span>
                        </div>
                      )}
                      
                      {item.assignedTo && (
                        <div className="flex items-center">
                          <span className="text-xs text-slate-400 mr-1">Assigned to:</span> 
                          <span className="text-xs text-blue-400 font-medium">{item.assignedTo}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete this item?"
        message={
          itemToDelete?.type === 'draft'
            ? "This will permanently delete this conversation and all messages."
            : "This will permanently delete this submitted request. You can only delete requests that haven't been reviewed yet."
        }
      />
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from "@/lib/contexts/ThemeContext";

// Add DnD imports
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UniqueIdentifier } from '@dnd-kit/core';

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
  category?: string;
  frequencyType?: string;
  hoursSavedPerWeek?: number;
  durationMinutes?: number;
  peopleInvolved?: number;
  request?: {
    painPoints?: string[];
    processSummary?: string;
    roles?: string[];
    tools?: string[];
    impactNarrative?: string;
    // ... other request fields ...
  };
}

// Types for SortableItem props
interface SortableItemProps {
  item: HistoryItem;
  index: number;
  handleChatClick: (item: HistoryItem) => void;
  handleDeleteClick: (e: React.MouseEvent, item: HistoryItem) => void;
  deleteInProgress: boolean;
  canDelete: (item: HistoryItem) => boolean;
  getStatusColor: (item: HistoryItem) => string;
  getCategoryColor: (category?: string) => string;
  getComplexityBadge: (complexity?: string) => React.ReactNode | null;
  renderImpactScore: (score?: number) => React.ReactNode | null;
  formatDate: (timestamp: number) => string;
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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <div className="geological-panel rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700/80 text-white rounded hover:bg-slate-600/80 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded hover:from-red-700 hover:to-orange-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableItem({ 
  item, 
  index, 
  handleChatClick, 
  handleDeleteClick, 
  deleteInProgress, 
  canDelete, 
  getStatusColor,
  getCategoryColor,
  getComplexityBadge,
  renderImpactScore,
  formatDate
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  // Determine shared status (basic logic: if assignedTo exists, consider shared)
  const shared = !!item.assignedTo;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`select-none bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-transform duration-200 ${isDragging ? 'opacity-50' : 'hover:scale-[1.02]'}`}
      onClick={() => handleChatClick(item)}
    >
      <div className="p-6 flex flex-col min-h-[260px] justify-between">
        <div>
          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-snug">
            {item.preview}
          </h3>
          {/* Timestamp */}
          <div className="text-xs text-slate-400 mb-4 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(item.timestamp)}
          </div>
          {/* Category badge (status dot moved to bottom) */}
          <div className="flex items-center justify-end mb-3">
            {item.category && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryColor(item.category)} shadow-sm`}>{item.category}</span>
            )}
          </div>
          {/* Shared / Private indicator */}
          <div className="mb-4">
            {shared ? (
              <span className="inline-flex items-center text-xs font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1 gap-1">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 7H7v6h6V7z" opacity="0.5" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3-9a1 1 0 00-1-1H8a1 1 0 000 2h4a1 1 0 001-1z" clipRule="evenodd" />
                </svg>
                Shared
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-semibold text-slate-300 bg-slate-500/20 border border-slate-500/30 rounded-full px-3 py-1 gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7H7v6h6V7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
                Private
              </span>
            )}
          </div>
          {/* Optional complexity badge */}
          {getComplexityBadge(item.complexity)}
          {/* Impact score if available */}
          {renderImpactScore(item.impactScore)}
        </div>
        {/* Bottom actions */}
        <div className="mt-6 flex items-center justify-between">
          {/* Status dot indicator */}
          <span
            className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${(() => {
              switch (item.statusCode) {
                case 'new': return 'bg-amber-500';
                case 'in_review': return 'bg-purple-500';
                case 'pilot': return 'bg-green-500';
                case 'completed': return 'bg-emerald-500';
                case 'rejected': return 'bg-red-500';
                default: return 'bg-blue-500';
              }
            })()}`}
            title={item.status}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleChatClick(item);
            }}
            className="text-sm font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 group"
          >
            <span>Explore Details</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {canDelete(item) && (
            <button
              onClick={(e) => handleDeleteClick(e, item)}
              disabled={deleteInProgress}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L6.382 5H3a1 1 0 100 2h.293l.949 9.486A2 2 0 006.236 18h7.528a2 2 0 001.994-1.514L16.707 7H17a1 1 0 100-2h-3.382l-1.724-2.447A1 1 0 0011 2H9zm3 6a1 1 0 10-2 0v6a1 1 0 102 0V8zm-4 0a1 1 0 112 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Update the DragStartEvent and DragEndEvent interfaces to use UniqueIdentifier
interface DragStartEvent {
  active: { id: UniqueIdentifier };
}

interface DragEndEvent {
  active: { id: UniqueIdentifier };
  over: { id: UniqueIdentifier } | null;
}

export default function ChatsPage() {
  const router = useRouter();
  const { profile, firebaseUser, isLoading } = useSessionProfile();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [dragInstructions, setDragInstructions] = useState(true);
  const { theme } = useTheme();
  
  // State for delete confirmation dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  
  // Set up DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      return 'bg-blue-600 text-white dark:bg-blue-600/70';
    }
    
    // For submitted requests
    switch (item.statusCode) {
      case 'new':
        return 'bg-amber-500 text-white dark:bg-yellow-600/70';
      case 'in_review':
        return 'bg-purple-500 text-white dark:bg-purple-600/70';
      case 'pilot':
        return 'bg-green-500 text-white dark:bg-green-600/70';
      case 'completed':
        return 'bg-emerald-500 text-white dark:bg-emerald-600/70';
      case 'rejected':
        return 'bg-red-500 text-white dark:bg-red-600/70';
      default:
        return 'bg-gray-500 text-white dark:bg-gray-600/70';
    }
  };
  
  // Get category badge color
  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    
    switch (category.toLowerCase()) {
      case 'data-entry':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      case 'analysis':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300';
      case 'reporting':
        return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'automation':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-300';
      case 'integration':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-700/30 dark:text-pink-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
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
            className={`h-4 w-4 ${i < score ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
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
  
  // Get complexity badge styling
  const getComplexityBadge = (complexity?: string) => {
    if (!complexity) return null;
    
    const styles = {
      low: 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300', 
      high: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300',
      unknown: 'bg-gray-100 text-gray-700 dark:bg-slate-900/60 dark:text-slate-300'
    };
    
    return (
      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles[complexity as keyof typeof styles] || styles.unknown}`}>
        {complexity.charAt(0).toUpperCase() + complexity.slice(1)} Complexity
      </span>
    );
  };
  
  // Handle DnD events
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
    // Hide instructions once user starts dragging
    setDragInstructions(false);
  }
  
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setHistory((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  }
  
  function handleDragCancel() {
    setActiveId(null);
  }

  if (isLoading) {
    return (
      <div className={`flex flex-col h-screen ${theme === "dark" ? "bg-slate-900" : "bg-slate-100"}`}>
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8a4 4 0 00-4 4H4z"></path>
            </svg>
            <p className={`text-lg font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>Loading your excavation site...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    router.push('/');
    return null;
  }
  
  return (
    <div className={`flex flex-col min-h-screen ${theme === "dark" ? "bg-slate-900" : "bg-slate-100"}`}>
      <AppHeader />
      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="page-title">Your Excavation Site</h1>
              <p className="page-subtitle">
                Explore your submitted ideas and track their journey through the automation pipeline.
              </p>
            </div>
            <Link href="/chat" className="action-button-primary whitespace-nowrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start New Excavation
            </Link>
          </div>

          {dragInstructions && (
            <div className="instruction-badge mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v2.586l-2.293-2.293a1 1 0 10-1.414 1.414L7.586 8H5a1 1 0 000 2h2.586l-2.293 2.293a1 1 0 101.414 1.414L9 11.414V14a1 1 0 102 0v-2.586l2.293 2.293a1 1 0 101.414-1.414L12.414 10H15a1 1 0 100-2h-2.586l2.293-2.293a1 1 0 10-1.414-1.414L11 6.586V4a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Drag to reorganize your geological samples.</span>
              </div>
              <button onClick={() => setDragInstructions(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {isLoadingHistory && !history.length ? (
            <div className="text-center py-10">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8a4 4 0 00-4 4H4z"></path>
              </svg>
              <p className={`text-slate-500 dark:text-slate-400`}>Loading history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500 mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No Geological Samples Yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Start a new excavation to submit your innovative AI automation ideas.</p>
              <Link href="/chat" className="action-button-primary">
                 Start New Excavation
              </Link>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext 
                items={history.map(item => item.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item, index) => (
                    <SortableItem 
                      key={item.id} 
                      item={item} 
                      index={index}
                      handleChatClick={handleChatClick} 
                      handleDeleteClick={handleDeleteClick}
                      deleteInProgress={deleteInProgress}
                      canDelete={canDelete}
                      getStatusColor={getStatusColor}
                      getCategoryColor={getCategoryColor}
                      getComplexityBadge={getComplexityBadge}
                      renderImpactScore={renderImpactScore}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div className="opacity-75">
                    <SortableItem 
                        item={history.find(item => item.id === activeId)!} 
                        index={history.findIndex(item => item.id === activeId)}
                        handleChatClick={() => {}} 
                        handleDeleteClick={() => {}}
                        deleteInProgress={false}
                        canDelete={() => false}
                        getStatusColor={getStatusColor}
                        getCategoryColor={getCategoryColor}
                        getComplexityBadge={getComplexityBadge}
                        renderImpactScore={renderImpactScore}
                        formatDate={formatDate}
                      />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
        
        <ConfirmationDialog 
          isOpen={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete this ${itemToDelete?.type === 'draft' ? 'draft' : 'submission'}? This action cannot be undone.`}
        />
      </main>
    </div>
  );
}
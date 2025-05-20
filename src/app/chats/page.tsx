'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import AppHeader from '@/components/AppHeader';
import Link from 'next/link';
import { getIdToken } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';

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
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">{title}</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition"
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  // Safely extract request metadata
  const request = item.request ?? {};
  const painPoints = request.painPoints ?? [];
  const roles = request.roles ?? [];

  // Different style variations based on status and type
  const getCardStyle = () => {
    if (item.type === 'draft') {
      return "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/40 dark:to-slate-600/30";
    }
    
    switch(item.statusCode) {
      case 'new':
        return "bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-800/30 dark:to-indigo-700/40";
      case 'in_review':
        return "bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/30";
      case 'completed':
        return "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30";
      case 'pilot':
        return "bg-gradient-to-br from-teal-50 to-cyan-100 dark:from-teal-900/20 dark:to-cyan-900/30";
      case 'rejected':
        return "bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-900/30";
      default:
        return "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30";
    }
  };
  
  // Get decorative element for corner
  const getDecorativeElement = () => {
    const elements = [
      <div key="circle" className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-blue-200/20 dark:bg-blue-500/10"></div>,
      <div key="square" className="absolute -bottom-8 -left-8 w-16 h-16 bg-purple-200/20 dark:bg-purple-500/10 rounded-lg rotate-12"></div>,
      <div key="dots" className="absolute top-8 -right-6 w-12 h-24 flex flex-col gap-2">
        <div className="w-3 h-3 rounded-full bg-teal-300/30 dark:bg-teal-500/20"></div>
        <div className="w-2 h-2 rounded-full bg-blue-300/30 dark:bg-blue-500/20 ml-2"></div>
        <div className="w-4 h-4 rounded-full bg-purple-300/30 dark:bg-purple-500/20"></div>
      </div>,
      <div key="lines" className="absolute -bottom-4 -left-4 w-16 h-16">
        <div className="absolute w-full h-1 bg-amber-300/20 dark:bg-amber-500/10 rotate-45 rounded-full"></div>
        <div className="absolute w-full h-1 bg-pink-300/20 dark:bg-pink-500/10 -rotate-45 rounded-full"></div>
      </div>,
    ];
    return elements[index % elements.length];
  };
  
  const getStatusStripeColor = (item: HistoryItem) => {
    if (item.type === 'draft') return 'bg-slate-400 dark:bg-slate-500';
    switch (item.statusCode) {
      case 'new': return 'bg-blue-500 dark:bg-blue-400';
      case 'in_review': return 'bg-purple-500 dark:bg-purple-600';
      case 'pilot': return 'bg-green-500 dark:bg-green-600';
      case 'completed': return 'bg-emerald-500 dark:bg-emerald-600';
      case 'rejected': return 'bg-red-500 dark:bg-red-600';
      default: return 'bg-gray-500 dark:bg-gray-600';
    }
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style} 
      className="relative w-full h-full"
    >
      <div
        className={`
          ${getCardStyle()}
          rounded-2xl shadow-lg hover:shadow-2xl border border-white/50 dark:border-white/5
          overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-500
          hover:translate-y-[-8px] relative group flex flex-col h-full
          transform hover:scale-[1.03]
        `}
        style={{
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 2px 8px -3px rgba(0, 0, 0, 0.05)"
        }}
        {...attributes}
        {...listeners}
      >
        <div className={`${getStatusStripeColor(item)} absolute left-0 top-0 bottom-0 w-1 rounded-tr-2xl rounded-br-2xl`} />
        {/* Decorative element */}
        {getDecorativeElement()}
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
        
        {/* Status badge removed in favor of stripe */}
        
        {/* Category badge if available */}
        {item.category && (
          <div className="absolute top-4 left-4 z-10">
            <div className={`text-xs px-2.5 py-1 rounded-full ${getCategoryColor(item.category)} transform transition-all duration-300 group-hover:scale-110 shadow-md`}>
              {item.category}
            </div>
          </div>
        )}
        
        {/* Delete button - only shown on hover for eligible items */}
        {canDelete(item) && (
          <button
            onClick={(e) => handleDeleteClick(e, item)}
            className="absolute bottom-4 right-4 p-2 bg-white/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 rounded-full 
              opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-100 dark:hover:bg-red-900/30 
              hover:text-red-600 dark:hover:text-red-400 z-10 transform group-hover:rotate-12 shadow-md hover:shadow-lg"
            aria-label="Delete"
            disabled={deleteInProgress}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
        
        <div 
          className="p-6 pt-14 flex-grow relative"
          onClick={() => handleChatClick(item)}
        >
          {/* Title area */}
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 dark:group-hover:from-blue-400 dark:group-hover:to-indigo-400 transition-all duration-300">
            {item.preview}
          </h2>
          
          {/* Metadata - Time */}
          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mb-5">
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDate(item.timestamp)}
            </span>
          </div>
          
          {/* Progress bars for draft */}
          {item.type === 'draft' && item.progress !== undefined && (
            <div className="mb-4 group-hover:scale-105 transform transition-transform duration-300">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Completion</span>
                <span className="text-slate-700 dark:text-slate-300 font-bold">{item.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-500" 
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Summary excerpt */}
          {item.request?.processSummary && (
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 line-clamp-3">
              {item.request.processSummary}
            </p>
          )}
          {/* Pain points */}
          {painPoints.length > 0 && (
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-400 mb-2">
              {painPoints.slice(0,3).map((pp,i) => (<li key={i}>{pp}</li>))}
            </ul>
          )}
          {/* Roles badges */}
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {roles.map((role,i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200">
                  {role}
                </span>
              ))}
            </div>
          )}
          {/* Complexity badge */}
          {getComplexityBadge(item.complexity) && (
            <div className="mb-2">
              {getComplexityBadge(item.complexity)}
            </div>
          )}
          {/* View Details link */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleChatClick(item);
            }}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View Details →
          </button>
        </div>
        
        {/* Footer with key metrics */}
        <div className="px-6 py-4 bg-white/50 dark:bg-slate-800/30 border-t border-white/60 dark:border-white/5 mt-auto backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-4">
            {/* Left column - Frequency & Hours Saved */}
            <div className="space-y-2">
              {item.frequencyType && (
                <div className="flex items-center gap-2 transform transition-all duration-300 group-hover:translate-x-[-2px]">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="h-3.5 w-3.5 text-indigo-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.frequencyType}
                  </div>
                </div>
              )}
              
              {item.hoursSavedPerWeek !== undefined && (
                <div className="flex items-center gap-2 transform transition-all duration-300 group-hover:translate-x-[-2px]">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="h-3.5 w-3.5 text-green-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.hoursSavedPerWeek} hrs/week saved
                  </div>
                </div>
              )}
              
              {item.durationMinutes !== undefined && (
                <div className="flex items-center gap-2 transform transition-all duration-300 group-hover:translate-x-[-2px]">
                  <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.durationMinutes} mins duration
                  </div>
                </div>
              )}
            </div>
            
            {/* Right column - People & Assignment */}
            <div className="space-y-2">
              {item.peopleInvolved !== undefined && (
                <div className="flex items-center gap-2 transform transition-all duration-300 group-hover:translate-x-[2px]">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.peopleInvolved} people involved
                  </div>
                </div>
              )}
              
              {item.assignedTo && (
                <div className="flex items-center gap-2 transform transition-all duration-300 group-hover:translate-x-[2px]">
                  <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="h-3.5 w-3.5 text-purple-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
                    {item.assignedTo}
                  </div>
                </div>
              )}
              
              {/* Display pain points count if available */}
              {item.request?.painPoints && item.request.painPoints.length > 0 && (
                <div className="flex items-center gap-2 transform transition-all duration-300 group-hover:translate-x-[2px]">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <svg className="h-3.5 w-3.5 text-red-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {item.request.painPoints.length} pain points
                  </div>
                </div>
              )}
            </div>
          </div>
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
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/20">
      <AppHeader />
      
      <main className="flex-1 p-4 md:p-6 relative overflow-x-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-300/20 dark:bg-yellow-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 -left-24 w-64 h-64 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-300/20 dark:bg-pink-500/10 rounded-full blur-3xl"></div>
          
          <div className="hidden md:block absolute top-20 right-10 opacity-20 dark:opacity-10">
            <svg width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 10L60 40H90L65 60L75 90L50 70L25 90L35 60L10 40H40L50 10Z" fill="currentColor" className="text-amber-500" />
            </svg>
          </div>
          <div className="hidden md:block absolute bottom-20 left-10 opacity-20 dark:opacity-10">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-teal-500" />
            </svg>
          </div>
          <div className="hidden md:block absolute top-1/2 left-1/3 opacity-20 dark:opacity-10">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="20" width="60" height="60" stroke="currentColor" strokeWidth="8" className="text-indigo-500" />
            </svg>
          </div>
        </div>
        
        <div className="relative mx-auto max-w-7xl z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100">
              Your Submitted Ideas
            </h1>
            
            <div className="flex flex-wrap gap-4 items-center">
              {!isLoadingHistory && history.length > 0 && (
                <div className={`text-sm ${dragInstructions ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-3 py-2 rounded-lg shadow-md' : 'text-slate-600 dark:text-slate-300'} flex items-center transition-all duration-500`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${dragInstructions ? 'text-amber-500 mr-2 animate-bounce' : 'text-amber-500 mr-1.5'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span className={dragInstructions ? 'font-medium' : 'italic'}>
                    {dragInstructions ? 'Drag cards to rearrange your ideas' : 'Drag cards to rearrange ideas'}
                  </span>
                </div>
              )}
            
              <Link 
                href="/chat" 
                className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 
                  text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl
                  overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  New Request
                </span>
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-pink-500 to-purple-600 opacity-0 
                  group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></span>
              </Link>
            </div>
          </div>
          
          {isLoadingHistory ? (
            <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-8 flex justify-center shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-4 h-4 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-4 h-4 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-8 text-center shadow-lg">
              <div className="inline-flex rounded-full bg-red-100 dark:bg-red-900/30 p-4 mb-4">
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
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
                          if (err.message?.includes('index') || 
                              /firestore.*index/i.test(err.message) ||
                              err.code === 'failed-precondition') {
                            setError('Database indexes are still being created. This typically takes 1-2 minutes. Please try again shortly.');
                          } else {
                            setError('Failed to reload. Please try again.');
                          }
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
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
              >
                Try Again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-10 text-center shadow-lg">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20 dark:opacity-30 rounded-full blur-lg"></div>
                <div className="relative rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 p-8 mb-4 mx-auto w-fit">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-blue-500 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">No Ideas Submitted Yet</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-lg mx-auto">Start a new conversation to submit your first idea and let AI showcase your automation vision!</p>
              <Link
                href="/chat"
                className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                Submit Your First Idea
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
              <div className="relative">
                <SortableContext 
                  items={history.map(item => item.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <DragOverlay adjustScale={true}>
                  {activeId ? (
                    <div className="opacity-90 rotate-3 scale-105 shadow-2xl">
                      {(() => {
                        const item = history.find(item => item.id === activeId);
                        const index = history.findIndex(item => item.id === activeId);
                        if (item) {
                          return (
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
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : null}
                </DragOverlay>
              </div>
            </DndContext>
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
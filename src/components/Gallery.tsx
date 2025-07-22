'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import { getIdToken } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

// Interface matching the API response
interface GalleryItem {
  id: string;
  title: string;
  category: string;
  status: string;
  complexity: string;
  description: string;
  painPoints: string[];
  frequency: string;
  durationMinutes: number;
  peopleInvolved: number;
  hoursSavedPerWeek: number;
  tools: string[];
  roles: string[];
  impactNarrative: string;
  createdAt: number;
  updatedAt: number;
  upVotes: number;
  commentsCount: number;
  user: {
    name: string;
    email: string;
    jobTitle?: string;
    department?: string;
    officeLocation?: string;
    photoUrl?: string;
  };
}

interface GalleryResponse {
  items: GalleryItem[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    lastDocId: string | null;
    total: number;
  };
  filters: {
    categories: string[];
    statuses: string[];
  };
}

type ViewMode = 'grid' | 'list' | 'bento';

export default function Gallery() {
  const { firebaseUser } = useSessionProfile();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Ref for search input to preserve focus during re-renders
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Filter and sort states
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Available filter options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  
  // Refs for infinite scroll
  const observer = useRef<IntersectionObserver>();
  const lastItemRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchGalleryItems(nextPage, false);
          return nextPage;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore]);

  // Memoize filter parameters to prevent unnecessary re-renders
  const filterParams = useMemo(() => ({
    sortBy,
    statusFilter,
    categoryFilter,
    searchQuery: debouncedSearch
  }), [sortBy, statusFilter, categoryFilter, debouncedSearch]);

  const fetchGalleryItems = useCallback(async (pageNum: number = 0, reset: boolean = false) => {
    if (!firebaseUser) return;

    try {
      if (pageNum === 0 && items.length === 0 && !reset) setLoading(true);
      else setLoadingMore(true);

      const idToken = await getIdToken(firebaseUser);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '200',
        sortBy: filterParams.sortBy,
        ...(filterParams.statusFilter !== 'all' && { status: filterParams.statusFilter }),
        ...(filterParams.categoryFilter !== 'all' && { category: filterParams.categoryFilter }),
        ...(filterParams.searchQuery && { search: filterParams.searchQuery }),
      });

      const response = await fetch(`/api/gallery?${params}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gallery items');
      }

      const data: GalleryResponse = await response.json();
      
      if (reset || pageNum === 0) {
        setItems(data.items);
        setPage(0);
      } else {
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = data.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      
      setHasMore(data.pagination.hasMore);
      setAvailableCategories(data.filters.categories);
      setAvailableStatuses(data.filters.statuses);
      setError(null);
    } catch (err) {
      console.error('Error fetching gallery items:', err);
      setError('Failed to load gallery items. Please try again.');
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);

      // Ensure the search input retains focus after refresh
      if (reset) {
        // Wait for DOM updates before focusing
        setTimeout(() => {
          searchInputRef.current?.focus({ preventScroll: true });
        }, 0);
      }
    }
  }, [firebaseUser, filterParams, items.length]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGalleryItems(nextPage, false);
    }
  };

  const handleFilterChange = () => {
    setPage(0);
    setHasMore(true);
    fetchGalleryItems(0, true);
  };

  // Debounce search input to reduce rapid fetches and keep focus
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Trigger fetch when debounced search or filters change
  useEffect(() => {
    if (firebaseUser) {
      setPage(0);
      setHasMore(true);
      fetchGalleryItems(0, true);
    }
  }, [firebaseUser, debouncedSearch, statusFilter, categoryFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      case 'pilot': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'in_review': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'new': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'data-entry': return 'bg-blue-500 text-white';
      case 'analysis': return 'bg-purple-500 text-white';
      case 'reporting': return 'bg-green-500 text-white';
      case 'automation': return 'bg-amber-500 text-white';
      case 'integration': return 'bg-pink-500 text-white';
      default: return 'bg-indigo-500 text-white';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'low': return '⚡';
      case 'medium': return '🔥';
      case 'high': return '🚀';
      default: return '⭐';
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    const freq = frequency.toLowerCase();
    if (freq.includes('daily')) return '📅';
    if (freq.includes('weekly')) return '📆';
    if (freq.includes('monthly')) return '📊';
    return '🔄';
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <svg className="animate-spin h-12 w-12 text-[#0066cc] dark:text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8a4 4 0 00-4 4H4z"></path>
        </svg>
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading gallery...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 max-w-md mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-red-700 dark:text-red-300 font-semibold mb-2">Error Loading Gallery</p>
          <p className="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
          <button 
            onClick={() => fetchGalleryItems(0, true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render compact card for grid/bento view
  const renderCompactCard = (item: GalleryItem, index: number, isBentoLarge: boolean = false) => (
    <div
      key={item.id}
      ref={index === items.length - 1 ? lastItemRef : null}
      className={`group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 
        shadow-sm hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 
        hover:-translate-y-1 overflow-hidden cursor-pointer ${isBentoLarge ? 'col-span-2 row-span-2' : ''}`}
    >
      <Link href={`/requests/${item.id}`} className="block h-full">
        {/* Gradient accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getCategoryGradient(item.category)}`}></div>
        
        <div className={`p-5 h-full flex flex-col ${isBentoLarge ? 'justify-between' : ''}`}>
          {/* Header - Compact */}
          <div className="mb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Small Avatar */}
                {item.user.photoUrl ? (
                  <img
                    src={item.user.photoUrl}
                    alt={item.user.name}
                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {item.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
                    {item.user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              
              {/* Complexity indicator */}
              <span className="text-lg ml-2" title={`${item.complexity} complexity`}>
                {getComplexityIcon(item.complexity)}
              </span>
            </div>
            
            {/* Title */}
            <h4 className={`font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 
              transition-colors duration-200 line-clamp-2 ${isBentoLarge ? 'text-xl' : 'text-base'}`}>
              {item.title}
            </h4>
          </div>

          {/* Description - Only show in bento large cards */}
          {isBentoLarge && (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-3">
              {item.description || 'No description available.'}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
              {item.category}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
              {item.status.replace('_', ' ')}
            </span>
            {item.frequency && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 flex items-center gap-1">
                <span>{getFrequencyIcon(item.frequency)}</span>
                {item.frequency}
              </span>
            )}
          </div>

          {/* Impact Metrics - Compact */}
          <div className={`grid ${isBentoLarge ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-3`}>
            {item.hoursSavedPerWeek > 0 && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {item.hoursSavedPerWeek}h
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">saved/week</div>
              </div>
            )}
            {item.peopleInvolved > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {item.peopleInvolved}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">people</div>
              </div>
            )}
            {isBentoLarge && item.durationMinutes > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-purple-700 dark:text-purple-300">
                  {item.durationMinutes}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">min/task</div>
              </div>
            )}
          </div>

          {/* Footer - Engagement metrics */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {item.upVotes}
              </span>
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {item.commentsCount}
              </span>
            </div>
            
            {/* View details arrow */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );

  // Helper function for category gradients
  const getCategoryGradient = (category: string) => {
    switch (category.toLowerCase()) {
      case 'data-entry': return 'from-blue-500 to-cyan-500';
      case 'analysis': return 'from-purple-500 to-pink-500';
      case 'reporting': return 'from-green-500 to-emerald-500';
      case 'automation': return 'from-amber-500 to-orange-500';
      case 'integration': return 'from-pink-500 to-rose-500';
      default: return 'from-indigo-500 to-purple-500';
    }
  };

  // Render list view card (similar to original but more compact)
  const renderListCard = (item: GalleryItem, index: number) => (
    <div
      key={item.id}
      ref={index === items.length - 1 ? lastItemRef : null}
      className="group relative bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 
        shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden"
    >
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getCategoryGradient(item.category)}`}></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {item.user.photoUrl ? (
                <img
                  src={item.user.photoUrl}
                  alt={item.user.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {item.user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/requests/${item.id}`} className="block mb-2">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                  {item.title}
                </h4>
              </Link>
              
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium">{item.user.name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                {item.user.department && (
                  <>
                    <span>•</span>
                    <span>{item.user.department}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Link
            href={`/requests/${item.id}`}
            className="flex-shrink-0 ml-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            View
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
          {item.description || 'No description available.'}
        </p>

        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
            {item.category}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status.replace('_', ' ')}
          </span>
          
          <div className="flex items-center gap-4 ml-auto text-sm">
            {item.hoursSavedPerWeek > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {item.hoursSavedPerWeek}h/week saved
              </span>
            )}
            {item.peopleInvolved > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {item.peopleInvolved} people impacted
              </span>
            )}
            <span className="flex items-center gap-1 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {item.upVotes}
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {item.commentsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-72"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {(statusFilter !== 'all' || categoryFilter !== 'all') && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                Active
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('bento')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'bento' 
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value="all">All Statuses</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              >
                <option value="all">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Stats */}
            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-2 w-full">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {items.length} ideas found
                </p>
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(statusFilter !== 'all' || categoryFilter !== 'all') && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gallery Items */}
      {items.length === 0 && !loading ? (
        <div className="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No Ideas Found</h3>
          <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item, index) => renderCompactCard(item, index))}
                    </div>
                  )}
                  
          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {items.map((item, index) => renderListCard(item, index))}
                    </div>
                  )}
                  
          {/* Bento Grid View */}
          {viewMode === 'bento' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
              {items.map((item, index) => {
                // Make first item and every 5th item large
                const isLarge = index === 0 || (index + 1) % 5 === 0;
                return renderCompactCard(item, index, isLarge);
              })}
            </div>
          )}

          {/* Loading More */}
          {loadingMore && (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-[#0066cc] dark:text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
          )}

          {/* End of Results */}
          {!hasMore && items.length > 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <span>You've reached the end of the gallery!</span>
                <span className="text-2xl">🎉</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
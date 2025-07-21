'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

export default function Gallery() {
  const { firebaseUser } = useSessionProfile();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  // Filter and sort states
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const fetchGalleryItems = async (pageNum: number = 0, reset: boolean = false) => {
    if (!firebaseUser) return;

    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const idToken = await getIdToken(firebaseUser);
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        sortBy,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(searchQuery && { search: searchQuery }),
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
        setPage(0); // Reset page counter
      } else {
        // Only add items if they are new (avoid duplicates)
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = data.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      
      // Update hasMore based on API response
      setHasMore(data.pagination.hasMore);
      setAvailableCategories(data.filters.categories);
      setAvailableStatuses(data.filters.statuses);
      setError(null);
    } catch (err) {
      console.error('Error fetching gallery items:', err);
      setError('Failed to load gallery items. Please try again.');
      setHasMore(false); // Stop trying to load more on error
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGalleryItems(nextPage, false);
    }
  };

  const handleFilterChange = () => {
    setPage(0);
    setItems([]);
    setHasMore(true);
    fetchGalleryItems(0, true);
  };

  useEffect(() => {
    if (firebaseUser) {
      setPage(0);
      setItems([]);
      setHasMore(true);
      fetchGalleryItems(0, true);
    }
  }, [firebaseUser, sortBy, statusFilter, categoryFilter, searchQuery]);

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
      case 'data-entry': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'analysis': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
      case 'reporting': return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
      case 'automation': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
      case 'integration': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300';
      default: return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
    }
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
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

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full sm:w-64"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {(statusFilter !== 'all' || categoryFilter !== 'all') && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
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
        <div className="space-y-6">
          {items.map((item, index) => (
            <div
              key={item.id}
              ref={index === items.length - 1 ? lastItemRef : null}
              className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden"
            >
              {/* Gradient accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              
              <div className="p-8">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Enhanced User Avatar */}
                    <div className="relative flex-shrink-0">
                      {item.user.photoUrl ? (
                        <img
                          src={item.user.photoUrl}
                          alt={item.user.name}
                          className="w-16 h-16 rounded-2xl object-cover border-3 border-white dark:border-slate-700 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {item.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Status indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 ${getStatusColor(item.status)} flex items-center justify-center`}>
                        <span className="text-xs font-bold">
                          {getComplexityIcon(item.complexity)}
                        </span>
                      </div>
                    </div>

                    {/* Title & User Info */}
                    <div className="flex-1 min-w-0">
                      {/* Title First - Most Prominent - Clickable */}
                      <Link href={`/requests/${item.id}`} className="group/title cursor-pointer mb-3 block">
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors duration-200 line-clamp-2 group-hover/title:line-clamp-none">
                          {item.title}
                        </h4>
                      </Link>

                      {/* User Info - Secondary */}
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {item.user.name}
                        </h3>
                        <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {item.user.jobTitle && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 8v10l4-4 4 4V8" />
                            </svg>
                            {item.user.jobTitle}
                          </span>
                        )}
                        {item.user.department && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {item.user.department}
                          </span>
                        )}
                        {item.user.officeLocation && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {item.user.officeLocation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Button - More Prominent */}
                  <div className="flex-shrink-0 ml-4">
                    <Link
                      href={`/requests/${item.id}`}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 group/btn"
                    >
                      <span>View Details</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Enhanced Description */}
                <div className="mb-6">
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                    {item.description || 'No description available.'}
                  </p>
                </div>

                {/* Enhanced Tags & Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Category</div>
                    <div className={`text-sm font-bold px-2 py-1 rounded-lg ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </div>
                  </div>
                  
                  {item.frequency && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Frequency</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.frequency}
                      </div>
                    </div>
                  )}
                  
                  {item.hoursSavedPerWeek > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                      <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Time Saved</div>
                      <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        {item.hoursSavedPerWeek}h/week
                      </div>
                    </div>
                  )}
                  
                  {item.peopleInvolved > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                      <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Impact</div>
                      <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        {item.peopleInvolved} people
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group/vote">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover/vote:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="font-medium">{item.upVotes}</span>
                    </button>
                    
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium">{item.commentsCount}</span>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${getStatusColor(item.status)}`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1).replace('_', ' ')}
                    </span>
                    <span className="text-lg">
                      {getComplexityIcon(item.complexity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

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
              <p className="text-slate-500 dark:text-slate-400">
                You've reached the end of the gallery! 🎉
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
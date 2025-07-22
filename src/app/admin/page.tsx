'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@/lib/contexts/ThemeContext';

interface Submission {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  title: string;
  status: string;
  shared: boolean;
  createdAt: number;
  updatedAt: number;
  upVotes?: number;
  commentsCount?: number;
  request: {
    processDescription: string;
    processSummary?: string;
    painPoints?: string[];
    tools?: string[];
    roles?: string[];
    impactScore?: number;
    category?: string;
    frequency?: string;
    hoursSavedPerWeek?: number;
    peopleInvolved?: number;
  };
  assignedTo?: string;
  complexity?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sharedFilter, setSharedFilter] = useState('all');
  const [complexityFilter, setComplexityFilter] = useState('all');
  
  // Delete functionality state
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check if already authenticated on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch submissions when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'i-am-admin') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    setSubmissions([]);
    setSelectedSubmission(null);
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/submissions', {
        headers: {
          'X-Admin-Password': 'i-am-admin'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }
      
      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': 'i-am-admin'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update submission');
      }
      
      // Refresh submissions
      await fetchSubmissions();
      setSelectedSubmission(null);
    } catch (err) {
      console.error('Error updating submission:', err);
      alert('Failed to update submission status');
    }
  };

  const toggleSharing = async (submissionId: string, currentShared: boolean) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': 'i-am-admin'
        },
        body: JSON.stringify({ shared: !currentShared })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sharing status');
      }
      
      // Refresh submissions
      await fetchSubmissions();
    } catch (err) {
      console.error('Error updating sharing status:', err);
      alert('Failed to update sharing status');
    }
  };

  // Delete functionality
  const deleteSubmissions = async (submissionIds: string[]) => {
    setDeleteLoading(true);
    try {
      const response = await fetch('/api/admin/submissions/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': 'i-am-admin'
        },
        body: JSON.stringify({ submissionIds })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete submission(s)');
      }
      
      const result = await response.json();
      alert(result.message);
      
      // Clear selections and refresh
      setSelectedForDelete(new Set());
      setSelectedSubmission(null);
      await fetchSubmissions();
    } catch (err) {
      console.error('Error deleting submissions:', err);
      alert('Failed to delete submission(s): ' + (err as Error).message);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleSingleDelete = () => {
    if (selectedSubmission) {
      deleteSubmissions([selectedSubmission.id]);
    }
  };

  const handleBulkDelete = () => {
    deleteSubmissions(Array.from(selectedForDelete));
  };

  const toggleSelectSubmission = (submissionId: string) => {
    const newSelected = new Set(selectedForDelete);
    if (newSelected.has(submissionId)) {
      newSelected.delete(submissionId);
    } else {
      newSelected.add(submissionId);
    }
    setSelectedForDelete(newSelected);
  };

  const selectAllSubmissions = () => {
    const allIds = filteredSubmissions.map(s => s.id);
    setSelectedForDelete(new Set(allIds));
  };

  const clearSelection = () => {
    setSelectedForDelete(new Set());
  };

  const formatDate = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'in_review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'pilot': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Filter submissions based on search and status
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = searchTerm === '' || 
      submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.request.processDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.request.processSummary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.userEmail && submission.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesShared = sharedFilter === 'all' || 
      (sharedFilter === 'shared' && submission.shared) ||
      (sharedFilter === 'private' && !submission.shared);
    const matchesComplexity = complexityFilter === 'all' || submission.complexity === complexityFilter;
    
    return matchesSearch && matchesStatus && matchesShared && matchesComplexity;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bgc-panel rounded-2xl p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">
              Admin Portal Access
            </h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0066cc] focus:border-[#0066cc] dark:bg-slate-800 dark:text-white"
                  placeholder="Enter admin password"
                />
              </div>
              {error && (
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bgc-button-primary"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Portal</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Manage all user submissions</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-[#0066cc] border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Loading submissions...</p>
            </div>
          ) : (
            <>
              {/* Search and Filter Bar */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search submissions by title, description, or user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0066cc] focus:border-[#0066cc] dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setSharedFilter('all');
                        setComplexityFilter('all');
                      }}
                      className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="in_review">In Review</option>
                    <option value="pilot">Pilot</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <select
                    value={sharedFilter}
                    onChange={(e) => setSharedFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  >
                    <option value="all">All Visibility</option>
                    <option value="shared">📢 Shared (Public)</option>
                    <option value="private">🔒 Private</option>
                  </select>
                  
                  <select
                    value={complexityFilter}
                    onChange={(e) => setComplexityFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  >
                    <option value="all">All Complexity</option>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                
                {/* Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-slate-800 dark:text-white">{submissions.length}</div>
                    <div className="text-slate-600 dark:text-slate-400">Total</div>
                  </div>
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-emerald-800 dark:text-emerald-300">
                      {submissions.filter(s => s.shared).length}
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400">Shared</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-slate-800 dark:text-white">
                      {submissions.filter(s => !s.shared).length}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">Private</div>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                    <div className="font-bold text-lg text-blue-800 dark:text-blue-300">{filteredSubmissions.length}</div>
                    <div className="text-blue-600 dark:text-blue-400">Filtered</div>
                  </div>
                </div>
                
                {/* Bulk Actions */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedForDelete.size === filteredSubmissions.length && filteredSubmissions.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllSubmissions();
                          } else {
                            clearSelection();
                          }
                        }}
                        className="w-4 h-4 text-[#0066cc] bg-slate-100 border-slate-300 rounded focus:ring-[#0066cc] dark:bg-slate-700 dark:border-slate-600"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Select All ({selectedForDelete.size} selected)
                      </span>
                    </div>
                    {selectedForDelete.size > 0 && (
                      <button
                        onClick={clearSelection}
                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                  
                  {selectedForDelete.size > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedForDelete.size} item(s) selected
                      </span>
                      <button
                        onClick={() => setShowBulkDeleteConfirm(true)}
                        disabled={deleteLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {deleteLoading ? 'Deleting...' : `Delete Selected (${selectedForDelete.size})`}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Submissions List */}
                <div className="lg:col-span-2">
                  <div className="bgc-panel rounded-xl p-6 h-full flex flex-col">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                      Submissions ({filteredSubmissions.length} of {submissions.length})
                    </h2>
                    <div className="space-y-3 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                      {filteredSubmissions.length === 0 ? (
                        <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                          No submissions found matching your filters
                        </p>
                      ) : (
                        filteredSubmissions.map((submission) => (
                          <div
                            key={submission.id}
                            className={`p-4 border rounded-lg ${
                              selectedSubmission?.id === submission.id
                                ? 'border-[#0066cc] bg-[#0066cc]/5 dark:bg-[#0066cc]/10'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={selectedForDelete.has(submission.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectSubmission(submission.id);
                                }}
                                className="w-4 h-4 text-[#0066cc] bg-slate-100 border-slate-300 rounded focus:ring-[#0066cc] dark:bg-slate-700 dark:border-slate-600 mt-1 flex-shrink-0"
                              />
                              <div 
                                className="flex-1 cursor-pointer" 
                                onClick={() => setSelectedSubmission(submission)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-1 flex-1 mr-2">
                                    {submission.title}
                                  </h3>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                                      {submission.status}
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      submission.shared 
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                      {submission.shared ? '📢' : '🔒'}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                  {submission.userEmail || submission.userName || 'Unknown User'}
                                </p>
                                <div className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span>{formatDate(submission.updatedAt)}</span>
                                    {submission.complexity && (
                                      <span className={`px-2 py-1 rounded-full font-medium ${
                                        submission.complexity === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        submission.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                      }`}>
                                        {submission.complexity}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span>{submission.request.category || 'No category'}</span>
                                    <div className="flex items-center gap-2 text-xs">
                                      {submission.upVotes !== undefined && (
                                        <span className="flex items-center gap-1">
                                          ❤️ {submission.upVotes}
                                        </span>
                                      )}
                                      {submission.commentsCount !== undefined && (
                                        <span className="flex items-center gap-1">
                                          💬 {submission.commentsCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Submission Details */}
                <div className="lg:col-span-3">
                  {selectedSubmission ? (
                    <div className="bgc-panel rounded-xl p-6 h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                      <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                        Submission Details
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Title</label>
                          <p className="text-slate-800 dark:text-white">{selectedSubmission.title}</p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Description</label>
                          <p className="text-slate-800 dark:text-white text-sm whitespace-pre-wrap">
                            {selectedSubmission.request.processSummary || selectedSubmission.request.processDescription}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
                          <select
                            value={selectedSubmission.status}
                            onChange={(e) => updateSubmissionStatus(selectedSubmission.id, e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                          >
                            <option value="new">New</option>
                            <option value="in_review">In Review</option>
                            <option value="pilot">Pilot</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Visibility</label>
                          <button
                            onClick={() => toggleSharing(selectedSubmission.id, selectedSubmission.shared)}
                            className={`mt-1 w-full px-4 py-2 rounded-lg font-medium ${
                              selectedSubmission.shared
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                          >
                            {selectedSubmission.shared ? 'Shared (Public)' : 'Private'}
                          </button>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Category</label>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {selectedSubmission.request.category || 'Not specified'}
                            </p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Frequency</label>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {selectedSubmission.request.frequency || 'Not specified'}
                            </p>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                            <label className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Time Saved</label>
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                              {selectedSubmission.request.hoursSavedPerWeek || 0}h/week
                            </p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <label className="text-xs font-medium text-blue-600 dark:text-blue-400">People Involved</label>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                              {selectedSubmission.request.peopleInvolved || 0}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1">User Info</label>
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-1">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-medium">Email:</span> {selectedSubmission.userEmail || 'No email'}
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-medium">Name:</span> {selectedSubmission.userName || 'No name'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              <span className="font-medium">User ID:</span> {selectedSubmission.userId}
                            </p>
                            <div className="flex gap-4 text-xs">
                              <span>❤️ {selectedSubmission.upVotes || 0} votes</span>
                              <span>💬 {selectedSubmission.commentsCount || 0} comments</span>
                            </div>
                          </div>
                        </div>

                        {selectedSubmission.request.painPoints && selectedSubmission.request.painPoints.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Pain Points</label>
                            <ul className="mt-1 space-y-1 bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3">
                              {selectedSubmission.request.painPoints.map((point, idx) => (
                                <li key={idx} className="text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2">
                                  <span className="text-rose-500 mt-1">•</span>
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedSubmission.request.tools && selectedSubmission.request.tools.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Tools & Systems</label>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {selectedSubmission.request.tools.map((tool, idx) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                                  {tool}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedSubmission.request.roles && selectedSubmission.request.roles.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Roles Involved</label>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {selectedSubmission.request.roles.map((role, idx) => (
                                <span key={idx} className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full">
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                          <button
                            onClick={() => router.push(`/requests/${selectedSubmission.id}`)}
                            className="w-full bgc-button-primary"
                          >
                            View Full Details
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={deleteLoading}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {deleteLoading ? 'Deleting...' : 'Delete Submission'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bgc-panel rounded-xl p-6 text-center h-full flex items-center justify-center" style={{ minHeight: '400px' }}>
                      <p className="text-slate-600 dark:text-slate-400">
                        Select a submission to view details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialogs */}
      {showDeleteConfirm && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete the submission "{selectedSubmission.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSingleDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Confirm Bulk Delete
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete {selectedForDelete.size} selected submission(s)? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {deleteLoading ? 'Deleting...' : `Delete ${selectedForDelete.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
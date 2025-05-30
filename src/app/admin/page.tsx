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
  request: {
    processDescription: string;
    painPoints?: string[];
    tools?: string[];
    roles?: string[];
    impactScore?: number;
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
      (submission.userEmail && submission.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
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
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search submissions by title, description, or user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#0066cc] focus:border-[#0066cc] dark:bg-slate-800 dark:text-white"
                  />
                </div>
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
                            onClick={() => setSelectedSubmission(submission)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                              selectedSubmission?.id === submission.id
                                ? 'border-[#0066cc] bg-[#0066cc]/5 dark:bg-[#0066cc]/10'
                                : 'border-slate-200 dark:border-slate-700 hover:border-[#0066cc]/50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-slate-800 dark:text-white line-clamp-1">
                                {submission.title}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                                {submission.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              {submission.userEmail || submission.userName || 'Unknown User'}
                            </p>
                            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-500">
                              <span>{formatDate(submission.updatedAt)}</span>
                              <div className="flex items-center gap-3">
                                <span className={submission.shared ? 'text-emerald-600' : 'text-slate-400'}>
                                  {submission.shared ? 'Shared' : 'Private'}
                                </span>
                                {submission.complexity && (
                                  <span className="capitalize">{submission.complexity}</span>
                                )}
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
                          <p className="text-slate-800 dark:text-white text-sm">
                            {selectedSubmission.request.processDescription}
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
                            className={`mt-1 w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                              selectedSubmission.shared
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                          >
                            {selectedSubmission.shared ? 'Shared (Public)' : 'Private'}
                          </button>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1">User Info</label>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{selectedSubmission.userEmail || 'No email'}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{selectedSubmission.userName || 'No name'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">ID: {selectedSubmission.userId}</p>
                        </div>

                        {selectedSubmission.request.painPoints && selectedSubmission.request.painPoints.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Pain Points</label>
                            <ul className="mt-1 space-y-1">
                              {selectedSubmission.request.painPoints.map((point, idx) => (
                                <li key={idx} className="text-sm text-slate-700 dark:text-slate-300">• {point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => router.push(`/requests/${selectedSubmission.id}`)}
                            className="w-full bgc-button-primary"
                          >
                            View Full Details
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
    </div>
  );
} 
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';
import { getIdToken } from 'firebase/auth';
import { useTheme } from '@/lib/contexts/ThemeContext';
import Link from 'next/link';
import SubmittingModal from '@/components/SubmittingModal';

export default function QuickSubmitPage() {
  const { profile, firebaseUser } = useSessionProfile();
  const { theme } = useTheme();
  const router = useRouter();
  const [textContent, setTextContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [shareToGallery, setShareToGallery] = useState(true);
  const [submissionLogs, setSubmissionLogs] = useState('');

  const handleFileUpload = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter(file => {
      // Allow most document types
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      const maxSize = 25 * 1024 * 1024; // 25MB per file
      
      return allowedTypes.includes(file.type) && file.size <= maxSize;
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (!textContent.trim() && files.length === 0) {
      alert('Please provide either text content or upload files before submitting.');
      return;
    }

    if (!firebaseUser) {
      alert('Please sign in to submit your idea.');
      return;
    }

    setIsSubmitting(true);

    try {
      const idToken = await getIdToken(firebaseUser);
      
      // Create a conversation first
      const startResponse = await fetch('/api/chat/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Accept': 'application/json',
          'x-headless': '1',
        },
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start submission process');
      }

      const startData = await startResponse.json();
      const conversationId = startData.conversationId as string;
      if (!conversationId) {
        throw new Error('Failed to create submission');
      }

      // Upload files if any
      const uploadedAttachments = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', conversationId);
        
        const uploadResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`
          },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const attachment = await uploadResponse.json();
          uploadedAttachments.push(attachment);
        }
      }

      // Create comprehensive message with appendix note for AI
      const appendixNote = `
[APPENDIX - QUICK UPLOAD SUBMISSION]
This submission was made via the Quick Upload method. The user has provided the following information:

${textContent ? `Text Content: ${textContent}` : ''}

${uploadedAttachments.length > 0 ? `Uploaded Files: ${uploadedAttachments.map(att => att.name).join(', ')}` : ''}

Please analyze this submission as you would a regular chat conversation and extract all relevant automation details. The user has provided their complete idea/process description above.
`;

      const finalMessage = textContent + appendixNote;

      // Send the message with text content
      const messageResponse = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          conversationId,
          message: finalMessage,
          useThinkingModel: true // Use thinking model for processing
        }),
      });

      if (messageResponse.ok) {
        // Wait for AI response to finish
        const responseReader = messageResponse.body?.getReader();
        if (responseReader) {
          while (true) {
            const { done } = await responseReader.read();
            if (done) break;
          }
        }

        // Automatically finalize the request
        const completeRes = await fetch('/api/chat/complete/stream', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ conversationId })
        });

        if (completeRes.ok && completeRes.body) {
          const reader = completeRes.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunkText = decoder.decode(value, { stream: true });
            setSubmissionLogs(prev => prev + chunkText);
          }
          router.push('/chats');
        } else {
          router.push(`/chat/${conversationId}`); // Fallback to chat view
        }
      } else {
        throw new Error('Failed to process submission');
      }

    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit your idea. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📋';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text')) return '📄';
    return '📎';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <AppHeader />
      
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Link 
                href="/"
                className="mr-4 p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m0 0H3m20 7v0H8" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
                Quick Submit Your Idea
              </h1>
            </div>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Have all your information ready? Upload files and paste your content for fast processing.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Content Input Section */}
            <div className="p-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                Describe Your Automation Idea
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Provide details about the process you'd like to automate, current pain points, frequency, tools involved, and expected impact.
              </p>
              
              <textarea
                ref={textareaRef}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste or type your complete automation idea here. Include details about:
- What process needs automation
- Current challenges and pain points  
- How often this process runs
- Tools and people involved
- Expected impact and time savings
- Any other relevant information..."
                className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                disabled={isSubmitting}
              />
              
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {textContent.length} characters
              </div>
            </div>

            {/* File Upload Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">
                Supporting Documents
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Upload any relevant files like process documents, screenshots, spreadsheets, or examples.
              </p>

              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-slate-800 dark:text-white">
                      Drop files here or click to browse
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Supports PDF, Word, Excel, PowerPoint, images, and text files up to 25MB each
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    Choose Files
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
                disabled={isSubmitting}
              />

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-3">
                    Uploaded Files ({files.length})
                  </h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getFileIcon(file.type)}</span>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">{file.name}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                          disabled={isSubmitting}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Section */}
            <div className="border-t border-slate-200 dark:border-slate-700 p-8 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Your submission will be processed by AI and reviewed by our team
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Link
                    href="/"
                    className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (!textContent.trim() && files.length === 0)}
                    className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting && (
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Idea'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SubmittingModal 
        show={isSubmitting}
        logs={submissionLogs}
        shareToGallery={shareToGallery}
        onShareChange={setShareToGallery}
      />
    </div>
  );
} 
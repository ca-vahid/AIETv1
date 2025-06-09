import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getIdToken } from 'firebase/auth';
import { useSessionProfile } from '@/lib/contexts/SessionProfileContext';

interface Attachment {
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
  thumbnailUrl: string | null;
  uploadedAt: number;
}

interface FileUploaderProps {
  conversationId: string;
  onFileUploaded: (file: Attachment) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function FileUploader({ 
  conversationId, 
  onFileUploaded, 
  onError,
  disabled = false,
  className = ''
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { firebaseUser } = useSessionProfile();

  // Handle file upload
  const uploadFile = useCallback(async (file: File) => {
    if (!firebaseUser) {
      onError('You must be logged in to upload files');
      return;
    }

    if (!conversationId) {
      onError('Missing conversation ID');
      return;
    }

    try {
      setIsUploading(true);
      
      // Get ID token for authentication
      const idToken = await getIdToken(firebaseUser);

      // Create form data for the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);

      // Send to our upload API
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const attachment = await response.json();
      onFileUploaded(attachment);
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [conversationId, firebaseUser, onError, onFileUploaded]);

  // Handler for file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Clear the input so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [uploadFile]);

  // Handle click on the upload area
  const handleClick = useCallback(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }, [disabled, uploadFile]);

  // Handle paste from clipboard
  const handlePaste = useCallback((e: ClipboardEvent) => {
    // Skip if the paste was in an input or textarea
    if (
      e.target instanceof HTMLInputElement || 
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Handle images
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
        }
        break;
      }
    }
  }, [uploadFile]);

  // Set up document-level paste handler
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <div 
      ref={dropRef}
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled || isUploading}
      />
      
      <div 
        className={`
          flex flex-col items-center justify-center p-2 border-2 border-dashed min-h-[60px]
          rounded-lg transition-colors duration-200 
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10'}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-1">
            <div className="w-6 h-6 border-3 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Uploading...</p>
          </div>
        ) : (
          <>
            <svg 
              className={`w-6 h-6 mb-1 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Documents, spreadsheets, and images (up to 25MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
} 
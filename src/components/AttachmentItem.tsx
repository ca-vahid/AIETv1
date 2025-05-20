import React from 'react';

interface Attachment {
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
  thumbnailUrl: string | null;
  uploadedAt: number;
}

interface AttachmentItemProps {
  attachment: Attachment;
  className?: string;
  inChat?: boolean;
  onRemove?: (attachment: Attachment) => void;
}

export default function AttachmentItem({ 
  attachment, 
  className = '',
  inChat = false,
  onRemove
}: AttachmentItemProps) {
  const { name, url, type, size, thumbnailUrl } = attachment;
  
  // Format the file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Determine icon based on file type
  const getFileIcon = () => {
    if (type.startsWith('image/')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (type.includes('pdf')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (type.includes('spreadsheet') || type.includes('excel') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      );
    } else if (type.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      );
    }
  };

  // In-chat attachment renders as a bubble
  if (inChat) {
    return (
      <div className={`flex items-center p-2 rounded-lg border ${
        type.startsWith('image/') 
          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
        } ${className}`}
      >
        {type.startsWith('image/') && thumbnailUrl ? (
          <div className="relative mr-3 w-12 h-12 overflow-hidden rounded-md flex-shrink-0">
            <img 
              src={thumbnailUrl} 
              alt={name}
              className="w-full h-full object-cover" 
            />
          </div>
        ) : (
          <div className="flex items-center justify-center mr-3 w-10 h-10 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">
            {getFileIcon()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block text-sm font-medium text-blue-600 dark:text-blue-400 truncate hover:underline"
          >
            {name}
          </a>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(size)}
          </p>
        </div>
      </div>
    );
  }

  // Regular attachment list item
  return (
    <div className={`flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {type.startsWith('image/') && thumbnailUrl ? (
        <div className="relative mr-3 w-12 h-12 overflow-hidden rounded-md flex-shrink-0">
          <img 
            src={thumbnailUrl} 
            alt={name}
            className="w-full h-full object-cover" 
          />
        </div>
      ) : (
        <div className="flex items-center justify-center mr-3 w-10 h-10 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">
          {getFileIcon()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {name}
        </h3>
        <div className="flex items-center mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            {formatFileSize(size)}
          </p>
          <a 
            href={url} 
            target="_blank"
            rel="noopener noreferrer" 
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Preview
          </a>
        </div>
      </div>

      {onRemove && (
        <button
          onClick={() => onRemove(attachment)}
          className="ml-3 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-500 focus:outline-none"
          title="Remove attachment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
} 
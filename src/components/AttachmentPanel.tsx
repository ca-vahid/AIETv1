import React, { useState } from 'react';
import FileUploader from './FileUploader';
import AttachmentItem from './AttachmentItem';

interface Attachment {
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
  thumbnailUrl: string | null;
  uploadedAt: number;
}

interface AttachmentPanelProps {
  conversationId: string;
  attachments: Attachment[];
  onAttachmentAdded: (attachment: Attachment) => void;
  onAttachmentRemoved: (path: string) => void;
  onContinue: () => void;
  className?: string;
}

export default function AttachmentPanel({
  conversationId,
  attachments,
  onAttachmentAdded,
  onAttachmentRemoved,
  onContinue,
  className = ''
}: AttachmentPanelProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileUploaded = (attachment: Attachment) => {
    setError(null);
    onAttachmentAdded(attachment);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className={`${className} bg-white dark:bg-gray-900 rounded-lg shadow-md border border-blue-100 dark:border-gray-800 overflow-hidden`}>
      <div className="p-2.5 border-b border-blue-100 dark:border-gray-700">
        <h2 className="text-base font-medium text-gray-900 dark:text-white">
          File Attachments
        </h2>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Upload files that will help illustrate your request. You can drag and drop files, browse, or paste images.
        </p>
      </div>

      <div className="p-2.5">
        {/* Compact single row layout */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Uploader - smaller and more compact */}
          <div className={`${attachments.length > 0 ? 'sm:w-1/2' : 'w-full'}`}>
            <FileUploader
              conversationId={conversationId}
              onFileUploaded={handleFileUploaded}
              onError={handleError}
              className="h-full"
            />

            {error && (
              <div className="mt-2 text-xs text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-md p-1.5">
                {error}
              </div>
            )}
          </div>

          {/* List - more compact */}
          {attachments.length > 0 && (
            <div className="flex-1">
              <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {attachments.length} {attachments.length === 1 ? 'file' : 'files'} attached
              </h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {attachments.map((attachment) => (
                  <AttachmentItem
                    key={attachment.path}
                    attachment={attachment}
                    onRemove={() => onAttachmentRemoved(attachment.path)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-2.5 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/20 flex justify-between items-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {attachments.length === 0 
            ? "You can continue without attachments if they're not needed."
            : "Continue when ready"}
        </p>
        <button
          onClick={onContinue}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-1.5 px-4 rounded-md shadow-sm transition-colors duration-200 text-sm"
        >
          Continue to Summary
        </button>
      </div>
    </div>
  );
} 
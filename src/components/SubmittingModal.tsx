import React, { useState, useEffect } from 'react';

interface SubmittingModalProps {
  show: boolean;
  logs?: string; // Live streamed logs / LLM output
}

export default function SubmittingModal({ show, logs = '' }: SubmittingModalProps) {
  const [forceShow, setForceShow] = React.useState(false);
  const [elapsed, setElapsed] = useState(0);
  
  // Reset forceShow whenever show changes
  useEffect(() => {
    if (show) {
      setForceShow(true);
      // Set a timeout to ensure the modal stays visible for at least 5 seconds
      const timer = setTimeout(() => {
        setForceShow(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setForceShow(false);
    }
  }, [show]);
  
  // Track elapsed time when modal is shown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (show) {
      setElapsed(0);
      timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [show]);
  
  if (!show && !forceShow) return null;

  // Clean up markdown fences for nicer display
  const cleanedLogs = logs
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 sm:p-8 w-full max-w-lg shadow-xl border border-blue-200 dark:border-gray-700 flex flex-col text-center max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-center mb-4 gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Submitting Your Idea</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">We're processing your request and extracting key details. You can watch the live progress below.</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Time elapsed: {elapsed}s. This shouldn't take more than 30 seconds.</p>

        {/* Live log area */}
        <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-md p-3 text-left text-xs sm:text-sm leading-relaxed border border-gray-200 dark:border-gray-700 whitespace-pre-wrap font-mono shadow-inner max-h-[60vh]">
          {cleanedLogs === '' ? (
            <span className="italic text-gray-400 dark:text-gray-500">Waiting for response…</span>
          ) : (
            cleanedLogs
          )}
        </div>
      </div>
    </div>
  );
} 
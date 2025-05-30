import React, { useState, useEffect, useRef } from 'react';

interface SubmittingModalProps {
  show: boolean;
  logs?: string; // Live streamed logs / LLM output
  shareToGallery: boolean;
  onShareChange: (value: boolean) => void;
}

export default function SubmittingModal({ show, logs = '', shareToGallery, onShareChange }: SubmittingModalProps) {
  const [forceShow, setForceShow] = React.useState(false);
  const [elapsed, setElapsed] = useState(0);
  const logContainerRef = useRef<HTMLDivElement>(null);
  
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
  
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (logContainerRef.current) {
      const element = logContainerRef.current;
      // Force scroll to bottom
      element.scrollTop = element.scrollHeight;
    }
  }, [logs]);
  
  if (!show && !forceShow) return null;

  // Clean up markdown fences for nicer display
  const cleanedLogs = logs
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  // Format the logs with better visual separation and basic HTML support
  const formatLogsToHtml = (logText: string): string => {
    let html = logText;
    // Basic bold/italic/code (already handled by API, but good to have client-side)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code class="font-mono px-1 py-0.5 text-xs bg-slate-200 dark:bg-gray-700 rounded">$1</code>');
    
    // Emojis and key phrases highlighting (simplified)
    html = html.replace(/(🧠|🤔|💭|📝|🔍|🏗️|💾|🧹|🎉)/g, '<span class="text-blue-500 dark:text-blue-400">$1</span>');
    html = html.replace(/(AI Thinking Process:|AI is thinking...)/g, '<strong class="text-purple-600 dark:text-purple-400">$1</strong>');
    html = html.replace(/(✅|Done!)/g, '<strong class="text-green-600 dark:text-green-400">$1</strong>');
    html = html.replace(/(⚠️|Warning:)/g, '<span class="text-amber-600 dark:text-amber-400">$1</span>');
    html = html.replace(/(❌|ERROR:)/g, '<strong class="text-red-600 dark:text-red-400">$1</strong>');
    html = html.replace(/(   │)/g, '<span class="text-gray-500 dark:text-gray-400 text-xs italic">$1</span>');
    html = html.replace(/(───────────────────────)/g, '<span class="text-gray-400 dark:text-gray-600 block my-1">$1</span>');

    return html.split('\n').map(line => `<p class="whitespace-pre-wrap min-h-[1em]">${line || '&nbsp;'}</p>`).join('');
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 sm:p-8 w-full max-w-2xl shadow-xl border border-blue-200 dark:border-gray-700 flex flex-col text-center max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-center mb-4 gap-3">
          <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Submitting Your Idea</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Watch the AI analyze your conversation and extract key details from your submission.</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Time elapsed: {elapsed}s</p>

        {/* Gallery share toggle */}
        <label className="flex items-center justify-center gap-2 mb-4 text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 rounded-lg shadow-inner">
          <input
            type="checkbox"
            checked={shareToGallery}
            onChange={(e) => onShareChange(e.target.checked)}
            className="h-5 w-5 accent-amber-600 dark:accent-amber-500 cursor-pointer"
          />
          <span className="select-none">
            Add this idea to <span className="font-bold underline">Gallery</span> for others to see
          </span>
        </label>

        {/* Live log area with improved styling */}
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-md p-4 text-left text-xs sm:text-sm leading-relaxed border border-gray-200 dark:border-gray-700 font-mono shadow-inner max-h-[60vh] scrollbar-thin scrollbar-thumb-blue-500 dark:scrollbar-thumb-blue-700 scrollbar-track-transparent"
        >
          {cleanedLogs === '' ? (
            <span className="italic text-gray-400 dark:text-gray-500">Waiting for response…</span>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: formatLogsToHtml(cleanedLogs) }} />
          )}
        </div>
        
        {/* Auto-scroll indicator */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
          Auto-scrolling enabled • Following AI processing in real-time
        </div>
      </div>
    </div>
  );
} 
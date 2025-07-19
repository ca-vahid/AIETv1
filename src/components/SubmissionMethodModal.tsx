'use client';

import React from 'react';
import { useTheme } from "@/lib/contexts/ThemeContext";
import Link from 'next/link';

interface SubmissionMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmissionMethodModal({ isOpen, onClose }: SubmissionMethodModalProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Choose Your Submission Method
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Select how you'd like to submit your automation idea
          </p>
        </div>

        {/* Options */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chat with AI Option */}
          <Link 
            href="/chat"
            className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg"
            onClick={onClose}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Chat with AI
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Have a guided conversation with our AI assistant to capture all the details about your process
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Recommended</span>
              </div>
            </div>
          </Link>

          {/* Quick Upload Option */}
          <Link 
            href="/submit/quick"
            className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-6 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-lg"
            onClick={onClose}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Quick Upload
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upload documents or paste text with all your information ready to go
                </p>
              </div>
              <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Fast & Direct</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Both methods lead to the same professional review process by our AI Efficiency Team
          </p>
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import useSpeechToText from '@/lib/hooks/useSpeechToText';
import SpeechRecognition from 'react-speech-recognition';

interface VoiceInputProps {
  onTranscriptUpdate: (text: string) => void;
  onListenStart?: () => void;
  onListenStop?: () => void;
  language?: string;
  className?: string;
}

// Export the handle type for TypeScript
export interface VoiceInputHandle {
  clearTranscript: () => void;
  startListening: () => void;
  stopListening: () => void;
}

const VoiceInput = forwardRef<VoiceInputHandle, VoiceInputProps>(({
  onTranscriptUpdate,
  onListenStart,
  onListenStop,
  language = 'en-US',
  className = '',
}, ref) => {
  const [showError, setShowError] = useState(false);

  const {
    isListening,
    startListening,
    stopListening,
    clearTranscript,
    error,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    isPolyfillLoaded
  } = useSpeechToText({
    onTranscriptChange: onTranscriptUpdate,
    language: language,
    continuous: true
  });

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    clearTranscript: () => {
      // Reset the library transcript
      clearTranscript();
      // If currently listening, abort to ensure clean slate
      if (isListening) {
        try {
          SpeechRecognition.abortListening();
        } catch (err) {
          console.error("Error aborting speech recognition:", err);
        }
      }
    },
    startListening,
    stopListening
  }));

  // Handle toggle mode
  const toggleListening = () => {
    if (isListening) {
      onListenStop?.();
      stopListening();
    } else {
      onListenStart?.();
      clearTranscript();
      startListening();
    }
  };

  // Display error for a few seconds then hide it
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // If speech recognition is not supported, render nothing
  if (browserSupportsSpeechRecognition === false) {
    return null;
  }

  // Initial support check
  if (!isPolyfillLoaded) {
    return (
      <button disabled className="opacity-50 cursor-not-allowed p-2 rounded-full bg-slate-600 text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  // Check mic support
  if (isMicrophoneAvailable === false) {
    return (
      <button 
        disabled 
        className="opacity-50 cursor-not-allowed p-2 rounded-full bg-slate-600 text-white"
        title="Microphone access is required"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Microphone Button */}
      <div className="relative">
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-full shadow-md transition-all duration-200 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-300/30 scale-110' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          title={isListening ? "Click to stop recording" : "Click to start recording"}
        >
          {isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        {/* Recording indicator pulsing animation */}
        {isListening && (
          <span className="absolute -right-1 -top-1 h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>

      {/* Error Message */}
      {showError && (
        <div className="absolute -bottom-8 right-0 text-xs text-red-400 bg-slate-800 px-2 py-1 rounded shadow-md z-10">
          {error}
        </div>
      )}
    </div>
  );
});

VoiceInput.displayName = 'VoiceInput';

export default VoiceInput; 
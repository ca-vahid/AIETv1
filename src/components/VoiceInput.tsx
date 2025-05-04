'use client';

import React, { useState, useEffect } from 'react';
import useSpeechToText from '@/lib/hooks/useSpeechToText';

interface VoiceInputProps {
  onTextReceived: (text: string) => void;
  language?: string;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTextReceived,
  language = 'en-US',
  className = '',
}) => {
  const [showError, setShowError] = useState(false);
  const [showTranscriptPopup, setShowTranscriptPopup] = useState(false);

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
    error,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    isPolyfillLoaded
  } = useSpeechToText({
    onTranscriptChange: (text) => {
      // Keep transcript popup open while receiving text
      setShowTranscriptPopup(true);
    },
    onFinalTranscript: (finalTranscript) => {
      if (finalTranscript.trim()) {
        onTextReceived(finalTranscript);
        
        // Hide the transcript popup after a short delay
        setTimeout(() => {
          setShowTranscriptPopup(false);
          clearTranscript(); // Clear the transcript after sending
        }, 1000);
      }
    },
    language: language,
    continuous: true
  });

  // Handle toggle mode
  const toggleListening = () => {
    if (isListening) {
      stopListening();
      // Keep popup visible for a moment to let the user see final text
      setTimeout(() => {
        setShowTranscriptPopup(false);
        clearTranscript(); // Clear the transcript after stopping
      }, 2000);
    } else {
      clearTranscript(); // Ensure we start with a clean transcript
      startListening();
      setShowTranscriptPopup(true);
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

  // Auto-hide transcript popup after inactivity
  useEffect(() => {
    if (showTranscriptPopup && !isListening && !transcript) {
      const timer = setTimeout(() => {
        setShowTranscriptPopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showTranscriptPopup, isListening, transcript]);

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

      {/* Transcript Popup - Absolute positioned for better visibility */}
      {(showTranscriptPopup && transcript) && (
        <div className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 z-20 min-w-[200px] max-w-[300px]">
          <div className="bg-slate-800 shadow-lg border border-slate-700 rounded-lg p-3 text-white text-sm">
            <div className="flex items-center mb-1.5">
              <div className="flex space-x-1 mr-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></div>
              </div>
              <span className="text-xs text-slate-300 font-medium">
                {isListening ? "Listening..." : "Processed speech:"}
              </span>
            </div>
            <p className="text-xs text-slate-300 max-h-[100px] overflow-y-auto break-words">
              {transcript}
            </p>
          </div>
          <div className="h-3 w-6 overflow-hidden inline-block absolute left-1/2 transform -translate-x-1/2 bottom-[-12px]">
            <div className="h-4 w-4 bg-slate-800 border-r border-b border-slate-700 rotate-45 transform origin-bottom-left"></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className="absolute -bottom-6 right-0 text-xs text-red-400 bg-slate-800 px-2 py-1 rounded shadow-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceInput; 
'use client';

import React, { useState, useEffect } from 'react';
import useSpeechToText from '@/lib/hooks/useSpeechToText';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceInputProps {
  onTranscriptUpdate: (text: string) => void;
  onListenStart?: () => void;
  onListenStop?: () => void;
  /**
   * An incrementing key from the parent component. When this value changes,
   * the transcript is cleared. This is useful for resetting the input after
   * a message is sent while the microphone is still listening.
   */
  resetKey?: number;
  language?: string;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptUpdate,
  onListenStart,
  onListenStop,
  resetKey,
  language = 'en-US',
  className = '',
}) => {
  const [showError, setShowError] = useState(false);
  // Bars for the audio visualization
  const bars = [0, 1, 2, 3, 4];

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

  // Clear transcript when reset key changes
  useEffect(() => {
    if (typeof resetKey === 'number') {
      clearTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

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
      {/* Microphone Button with Ripple & Glow Effects */}
      <div className="relative">
        <motion.button
          onClick={toggleListening}
          className={`p-2.5 rounded-full shadow-md transition-all duration-200 overflow-hidden ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          title={isListening ? "Click to stop recording" : "Click to start recording"}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            boxShadow: isListening 
              ? '0 0 0 4px rgba(239, 68, 68, 0.3)' 
              : '0 0 0 0px rgba(37, 99, 235, 0)'
          }}
        >
          {/* Ripple Effect (Active only when listening) */}
          <AnimatePresence>
            {isListening && (
              <motion.span
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{ 
                  opacity: 0,
                  scale: 1.5,
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "easeOut"
                }}
              />
            )}
          </AnimatePresence>
          
          {/* Microphone Icon */}
          {isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </motion.button>
        
        {/* Audio Wave Visualization (Appears when recording) */}
        {isListening && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex gap-[2px] h-8">
            {bars.map((i) => (
              <motion.span
                key={i}
                className="bg-red-400 w-1 rounded-full"
                initial={{ height: 4 }}
                animate={{ 
                  height: [4, 12 + Math.random() * 10, 4],
                }}
                transition={{
                  duration: 0.8 + Math.random() * 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        )}
        
        {/* Recording indicator pulsing animation */}
        {isListening && (
          <motion.span 
            className="absolute -right-1 -top-1 h-3 w-3"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </motion.span>
        )}
        
        {/* "Recording" label */}
        <AnimatePresence>
          {isListening && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute -bottom-7 left-1/2 transform -translate-x-1/2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap"
            >
              Recording
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {showError && (
        <div className="absolute -bottom-8 right-0 text-xs text-red-400 bg-slate-800 px-2 py-1 rounded shadow-md z-10">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceInput; 
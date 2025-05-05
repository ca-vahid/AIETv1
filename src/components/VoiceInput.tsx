'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSpeechToText from '@/lib/hooks/useSpeechToText';
import Wave from 'react-wavify';
import { motion, AnimatePresence } from 'framer-motion';
import useMeasure from 'react-use-measure';

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

// Equalizer bar heights - simulated audio levels
const generateBarHeights = () => {
  return Array.from({ length: 5 }, () => Math.random() * 0.6 + 0.2); // Values between 0.2 and 0.8
};

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptUpdate,
  onListenStart,
  onListenStop,
  resetKey,
  language = 'en-US',
  className = '',
}) => {
  const [showError, setShowError] = useState(false);
  const [equalizerBars, setEqualizerBars] = useState(generateBarHeights());
  const animationRef = useRef<number | null>(null);
  const [ref, bounds] = useMeasure();

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

  // Animate equalizer bars
  useEffect(() => {
    const updateBars = () => {
      if (isListening) {
        setEqualizerBars(generateBarHeights());
        animationRef.current = requestAnimationFrame(updateBars);
      }
    };

    if (isListening) {
      animationRef.current = requestAnimationFrame(updateBars);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

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

  // Clear transcript when parent indicates a reset
  useEffect(() => {
    if (typeof resetKey === 'number') {
      clearTranscript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

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
    <div className={`relative flex items-center ${className}`} ref={ref}>
      {/* Main Button with Animation Container */}
      <motion.div
        className="relative"
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* The button */}
        <motion.button
          onClick={toggleListening}
          className={`relative p-2.5 z-10 rounded-full shadow-lg text-white
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
          title={isListening ? "Click to stop recording" : "Click to start recording"}
        >
          {isListening ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </motion.button>
        
        {/* Animated Wave Background */}
        <AnimatePresence>
          {isListening && (
            <motion.div 
              className="absolute inset-0 rounded-full overflow-hidden z-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.3 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 opacity-50 rounded-full" />
              <div className="absolute -inset-2 overflow-hidden rounded-full">
                <Wave 
                  fill='rgba(239, 68, 68, 0.4)'
                  paused={!isListening}
                  options={{
                    height: 15,
                    amplitude: 10,
                    speed: 0.3,
                    points: 3
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Equalizer Bars (only shown when recording) */}
      <AnimatePresence>
        {isListening && (
          <motion.div 
            className="absolute -right-6 top-0 -translate-y-full flex items-end justify-center gap-[2px] h-14 pb-1"
            initial={{ opacity: 0, height: 0, width: 0 }}
            animate={{ opacity: 1, height: 'auto', width: 'auto' }}
            exit={{ opacity: 0, height: 0, width: 0 }}
            transition={{ duration: 0.3 }}
          >
            {equalizerBars.map((height, i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-red-400 to-red-600 rounded-full"
                style={{ height: `${height * 100}%` }}
                animate={{ 
                  height: `${height * 100}%`,
                  backgroundColor: i % 2 === 0 ? '#ef4444' : '#dc2626'
                }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
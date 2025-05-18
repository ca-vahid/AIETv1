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
  /**
   * Whether the voice input is disabled
   */
  disabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscriptUpdate,
  onListenStart,
  onListenStop,
  resetKey,
  language = 'en-US',
  className = '',
  disabled = false,
}) => {
  const [showError, setShowError] = useState(false);
  const [equalizerBars, setEqualizerBars] = useState(Array(5).fill(0.2));
  const [waveAmplitude, setWaveAmplitude] = useState(10);
  const [waveHeight, setWaveHeight] = useState(15);
  const [waveSpeed, setWaveSpeed] = useState(0.1);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [ref, bounds] = useMeasure();
  const [particles, setParticles] = useState<{ id: string; angle: number; speed: number }[]>([]);
  const frameRef = useRef(0);

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

  // Set up audio analysis when listening starts/stops
  useEffect(() => {
    if (isListening) {
      setupAudioAnalysis();
    } else {
      cleanupAudioAnalysis();
    }

    return () => {
      cleanupAudioAnalysis();
    };
  }, [isListening]);

  // Setup audio context and analyzer
  const setupAudioAnalysis = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.error("getUserMedia not supported");
        return;
      }

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.5;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Create data array for frequency data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      // Start animation loop
      animationRef.current = requestAnimationFrame(updateVisualization);
      console.log("Audio analysis setup complete");
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  // Clean up audio context and analyzer
  const cleanupAudioAnalysis = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
    
    // Reset visualization to default state
    setEqualizerBars(Array(5).fill(0.2));
    setWaveAmplitude(10);
    setWaveHeight(15);
    setWaveSpeed(0.1);
  };

  const spawnParticles = (count: number) => {
    const newParticles = Array.from({ length: count }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 30; // base pixel speed
      return { id: crypto.randomUUID(), angle, speed };
    });
    setParticles(prev => [...prev, ...newParticles]);
    newParticles.forEach(p => {
      setTimeout(() => {
        setParticles(prev => prev.filter(x => x.id !== p.id));
      }, 600);
    });
  };

  // Update visualization based on microphone input
  const updateVisualization = () => {
    if (!analyserRef.current || !dataArrayRef.current || !isListening) return;

    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Calculate average volume (0-255)
    const average = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
    
    // Log average volume every 30 frames for debugging
    if (Math.random() < 0.03) {
      console.log("Audio level:", average);
    }
    
    // Normalize to 0-1 range
    const normalizedVolume = average / 255;
    
    // Apply a sensitivity curve to make visualization more responsive
    // This makes quiet sounds more visible while keeping loud sounds from maxing out
    const enhancedVolume = Math.pow(normalizedVolume, 0.6); // Sensitivity adjustment
    
    // Particle bursts on peaks
    frameRef.current++;
    if (frameRef.current % 15 === 0 && enhancedVolume > 0.3) {
      const count = Math.max(2, Math.floor(enhancedVolume * 10));
      spawnParticles(count);
    }
    
    // Set new equalizer bar heights based on different frequency bands
    // For simplicity, we'll use slices of the frequency data for each bar
    const numBars = 5;
    const barValues = [];
    
    for (let i = 0; i < numBars; i++) {
      // Focus on the more important vocal frequency ranges (roughly 200Hz-4000Hz)
      // This makes the visualization respond better to speech
      const startFreq = i === 0 ? 0 : Math.floor(dataArrayRef.current.length * (i * 0.05 + 0.1));
      const endFreq = Math.floor(dataArrayRef.current.length * ((i + 1) * 0.05 + 0.1));
      const startIndex = Math.min(startFreq, dataArrayRef.current.length - 1);
      const endIndex = Math.min(endFreq, dataArrayRef.current.length - 1);
      
      let sum = 0;
      for (let j = startIndex; j < endIndex; j++) {
        sum += dataArrayRef.current[j];
      }
      
      // Normalize to 0.2-0.9 range (minimum 0.2 height, max 0.9)
      // Apply the enhanced volume curve for more responsive bars
      const avgBandValue = sum / (endIndex - startIndex) / 255;
      const barHeight = 0.2 + (0.7 * Math.pow(avgBandValue, 0.7));
      barValues.push(barHeight);
    }
    
    setEqualizerBars(barValues);
    
    // Update wave parameters based on volume
    // More volume = higher amplitude and faster speed
    setWaveAmplitude(5 + (enhancedVolume * 30)); // 5-35 range, more dramatic
    setWaveHeight(10 + (enhancedVolume * 25)); // 10-35 range, higher peaks
    // Slower speed mapping: 0.1-0.4 range for smoother waves
    setWaveSpeed(0.1 + (enhancedVolume * 0.3));
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(updateVisualization);
  };

  // Handle toggle mode
  const toggleListening = () => {
    if (disabled) return;
    
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
      <button disabled className="opacity-50 cursor-not-allowed p-2.5 rounded-full bg-slate-600 text-white h-11 w-11 flex items-center justify-center">
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
        className="opacity-50 cursor-not-allowed p-2.5 rounded-full bg-slate-600 text-white h-11 w-11 flex items-center justify-center"
        title="Microphone access is required"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }

  // Extract language code for display (e.g., "en-US" → "EN")
  const displayLang = language.split('-')[0].toUpperCase();

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Circular button matching other UI elements */}
      <motion.button
        onClick={toggleListening}
        className={`relative shadow-md hover:shadow-lg p-2.5 h-11 w-11 flex items-center justify-center
          ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} 
          dark:${isListening ? 'bg-red-700 hover:bg-red-800' : 'bg-blue-700 hover:bg-blue-800'}
          text-white rounded-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        initial={{ scale: 1 }}
        whileTap={{ scale: 0.95 }}
        title={isListening ? "Stop listening" : "Start voice input"}
        disabled={disabled}
      >
        {/* Wave background when active */}
        {isListening && (
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <Wave
              fill="rgba(255,255,255,0.2)"
              paused={false}
              options={{ height: waveHeight, amplitude: waveAmplitude, speed: waveSpeed, points: 3 }}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Particle Burst Emitter */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute bg-white rounded-full"
              style={{ width: 4, height: 4, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
              animate={{ x: Math.cos(p.angle) * p.speed, y: Math.sin(p.angle) * p.speed, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Content overlay - icon and language when active */}
        <div className="relative z-10 flex items-center justify-center text-white">
          {isListening ? (
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2-11a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1V7z" clipRule="evenodd" />
              </svg>
              {/* Language tag - moved outside the button overflow */}
            </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7 7 0 003 10a1 1 0 012 0 5 5 0 0010 0 1 1 0 112 0 7 7 0 01-7 7.93V17h-2v-2.07z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </motion.button>

      {/* Language indicator - moved outside button for visibility */}
      {isListening && (
        <div className="absolute -top-2 -right-2 bg-white text-red-600 text-[9px] font-bold px-1 rounded-sm shadow-sm z-20 border border-red-200">
          {displayLang}
        </div>
      )}

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
import { useState, useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition as useSpeechRecognitionLib } from 'react-speech-recognition';
import * as speechServices from 'web-speech-cognitive-services';

interface UseSpeechToTextProps {
  onTranscriptChange?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  continuous?: boolean;
  language?: string;
}

const AZURE_REGION = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION || 'eastus';
const AZURE_KEY = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;

// Flag to track if polyfill is initialized
let isPolyfillApplied = false;

const useSpeechToText = ({
  onTranscriptChange,
  onFinalTranscript,
  continuous = false,
  language = 'en-US',
}: UseSpeechToTextProps = {}) => {
  const [error, setError] = useState<string | null>(null);
  const [localIsListening, setLocalIsListening] = useState(false);
  const [finalTranscriptHandled, setFinalTranscriptHandled] = useState(false);
  const [localTranscript, setLocalTranscript] = useState('');
  const [isPolyfillInitialized, setIsPolyfillInitialized] = useState(isPolyfillApplied);

  // Initialize polyfill on client-side mount
  useEffect(() => {
    if (!isPolyfillApplied && typeof window !== 'undefined') {
      try {
        if (AZURE_KEY) {
          console.log("Attempting to initialize Azure Speech polyfill...");
          const { SpeechRecognition: AzureSpeechRecognition } = speechServices.createSpeechServicesPonyfill({
            credentials: {
              region: AZURE_REGION,
              subscriptionKey: AZURE_KEY,
            }
          });
          
          SpeechRecognition.applyPolyfill(AzureSpeechRecognition);
          isPolyfillApplied = true;
          setIsPolyfillInitialized(true);
          console.log("Azure Speech polyfill initialized successfully");
        } else {
          console.warn("Azure Speech key not defined. Will use native Web Speech API if available.");
          isPolyfillApplied = true; // Mark as applied even if using native
          setIsPolyfillInitialized(true);
        }
      } catch (err) {
        console.error("Failed to initialize Azure Speech Services polyfill:", err);
        // Still mark as initialized so we can potentially use native API as fallback
        isPolyfillApplied = true;
        setIsPolyfillInitialized(true);
        setError("Failed to initialize speech services.");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Use the library's hook with interimResults for smoother transcription
  const {
    transcript,
    interimTranscript,
    finalTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognitionLib({
    transcribing: true,
    clearTranscriptOnListen: true,
    commands: []
  });

  // Update transcript when it changes - using both interim and final
  useEffect(() => {
    // For live updates during speaking, use both interim and final
    const currentText = finalTranscript || interimTranscript || transcript;
    if (currentText && currentText.trim() !== '') {
      setLocalTranscript(currentText);
      onTranscriptChange?.(currentText);
    }
  }, [transcript, interimTranscript, finalTranscript, onTranscriptChange]);

  // Handle final transcript when it's available
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim() !== '' && !finalTranscriptHandled && !listening) {
      if (onFinalTranscript) {
        onFinalTranscript(finalTranscript);
      }
      setFinalTranscriptHandled(true);
    }
  }, [finalTranscript, finalTranscriptHandled, listening, onFinalTranscript]);

  // Reset the finalTranscriptHandled flag when listening changes
  useEffect(() => {
    if (listening) {
      setFinalTranscriptHandled(false);
    }
  }, [listening]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isPolyfillInitialized) {
      setError("Speech recognition not yet initialized");
      return;
    }

    if (!browserSupportsSpeechRecognition) {
      setError("Your browser doesn't support speech recognition");
      return;
    }

    if (!isMicrophoneAvailable) {
      setError("Microphone access is required");
      return;
    }

    try {
      resetTranscript(); // Clear previous transcript when starting
      setLocalTranscript('');
      setError(null);
      SpeechRecognition.startListening({
        continuous: continuous,
        language: language,
        interimResults: true, // Enable interim results for more responsive UI
      });
      setLocalIsListening(true);
    } catch (err) {
      console.error("Failed to start listening:", err);
      setError("Failed to start speech recognition");
    }
  }, [isPolyfillInitialized, browserSupportsSpeechRecognition, isMicrophoneAvailable, continuous, language, resetTranscript]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!isPolyfillInitialized) return; // Don't try to stop if not initialized
    try {
      SpeechRecognition.stopListening();
      setLocalIsListening(false);
      
      // Call the onFinalTranscript callback with the final transcript
      const currentText = finalTranscript || transcript;
      if (currentText && currentText.trim() !== '' && onFinalTranscript && !finalTranscriptHandled) {
        onFinalTranscript(currentText);
        setFinalTranscriptHandled(true);
      }
    } catch (err) {
      console.error("Failed to stop listening:", err);
      setError("Failed to stop speech recognition");
    }
  }, [isPolyfillInitialized, transcript, finalTranscript, onFinalTranscript, finalTranscriptHandled]);

  // Clear the transcript
  const clearTranscript = useCallback(() => {
    if (!isPolyfillInitialized) return;
    resetTranscript();
    setLocalTranscript('');
    setFinalTranscriptHandled(false);
  }, [isPolyfillInitialized, resetTranscript]);

  // Sync listening state
  useEffect(() => {
    setLocalIsListening(listening);
  }, [listening]);

  // Return the local transcript for better control
  return {
    isListening: localIsListening,
    transcript: localTranscript,
    startListening,
    stopListening,
    clearTranscript,
    error,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    isPolyfillLoaded: isPolyfillInitialized // Expose the initialization state
  };
};

export default useSpeechToText; 
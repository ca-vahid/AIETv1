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

// Set up the polyfill once when the module loads
let isPolyfillInitialized = false;
try {
  if (AZURE_KEY) {
    const { SpeechRecognition: AzureSpeechRecognition } = speechServices.createSpeechServicesPonyfill({
      credentials: {
        region: AZURE_REGION,
        subscriptionKey: AZURE_KEY,
      }
    });
    
    SpeechRecognition.applyPolyfill(AzureSpeechRecognition);
    isPolyfillInitialized = true;
    console.log("Azure Speech polyfill initialized successfully");
  } else {
    console.warn("Azure Speech key is not defined. Falling back to native Web Speech API.");
    isPolyfillInitialized = true;
  }
} catch (err) {
  console.error("Failed to initialize Azure Speech Services polyfill:", err);
  // Still mark as initialized so we can use native API as fallback
  isPolyfillInitialized = true;
}

const useSpeechToText = ({
  onTranscriptChange,
  onFinalTranscript,
  continuous = false,
  language = 'en-US',
}: UseSpeechToTextProps = {}) => {
  const [error, setError] = useState<string | null>(null);
  const [localIsListening, setLocalIsListening] = useState(false);
  // Track whether we've handled the final transcript
  const [finalTranscriptHandled, setFinalTranscriptHandled] = useState(false);
  // Local copy of transcript for better control
  const [localTranscript, setLocalTranscript] = useState('');

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
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable, continuous, language, resetTranscript]);

  // Stop listening
  const stopListening = useCallback(() => {
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
  }, [transcript, finalTranscript, onFinalTranscript, finalTranscriptHandled]);

  // Clear the transcript
  const clearTranscript = useCallback(() => {
    resetTranscript();
    setLocalTranscript('');
    setFinalTranscriptHandled(false);
  }, [resetTranscript]);

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
    isPolyfillLoaded: isPolyfillInitialized
  };
};

export default useSpeechToText; 
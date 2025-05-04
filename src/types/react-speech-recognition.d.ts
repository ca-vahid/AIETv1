declare module 'react-speech-recognition' {
  export interface SpeechRecognitionOptions {
    transcribing?: boolean;
    clearTranscriptOnListen?: boolean;
    commands?: any[];
  }

  export interface SpeechRecognitionListenOptions {
    continuous?: boolean;
    language?: string;
    interimResults?: boolean;
  }

  export interface SpeechRecognitionResults {
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
    isMicrophoneAvailable: boolean;
  }

  export function useSpeechRecognition(options?: SpeechRecognitionOptions): SpeechRecognitionResults;

  interface SpeechRecognition {
    startListening: (options?: SpeechRecognitionListenOptions) => Promise<void>;
    stopListening: () => Promise<void>;
    abortListening: () => Promise<void>;
    browserSupportsSpeechRecognition: boolean;
    applyPolyfill: (polyfill: any) => void;
  }

  const SpeechRecognition: SpeechRecognition;
  
  export default SpeechRecognition;
} 
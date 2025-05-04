declare module 'web-speech-cognitive-services' {
  interface SpeechServiceCredentials {
    region: string;
    subscriptionKey: string;
  }

  interface SpeechServiceOptions {
    credentials: SpeechServiceCredentials;
  }

  interface SpeechRecognition {
    new(): any;
  }

  interface SpeechServicePonyfill {
    SpeechRecognition: SpeechRecognition;
  }

  function createSpeechServicesPonyfill(options: SpeechServiceOptions): SpeechServicePonyfill;

  export default createSpeechServicesPonyfill;
} 
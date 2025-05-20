'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSessionProfile } from "@/lib/contexts/SessionProfileContext";
import { getIdToken } from "firebase/auth";
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSpring, animated, config } from '@react-spring/web';
import { useEffect as useReactEffect } from 'react'; // Rename to avoid conflict
import AttachmentItem from './AttachmentItem';
import AttachmentPanel from './AttachmentPanel';
import FileUploader from './FileUploader';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import SubmittingModal from './SubmittingModal';

// Dynamic import for VoiceInput
const VoiceInput = dynamic(() => import('./VoiceInput'), {
  ssr: false,
  loading: () => <div className="p-2.5 rounded-full bg-slate-600 opacity-50 h-[40px] w-[40px]" title="Loading voice input..."></div>
});

// Types
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface ChatWindowProps {
  conversationId?: string;
  hideHeader?: boolean;
  currentStep: string;
  onStepChange: (step: string) => void;
}

// Define Attachment interface at the top near other interfaces
interface Attachment {
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
  thumbnailUrl: string | null;
  uploadedAt: number;
}

// Add a helper function to convert markdown-like formatting to HTML
function formatMessageText(text: string): string {
  // Bold text: **text** -> <strong>text</strong>
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic text: *text* -> <em>text</em>
  formattedText = formattedText.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  
  // Inline code: `text` -> <code>text</code>
  formattedText = formattedText.replace(/`(.*?)`/g, '<code class="font-mono px-1.5 py-0.5 text-sm bg-slate-100 text-pink-600 dark:bg-gray-800 dark:text-cyan-400 border border-slate-200 dark:border-gray-700 rounded">$1</code>');
  
  // Lists: - item -> <li>item</li>
  formattedText = formattedText.replace(/^- (.*?)$/gm, '<li>$1</li>');
  
  // Convert line breaks to <br>
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
}

// Add a text streaming component
/**
 * Simulates text streaming/typing animation effect for messages
 */
const StreamingText = ({ content, speed = 15, onComplete }: { content: string, speed?: number, onComplete?: () => void }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    let currentLength = 0;
    const contentLength = content.length;
    
    if (!content) {
      setIsComplete(true);
      onComplete?.();
      return;
    }
    
    // Reset state when content changes
    setDisplayedContent('');
    setIsComplete(false);
    
    // Use a faster reveal for longer messages
    const adjustedSpeed = Math.max(5, speed - Math.floor(content.length / 100));
    
    const intervalId = setInterval(() => {
      if (currentLength < contentLength) {
        currentLength += 3; // Add more chars at once for faster effect
        setDisplayedContent(content.substring(0, currentLength));
      } else {
        clearInterval(intervalId);
        setIsComplete(true);
        onComplete?.();
      }
    }, adjustedSpeed);
    
    return () => clearInterval(intervalId);
  }, [content, speed, onComplete]);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: formatMessageText(displayedContent) }} />
  );
};

/**
 * Animated loading progress bar
 */
const LoadingProgress = () => {
  // Fun facts about AI and AIET
  const funFacts = useMemo(() => [
    "✉️ AI can draft emails & reports in seconds!",
    "⏱️ Automate repetitive tasks & reclaim your time!",
    "🔍 Unlock insights from complex data with AI.",
    "💡 AI: Your assistant for summaries, ideas & more!",
    "🚀 AIET: Supercharge your workflow with AI!",
  ], []);

  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Cycle through fun facts
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % funFacts.length);
    }, 3000); // Change fact every 3 seconds

    return () => clearInterval(intervalId);
  }, [funFacts.length]);
  
  // Main progress animation
  const progressProps = useSpring({
    from: { width: '0%' },
    to: { width: '97%' }, // Stop just short of 100% to indicate waiting
    config: { duration: 8000 },
  });

  // Enhanced pulse effect animation
  const pulseProps = useSpring({
    from: { opacity: 0.6, scale: 1 },
    to: async (next) => {
      while (true) {
        await next({ opacity: 1, scale: 1.05 });
        await next({ opacity: 0.7, scale: 1 });
      }
    },
    config: { tension: 200, friction: 12 },
  });

  // Color shift animation for gradient
  const colorProps = useSpring({
    from: { position: '0%' },
    to: async (next) => {
      while (true) {
        await next({ position: '100%', config: { duration: 2000 } });
        await next({ position: '0%', config: { duration: 2000 } });
      }
    }
  });
  
  // Animated background for the fun facts container
  const bgAnimation = useSpring({
    from: { backgroundPosition: '0% 50%' },
    to: async (next) => {
      while (true) {
        await next({ 
          backgroundPosition: '100% 50%', 
          config: { duration: 8000 }
        });
        await next({ 
          backgroundPosition: '0% 50%', 
          config: { duration: 8000 }
        });
      }
    },
  });
  
  // Border glow animation
  const glowAnimation = useSpring({
    from: { boxShadow: '0 0 5px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)' },
    to: async (next) => {
      while (true) {
        await next({ 
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.5)',
          config: { duration: 1500 }
        });
        await next({ 
          boxShadow: '0 0 5px rgba(59, 130, 246, 0.5), 0 0 15px rgba(59, 130, 246, 0.3)',
          config: { duration: 1500 }
        });
      }
    },
  });

  // Text animation
  const textAnimation = useSpring({
    key: currentFactIndex,
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 280, friction: 18 },
  });

  // Pre-define background style object
  const backgroundStyle = {
    ...bgAnimation,
    ...glowAnimation,
    background: 'linear-gradient(-45deg, #1e40af, #3b82f6, #4f46e5, #7c3aed)',
    backgroundSize: '400% 400%',
  };
  
  // Pre-define gradient function
  const getGradientStyle = colorProps.position.to(pos => ({
    background: `linear-gradient(90deg, 
      rgba(59, 130, 246, 0.9) ${pos}, 
      rgba(124, 58, 237, 0.9) ${pos})`,
    width: '100%',
    height: '100%'
  }));

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] flex flex-col items-center">
      {/* Background track */}
      <div className="h-2 w-full bg-slate-800"></div>
      
      {/* Animated progress bar with pulsing effect - simplified version */}
      <animated.div
        style={{ 
          ...progressProps,
          ...pulseProps, 
        }}
        className="h-2 absolute top-0 left-0 shadow-lg shadow-blue-500/50 bg-gradient-to-r from-blue-500 to-indigo-600"
      />
      
      {/* Fun Fact Rotator Box with enhanced animations */}
      <animated.div 
        style={backgroundStyle}
        className="mt-3 px-5 py-3 rounded-lg text-white font-medium text-center min-h-[4.5em] flex items-center justify-center backdrop-blur-sm relative w-auto min-w-[80%] sm:min-w-[500px] max-w-[90%] border border-blue-400/30"
      >
        {/* Static particles - no hooks in map function */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute rounded-full bg-white/20 animate-float1 w-3 h-3" style={{ top: '20%', left: '30%' }}></div>
          <div className="absolute rounded-full bg-white/20 animate-float2 w-4 h-4" style={{ top: '70%', left: '40%' }}></div>
          <div className="absolute rounded-full bg-white/20 animate-float3 w-2 h-2" style={{ top: '40%', left: '80%' }}></div>
          <div className="absolute rounded-full bg-white/20 animate-float4 w-5 h-5" style={{ top: '50%', left: '15%' }}></div>
          <div className="absolute rounded-full bg-white/20 animate-float5 w-3 h-3" style={{ top: '25%', left: '70%' }}></div>
        </div>
        
        {/* Animated fact text */}
        <div className="relative z-10">
          <animated.div 
            style={textAnimation}
            className="text-base sm:text-lg font-medium"
          >
            {funFacts[currentFactIndex]}
          </animated.div>
        </div>
      </animated.div>
    </div>
  );
};

/**
 * ChatWindow component - Handles the display and interaction with the chat interface
 */
export default function ChatWindow({
  conversationId,
  hideHeader = false,
  currentStep,
  onStepChange,
}: ChatWindowProps) {
  const { profile, firebaseUser } = useSessionProfile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For general message sending, file uploads
  const [isInitialLoading, setIsInitialLoading] = useState(false); // For initial chat load
  const [isFinalizing, setIsFinalizing] = useState(false); // Specific for the complete/extraction step
  const [chatId, setChatId] = useState<string | undefined>(conversationId);
  const [internalChatId, setInternalChatId] = useState<string | undefined>(conversationId); // Internal tracking
  const [extractedProfile, setExtractedProfile] = useState<any>(null); // Store extracted user details
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const baseTextRef = useRef<string>(""); // Ref to store text before listening starts
  const [currentModel, setCurrentModel] = useState<string>("");
  const [useThinkingModel, setUseThinkingModel] = useState<boolean>(false);
  const [titleGenerated, setTitleGenerated] = useState(false);
  const [lastFailedContent, setLastFailedContent] = useState<string | null>(null);
  const [sendError, setSendError] = useState(false);
  const router = useRouter();
  // Key to signal voice input to reset its transcript when a message is sent
  const [voiceResetKey, setVoiceResetKey] = useState(0);
  
  // Streaming text animation state
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingComplete, setStreamingComplete] = useState(false);
  // Conversation language selection
  const [language, setLanguage] = useState<string>('en');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const [showLanguageFeedback, setShowLanguageFeedback] = useState(false);
  const [selectedLanguageName, setSelectedLanguageName] = useState('English');

  // Map two-letter codes to speech recognition locale codes
  const localeMap: Record<string, string> = {
    en: 'en-US', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', sk: 'sk-SK',
    uk: 'uk-UA', zh: 'zh-CN', hi: 'hi-IN', ar: 'ar-SA', bn: 'bn-BD',
    pt: 'pt-PT', ru: 'ru-RU', ja: 'ja-JP', fa: 'fa-IR'
  };
  // Resolve the speech locale to a value accepted by Azure Speech.
  // 1. Check explicit mapping (e.g., "en" -> "en-US").
  // 2. If the value already looks like a BCP-47 tag (contains a dash) use it as-is.
  // 3. Fall back to English.
  const speechLocale = (() => {
    // Direct mapping for common two-letter codes
    if (localeMap[language]) return localeMap[language];

    // If the value is already a valid locale string like "en-US" return it unchanged
    if (language.includes('-')) return language;

    // Handle full language names coming back from the server, e.g. "English", "French"
    const lower = language.toLowerCase();
    const nameMap: Record<string, string> = {
      english: 'en-US',
      french: 'fr-FR',
      spanish: 'es-ES',
      italian: 'it-IT',
      slovak: 'sk-SK',
      ukrainian: 'uk-UA',
      chinese: 'zh-CN',
      hindi: 'hi-IN',
      arabic: 'ar-SA',
      bengali: 'bn-BD',
      portuguese: 'pt-PT',
      russian: 'ru-RU',
      japanese: 'ja-JP',
      persian: 'fa-IR'
    };
    return nameMap[lower] || 'en-US';
  })();

  // Pre-define all animations outside of JSX to avoid "hooks in conditionals" errors
  const languageMenuAnimation = useSpring({
    opacity: languageMenuOpen ? 1 : 0,
    transform: languageMenuOpen 
      ? 'scale(1) translateY(0)' 
      : 'scale(0.9) translateY(5px)',
    config: { tension: 300, friction: 20 },
  });
  
  // Add display property to correctly hide/show element
  const menuDisplayStyle = {
    ...languageMenuAnimation,
    display: languageMenuOpen ? 'block' : 'none',
  };
  
  const arrowAnimation = useSpring({
    opacity: languageMenuOpen ? 1 : 0,
    delay: 150,
    config: { tension: 300, friction: 20 }
  });
  
  // World's top languages plus requested additions
  const languageOptions = [
    { code: 'fa', label: 'فارسی', flag: '🇮🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },  // Ukrainian
    { code: 'zh', label: '中文', flag: '🇨🇳' },        // Mandarin Chinese
    { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },      // Hindi
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },    // Arabic
    { code: 'bn', label: 'বাংলা', flag: '🇧🇩' },      // Bengali
    { code: 'pt', label: 'Português', flag: '🇵🇹' },  // Portuguese
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },    // Russian
    { code: 'ja', label: '日本語', flag: '🇯🇵' }         // Japanese
  ];
  
  const optionAnimations = languageOptions.map((_, index) => 
    useSpring({
      opacity: languageMenuOpen ? 1 : 0,
      transform: languageMenuOpen 
        ? 'translateY(0)' 
        : 'translateY(10px)',
      delay: languageMenuOpen ? index * 50 : 0, // Stagger only when opening
      config: { tension: 300, friction: 20 }
    })
  );

  // Language feedback animation
  const feedbackAnimation = useSpring({
    opacity: showLanguageFeedback ? 1 : 0,
    transform: showLanguageFeedback ? 'translateY(0)' : 'translateY(-20px)',
    config: { tension: 300, friction: 20 },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Pre-define voice input handlers
  const handleListenStart = useCallback(() => {
    baseTextRef.current = input.trim(); // Store current input, trimmed
  }, [input]);

  // Callback when listening stops (optional cleanup)
  const handleListenStop = useCallback(() => {
    baseTextRef.current = ""; // Clear the base text ref
  }, []);

  // Callback to update input from voice
  const handleVoiceInputUpdate = useCallback((newTranscript: string) => {
    // Trim the incoming transcript to avoid leading/trailing spaces causing issues
    const trimmedTranscript = newTranscript.trim();
    
    // If the new transcript part is empty, don't update (prevents clearing on start)
    if (!trimmedTranscript) {
      return; 
    }

    // Construct the full text: base + space (if base exists) + new transcript
    const base = baseTextRef.current;
    const separator = base ? ' ' : ''; // Add space only if there was base text
    const fullText = base + separator + trimmedTranscript;
    
    setInput(fullText);
    
    // Trigger resize check for textarea
    if (inputRef.current) {
      const event = new Event('input', { bubbles: true });
      inputRef.current.value = fullText; 
      inputRef.current.dispatchEvent(event);
      autoResizeTextarea({ target: inputRef.current } as React.ChangeEvent<HTMLTextAreaElement>);
    }
  }, []);

  // Define functions with useCallback before they are used in useEffect
  const startNewChat = useCallback(async () => {
    // Show typing indicator while creating new conversation
    setIsLoading(true);
    // Set initial loading to true during chat start
    setIsInitialLoading(true);
    try {
      if (!profile || !firebaseUser) {
        throw new Error("Not authenticated");
      }
      
      // Get the ID token
      const idToken = await getIdToken(firebaseUser);
      
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: { "Authorization": `Bearer ${idToken}` }
      });

      if (!response.ok) {
        throw new Error("Failed to start chat");
      }

      const data = await response.json();
      // Immediately set detected language from start API
      if (data.language) {
        setLanguage(data.language);
      }
      // Capture extracted profile details but only show greeting to user
      if (data.extracted) {
        setExtractedProfile(data.extracted);
        console.debug("Extracted user details:", data.extracted);
      }
      setChatId(data.conversationId);
      setInternalChatId(data.conversationId); // Update internal state too
      // initial load will be triggered by useEffect on chatId change
    } catch (error) {
      console.error("Error starting chat:", error);
      // Hide loading indicators on failure
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [profile, firebaseUser]);

  /**
   * Loads an existing conversation by ID
   */
  const loadExistingConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      // Set initial loading to true during conversation load
      setIsInitialLoading(true);
      
      if (!firebaseUser) {
        throw new Error("Not authenticated");
      }
      
      // Set the chat ID
      setChatId(id);
      setInternalChatId(id); // Update internal state
      
      // Get the ID token
      const idToken = await getIdToken(firebaseUser);
      
      // Load existing conversation
      const response = await fetch(`/api/chat/load?id=${id}`, {
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to load conversation");
      }

      const data = await response.json();
      
      // Use the server-sent messages directly (allow custom Gemini prompt to show)
      const serverMessages = data.conversation.messages;
      // Convert Firebase messages to our format
      const loadedMessages = serverMessages.map((message: any) => ({
        id: `${message.role}-${message.timestamp}`,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp
      }));
      
      // Set the messages in state
      setMessages(loadedMessages);
      
      // Enable streaming effect for first assistant message if it exists
      if (loadedMessages.length > 0 && loadedMessages[0].role === 'assistant') {
        setStreamingMessageId(loadedMessages[0].id);
        setStreamingComplete(false);
      }
      
      // Set model if a thinking model was used
      if (data.conversation.state.useThinkingModel) {
        setUseThinkingModel(true);
        setCurrentModel("thinking");
      }
      
      console.log("Loaded conversation with", loadedMessages.length, "messages");
      
      onStepChange(data.conversation.state.currentStep);
      
      // Restore language
      setLanguage(data.conversation.state.language || 'en');
      
      // Restore attachments if present
      if (data.conversation.state.collectedData?.attachments) {
        setAttachments(data.conversation.state.collectedData.attachments);
      }
      
      // Check if this is a completed submission
      if (data.conversation.state.isSubmitted && data.conversation.state.submittedRequestId) {
        setIsSubmissionComplete(true);
        setRequestId(data.conversation.state.submittedRequestId);
      }
      
    } catch (error) {
      console.error("Error loading conversation:", error);

      // If the draft no longer exists, attempt to open readonly request
      try {
        if (error instanceof Error && /Failed to load conversation/.test(error.message)) {
          const idToken = firebaseUser ? await getIdToken(firebaseUser) : undefined;
          const res = await fetch(`/api/requests/${id}`, {
            headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
          });
          if (res.ok) {
            router.push(`/requests/${id}?readonly=1`);
            return;
          }
        }
      } catch (_) {}

      // Fallback – start new conversation context
      setMessages([
        {
          id: "error",
          role: "system",
          content: "There was an error loading the previous conversation. Let's start a new one.",
          timestamp: Date.now(),
        },
        {
          id: "welcome",
          role: "assistant",
          content: `Hello${profile ? ` ${profile.name}` : ""}! I'm the AIET Intake Assistant. What task would you like help with today?`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [firebaseUser, onStepChange, profile, router]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Prevent duplicate bootstrapping
  const hasStartedConversation = useRef(false);
  const hasLoadedConversation = useRef(false);

  // Start a new chat when profile and firebaseUser are available and no existing conversationId/chatId
  useEffect(() => {
    if (hasStartedConversation.current) return;
    if (conversationId) return;
    if (profile && firebaseUser && !chatId) {
      hasStartedConversation.current = true;
      startNewChat();
    }
  }, [conversationId, chatId, profile, firebaseUser, startNewChat]);

  // Load conversation when conversationId or chatId becomes available
  useEffect(() => {
    if (hasLoadedConversation.current) return;
    const idToLoad = conversationId || chatId;
    if (idToLoad && firebaseUser) {
      hasLoadedConversation.current = true;
      loadExistingConversation(idToLoad);
    }
  }, [conversationId, chatId, firebaseUser, loadExistingConversation]);

  // Effect to update internalChatId when conversationId prop changes
  useEffect(() => {
    setInternalChatId(conversationId);
  }, [conversationId]);

  // Define steps and progress calculation
  const steps = ['init', 'description', 'details', 'attachments', 'summary', 'submit'] as const;
  type StepKey = typeof steps[number];
  const labels: Record<StepKey, string> = {
    init: 'Welcome',
    description: 'Description',
    details: 'Details',
    attachments: 'Attachments',
    summary: 'Summary',
    submit: 'Submit',
  };
  const stepKey = (steps.includes(currentStep as StepKey) ? currentStep : 'init') as StepKey;
  const currentIndex = steps.indexOf(stepKey);
  const progressPercent = (currentIndex >= 0 ? (currentIndex / (steps.length - 1)) * 100 : 0);

  // Remove filtering: display all messages by default
  const visibleMessages = messages;

  const toggleModel = useCallback(() => {
    setUseThinkingModel((prev) => !prev);
    // Use window global function if available
    if (typeof window !== 'undefined' && (window as any).chatWindowToggleModel) {
      (window as any).chatWindowToggleModel();
    }
  }, []);

  // Adjust textarea height based on content
  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto"; // Reset height
    // Set height based on scroll height, capped at 300px (increased from 150px)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`; 
  };

  // Add a state for tracking if submission is complete
  const [isSubmissionComplete, setIsSubmissionComplete] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  // Live logs coming from /api/chat/complete/stream
  const [submissionLogs, setSubmissionLogs] = useState('');
  // Flag to prevent multiple streaming submissions
  const [hasStartedSubmission, setHasStartedSubmission] = useState(false);

  // Handle completion of chat draft into final request
  const handleCompleteChat = useCallback(async () => {
    if (!firebaseUser || !internalChatId || hasStartedSubmission) return; // Prevent re-entry
    setHasStartedSubmission(true);

    console.log("[ChatWindow] handleCompleteChat: Starting streaming submission");
    setIsFinalizing(true);
    setSubmissionLogs('');

    try {
      setIsLoading(true);

      // Add a system message indicating we're submitting
      setMessages(prev => [
        ...prev,
        {
          id: `submitting-${Date.now()}`,
          role: 'system',
          content: `Submitting your request...`,
          timestamp: Date.now(),
        }
      ]);

      // Small delay to ensure the UI updates before we start the fetch
      await new Promise(resolve => setTimeout(resolve, 200));

      const idToken = await getIdToken(firebaseUser);
      const response = await fetch('/api/chat/complete/stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId: internalChatId })
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to submit request');
      }

      // Stream response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let reqId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        console.log("[ChatWindow] Received chunk:", chunkText); // Debug log

        // Capture requestId sentinel
        if (chunkText.includes('REQUEST_ID:')) {
          const match = chunkText.match(/REQUEST_ID:(\S+)/);
          if (match) {
            reqId = match[1];
            setRequestId(reqId);
          }
        }

        setSubmissionLogs(prev => prev + chunkText);
      }

      // Mark submission complete if we got an ID
      if (reqId) {
        // Wait a bit to ensure user sees the completion message
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsSubmissionComplete(true);

        // Attempt to mark conversation as submitted in Firestore (best-effort)
        try {
          const conversationsRef = collection(db, 'conversations');
          await updateDoc(doc(conversationsRef, internalChatId), {
            'state.isSubmitted': true,
            'state.submittedRequestId': reqId,
            updatedAt: Date.now()
          });
        } catch (updateErr) {
          console.error('Failed to flag conversation as submitted:', updateErr);
        }
      }

    } catch (error) {
      console.error('Error completing chat:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `error-complete-${Date.now()}`,
          role: 'system',
          content: 'There was an error submitting your request. Please try again.',
          timestamp: Date.now(),
        }
      ]);
    } finally {
      // Delay clearing isLoading state to ensure UI remains consistent
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      
      // Don't immediately hide the modal - let SubmittingModal's internal timer handle it
      // setIsFinalizing(false); - removed to ensure modal stays visible
      setTimeout(() => {
        setIsFinalizing(false);
      }, 3000);
    }
  }, [firebaseUser, internalChatId, hasStartedSubmission]);

  // Create a function to handle starting a new submission
  const handleStartNewSubmission = useCallback(() => {
    // Reset input text and textarea height
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
    // Reset states
    setMessages([]);
    setIsSubmissionComplete(false);
    setRequestId(null);
    setChatId(undefined);
    setInternalChatId(undefined);
    setTitleGenerated(false);
    setAttachments([]);
    setHasStartedSubmission(false);
    
    // Start a new chat
    hasStartedConversation.current = false;
    hasLoadedConversation.current = false;
    startNewChat();
  }, [startNewChat]);

  // Generate title function updated
  const generateTitle = async (context: string, isDetailed: boolean) => {
    if (!firebaseUser || !internalChatId) return;
    
    try {
      const idToken = await getIdToken(firebaseUser);
      
      // We're ignoring the context parameter since the API will use full conversation history
      const response = await fetch('/api/chat/generate-title', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          conversationId: internalChatId,
          isDetailed: isDetailed
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate title');
      const data = await response.json();
      
      // Add/Update the title announcement
      const titleMessageId = `title-${isDetailed ? 'detailed' : 'initial'}-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: titleMessageId,
          role: 'assistant',
          content: `**${isDetailed ? 'Updated Title' : 'Title Created'}:** ${data.title}`,
          timestamp: Date.now(),
        }
      ]);
      
    } catch (error) {
      console.error('Error generating title:', error);
      // Silently fail for now, but mark as generated to prevent retries
      if (isDetailed) setTitleGenerated(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // autoResizeTextarea is called in the textarea's onChange directly now
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    const content = input.trim();

    console.log(`[ChatWindow] handleSendMessage entered. isFinalizing: ${isFinalizing}, isLoading: ${isLoading}`); // Debug log

    // Prevent sending new messages if finalization is in progress.
    if (isFinalizing) {
      console.log("[ChatWindow] handleSendMessage: Aborting, finalization in progress.");
      return;
    }

    if (!content || !internalChatId) return;

    // Add user message to the UI
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    // Store previous step *before* the message is sent and state potentially changes
    const previousStep = currentStep; 

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    // Signal voice input to clear transcript after sending
    setVoiceResetKey((k) => k + 1);
    
    // Stop microphone if it's active
    if (handleListenStop) {
      handleListenStop();
    }

    try {
      if (!firebaseUser) {
        throw new Error("Not authenticated");
      }
      
      // Get the ID token
      const idToken = await getIdToken(firebaseUser);
      
      // Get streaming response
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          conversationId: internalChatId, 
          message: userMessage.content,
          useThinkingModel: useThinkingModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Update current step from response header
      const newState = response.headers.get('X-Conversation-State');
      let newStep = currentStep;
      if (newState) {
        newStep = newState;
        onStepChange(newState);
        if (newStep === 'submit') {
          // Immediately start submission to show progress modal
          console.log("[ChatWindow] submit step detected, launching submission early");
          handleCompleteChat();
          return;
        }
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      // Check for model info in headers
      const modelUsed = response.headers.get("X-Model-Used");
      if (modelUsed) {
        setCurrentModel(modelUsed);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      // Add empty assistant message that will be filled with streamed content
      const botMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        },
      ]);

      // Read the stream directly as plain text
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk as plain text (not event stream format)
        const chunkText = decoder.decode(value, { stream: true });
        assistantMessage += chunkText;

        // Update the assistant's message with streamed content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, content: assistantMessage }
              : msg
          )
        );
      }

      // Single title-generation after description step
      if (newStep === 'details' && !titleGenerated) {
        console.log("[ChatWindow] Generating title based on description step");
        await generateTitle(userMessage.content, false);
        setTitleGenerated(true);
      }

      // Auto-submit once we reach the submit step
      if (newStep === 'submit') {
        console.log("[ChatWindow] Auto-submitting on submit step");
        // Trigger submission asynchronously so UI can update immediately
        handleCompleteChat();
      }

      // Detect backend streaming error sentinel
      if (/Error processing stream/i.test(assistantMessage)) {
        throw new Error('STREAM_ERROR');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setLastFailedContent(content);
      setSendError(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "system",
          content: "Sorry, there was an error processing your request. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to retry sending the last failed message
  const handleRetry = () => {
    if (!lastFailedContent) return;
    setInput(lastFailedContent);
    setSendError(false);
    handleSendMessage();
  };

  // Send a system instruction to the chatbot to switch language
  const sendLanguageInstruction = useCallback(async (langCode: string) => {
    if (!firebaseUser || !internalChatId) return;
    const instruction = `Please respond in ${langCode} from now on.`;
    // Insert system message locally
    const sysId = `system-${Date.now()}`;
    setMessages(prev => [...prev, { id: sysId, role: 'system', content: instruction, timestamp: Date.now() }]);
    const idToken = await getIdToken(firebaseUser);
    const res = await fetch('/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ conversationId: internalChatId, message: instruction, useThinkingModel })
    });
    if (!res.ok) return;
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let content = '';
    const botId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, { id: botId, role: 'assistant', content: '', timestamp: Date.now() }]);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      content += decoder.decode(value, { stream: true });
      setMessages(prev => prev.map(m => m.id === botId ? { ...m, content } : m));
    }
  }, [firebaseUser, internalChatId, useThinkingModel]);

  // Handle language change via API
  const handleLanguageChange = useCallback(async (newLang: string) => {
    setLanguage(newLang);
    setLanguageMenuOpen(false);
    
    // Set language name for feedback
    const selectedOption = languageOptions.find(option => option.code === newLang);
    if (selectedOption) {
      setSelectedLanguageName(selectedOption.label);
    }
    
    // Show feedback notification
    setShowLanguageFeedback(true);
    setTimeout(() => setShowLanguageFeedback(false), 3000); // Hide after 3 seconds
    
    if (!internalChatId || !firebaseUser) return;
    const idToken = await getIdToken(firebaseUser);
    await fetch('/api/chat/language', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ conversationId: internalChatId, language: newLang })
    });
    // After persisting, instruct chatbot to switch language
    await sendLanguageInstruction(newLang);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalChatId, firebaseUser, sendLanguageInstruction]);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLanguageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Add a state for storing attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!firebaseUser || !internalChatId) return;
    
    try {
      setIsLoading(true);
      
      // Get ID token for authentication
      const idToken = await getIdToken(firebaseUser);
      
      // Create form data with the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', internalChatId);
      
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const attachment = await response.json();
      
      // Add the attachment to state
      setAttachments(prev => [...prev, attachment]);
      
      // Add a message to the chat indicating the file was uploaded
      const userMessage: Message = {
        id: `user-upload-${Date.now()}`,
        role: 'user',
        content: `I've attached a file: ${attachment.name}`,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Auto-send a bot response about the file
      const botMessageId = `assistant-upload-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: botMessageId,
          role: 'assistant',
          content: `Thanks for sharing ${attachment.name}. I'll include this with your submission.`,
          timestamp: Date.now()
        }
      ]);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `error-upload-${Date.now()}`,
          role: 'system',
          content: 'Sorry, there was an error uploading your file. Please try again.',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser, internalChatId]);

  // Handle manually transitioning to the next step from attachments
  const handleContinueFromAttachments = useCallback(async () => {
    if (!internalChatId || !firebaseUser) return;
    // Immediately hide attachments panel by transitioning to summary
    onStepChange('summary');

    try {
      setIsLoading(true);
      
      // Get the ID token
      const idToken = await getIdToken(firebaseUser);
      
      // Send a special command to advance to summary
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
        body: JSON.stringify({
          conversationId: internalChatId,
          message: "continue_to_summary",
          useThinkingModel: useThinkingModel,
          isCommand: true
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to continue to summary");
      }
      
      // Update current step from response header
      const newState = response.headers.get('X-Conversation-State');
      if (newState) {
        onStepChange(newState);
      }
      
      // Check if response body exists
      if (!response.body) {
        throw new Error("Response body is null");
      }
      
      // Add empty assistant message that will be filled with streamed content
      const botMessageId = `assistant-continue-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: botMessageId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        },
      ]);
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      
      // Read the stream directly as plain text
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk as plain text
        const chunkText = decoder.decode(value, { stream: true });
        assistantMessage += chunkText;
        
        // Update the assistant's message with streamed content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessageId
              ? { ...msg, content: assistantMessage }
              : msg
          )
        );
      }
      
    } catch (error) {
      console.error("Error continuing to summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUser, internalChatId, onStepChange, useThinkingModel]);

  // Handle paste in the chat input area
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Handle images
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        e.preventDefault(); // Prevent the default paste
        const file = item.getAsFile();
        if (file) {
          handleFileUpload(file);
        }
        break;
      }
    }
  }, [handleFileUpload]);

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 h-full rounded-xl shadow-xl overflow-hidden border border-blue-100 dark:border-gray-700">
      {/* Loading progress bar - only show during INITIAL loading phase */}
      {isInitialLoading && <LoadingProgress />}

      {/* Submission modal with live progress */}
      <SubmittingModal show={isFinalizing} logs={submissionLogs} />

      {/* Language feedback notification */}
      <animated.div 
        style={feedbackAnimation} 
        className="fixed top-4 right-4 z-50 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-800 dark:to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 dark:border dark:border-blue-600"
      >
        <span role="img" aria-label="Language" className="text-xl">
          {languageOptions.find(opt => opt.code === language)?.flag || '🌐'}
        </span>
        <div>
          <div className="text-sm font-medium">Language Changed</div>
          <div className="text-xs opacity-90">{selectedLanguageName}</div>
        </div>
      </animated.div>

      {/* Progress Bar Indicator */}
      <div className="px-6 py-2 bg-slate-100 dark:bg-gray-800 flex items-center space-x-4">
        <div className="flex-1">
          <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
            <div className="h-1 bg-blue-600 dark:bg-indigo-500 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Step {currentIndex + 1} of {steps.length}: {labels[stepKey]}
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-hidden bg-white/5 dark:bg-gray-950/10 backdrop-blur-sm rounded-lg border border-blue-200/30 dark:border-gray-700/30 shadow-inner">
        <div className="flex-1 overflow-y-auto pt-6 pb-6 pr-4 pl-6 space-y-6 bg-blue-50/90 dark:bg-gray-900/90 h-full
          scrollbar-thin 
          scrollbar-thumb-blue-500 dark:scrollbar-thumb-blue-700
          scrollbar-track-blue-100 dark:scrollbar-track-gray-800
          scrollbar-thumb-rounded-full 
          scrollbar-track-rounded-full">
          {visibleMessages.map((message, index) => (
            <div key={message.id} className="flex items-end">
              <div className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role !== "user" && (
                  <div className="flex-shrink-0 mr-2 mb-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-md bg-transparent">
                      <img 
                        src="/images/bot-avatar.png" 
                        alt="AI Assistant" 
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                  </div>
                )}
          
                {/* Message content */}
                <div className="group relative max-w-[80%]">
                  <div 
                    className={`px-4 py-3 rounded-2xl ${
                      message.role === "user" 
                        ? "bg-blue-600 text-white dark:bg-blue-700 dark:text-white shadow-md dark:border dark:border-blue-600" 
                        : message.role === "system"
                        ? "bg-amber-600 border border-amber-700 dark:bg-amber-800 dark:border-amber-700 text-white shadow-md"
                        : "bg-white dark:bg-gray-800 shadow-md border border-blue-200 dark:border-gray-700 text-slate-800 dark:text-gray-100"
                    }`}
                  >
                    <div 
                      className={`${message.role === 'user' ? 'whitespace-pre-wrap' : 'whitespace-normal'} text-fluid-base leading-relaxed`}
                    >
                      {message.role === 'user' ? (
                        <div>{message.content}</div>
                      ) : streamingMessageId === message.id && !streamingComplete ? (
                        <StreamingText 
                          content={message.content}
                          speed={10}
                          onComplete={() => setStreamingComplete(true)}
                        />
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: formatMessageText(message.content) }} />
                      )}
                    </div>
                  </div>
                  
                  {/* Time stamp - appears on hover */}
                  <div 
                    className={`absolute bottom-0 ${message.role === "user" ? "right-0 translate-y-5" : "left-0 translate-y-5"} 
                      opacity-0 group-hover:opacity-100 text-fluid-xs text-slate-400 dark:text-gray-300 transition-opacity duration-200 pointer-events-none`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {/* Attachments below user messages */}
                  {message.role === 'user' && attachments.some(a => 
                    a.uploadedAt > (messages[index-1]?.timestamp || 0) && 
                    a.uploadedAt < (messages[index+1]?.timestamp || Date.now() + 1000)
                  ) && (
                    <div className="mt-2 space-y-2">
                      {attachments
                        .filter(a => 
                          a.uploadedAt > (messages[index-1]?.timestamp || 0) && 
                          a.uploadedAt < (messages[index+1]?.timestamp || Date.now() + 1000)
                        )
                        .map(attachment => (
                          <AttachmentItem 
                            key={attachment.path}
                            attachment={attachment}
                            inChat={true}
                          />
                        ))
                      }
                    </div>
                  )}
                </div>
          
                {message.role === "user" && (
                  <div className="flex-shrink-0 ml-2 mb-1">
                    {profile?.photoUrl ? (
                      <img 
                        src={profile.photoUrl} 
                        alt={profile.name || "User"}
                        className="w-8 h-8 rounded-full border border-slate-600 dark:border-slate-300 shadow-md object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-900 dark:bg-blue-700 flex items-center justify-center shadow-md">
                        <span className="text-sm font-semibold text-blue-300">
                          {profile?.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area - updated with better styling for textarea */}
      {isSubmissionComplete ? (
        <div className="border-t border-blue-100 dark:border-gray-700 p-4 bg-blue-50/90 dark:bg-gray-900/90 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700 p-4 shadow-md">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Submission Complete
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your idea has been successfully submitted to the AI Efficiency Team. What would you like to do next?
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`/requests/${requestId}`}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors duration-200 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                View Submitted Idea
              </a>
              
              <button
                onClick={handleStartNewSubmission}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm transition-colors duration-200 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Start New Submission
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-blue-100 dark:border-gray-700 p-4 bg-blue-50/90 dark:bg-gray-900/90 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="flex-1 border rounded-lg border-blue-200 dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <textarea
                ref={inputRef}
                className="w-full px-4 py-3 focus:outline-none bg-transparent resize-none text-fluid-base text-slate-800 dark:text-gray-100 
                  scrollbar-thin 
                  scrollbar-thumb-blue-500 dark:scrollbar-thumb-blue-700
                  scrollbar-track-transparent
                  scrollbar-thumb-rounded-full"
                placeholder={isFinalizing ? "Request is being submitted..." : "Type your message or use the mic..."}
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  handleInputChange(e); 
                  autoResizeTextarea(e);
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                rows={1}
                style={{ minHeight: "42px", maxHeight: "300px" }}
                disabled={isFinalizing || isLoading}
              />
            </div>
            
            {/* Add file upload button */}
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleFileUpload(file);
                }
                // Reset input
                e.target.value = '';
              }}
              disabled={isFinalizing || isLoading}
            />
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              className={`p-2.5 rounded-full bg-green-600 hover:bg-green-700 dark:bg-green-700 hover:dark:bg-green-800 text-white h-11 w-11 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all ${
                isFinalizing || isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Attach a file"
              disabled={isFinalizing || isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>
            
            {/* Language Selector Button */}
            <div className="relative" ref={langMenuRef}>
              <button 
                type="button"
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className={`p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 hover:dark:bg-indigo-800 text-white h-11 w-11 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all ${
                  isFinalizing || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                title="Change language"
                disabled={isFinalizing || isLoading}
              >
                {/* Globe Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </button>
              
              {/* Language Menu Popover - this already has good dark mode support */}
              <animated.div
                style={menuDisplayStyle as any}
                className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-blue-200 dark:border-gray-700 p-0.5 min-w-max z-10 text-sm"
              >
                <div className="p-0.5 space-y-0.5">
                  {languageOptions.map((option, index) => (
                    <animated.button
                      key={option.code}
                      style={optionAnimations[index]}
                      onClick={() => handleLanguageChange(option.code)}
                      className={`flex items-center w-full px-3 py-1.5 text-left rounded-md transition-all font-medium text-xs ${
                        language === option.code 
                          ? 'bg-indigo-600 text-white shadow-inner dark:bg-indigo-700' 
                          : 'text-gray-800 hover:bg-blue-50 dark:text-white dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className="mr-1.5 text-sm">{option.flag}</span>
                      <span className="ml-0.5">{option.label}</span>
                      {language === option.code && (
                        <svg className="ml-auto h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </animated.button>
                  ))}
                </div>
                {/* Arrow pointer */}
                <animated.div 
                  style={arrowAnimation}
                  className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-1.5 h-1.5 bg-white dark:bg-gray-900 border-r border-b border-blue-200 dark:border-gray-700"
                ></animated.div>
              </animated.div>
            </div>
            
            {/* Voice Input Button */}
            <VoiceInput 
              onTranscriptUpdate={handleVoiceInputUpdate}
              onListenStart={handleListenStart}
              onListenStop={handleListenStop}
              resetKey={voiceResetKey}
              language={speechLocale}
              className={`flex-shrink-0 ${isFinalizing || isLoading ? 'opacity-50' : ''}`}
              disabled={isFinalizing || isLoading}
            />
            
            <button
              className={`bg-blue-600 text-white rounded-full p-2.5 h-11 w-11 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-all ${
                !input.trim() || !chatId || isFinalizing || isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={!input.trim() || !chatId || isFinalizing || isLoading}
              onClick={handleSendMessage}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          
          {/* Model Selection toggle - only show if model is already set */}
          {(currentModel || useThinkingModel) && (
            <div className="flex items-center justify-end mt-2 text-xs text-slate-500 dark:text-gray-400">
              <span className="mr-2">Using:</span>
              <button
                onClick={() => setUseThinkingModel(!useThinkingModel)}
                className={`px-2 py-1 rounded-md ${
                  useThinkingModel 
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300" 
                    : "bg-blue-50 text-blue-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {useThinkingModel ? "Thinking Mode" : "Standard Mode"}
              </button>
            </div>
          )}
          {sendError && (
            <div className="mt-2 flex justify-center">
              <button onClick={handleRetry} className="text-blue-600 hover:underline">
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add attachment panel in the attachments step */}
      {currentStep === 'attachments' && (
        <div className="px-4 py-4">
          <AttachmentPanel
            conversationId={internalChatId || ''}
            attachments={attachments}
            onAttachmentAdded={(attachment) => setAttachments(prev => [...prev, attachment])}
            onAttachmentRemoved={(path) => setAttachments(prev => prev.filter(a => a.path !== path))}
            onContinue={handleContinueFromAttachments}
          />
        </div>
      )}
    </div>
  );
} 
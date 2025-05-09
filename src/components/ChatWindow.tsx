'use client';

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSessionProfile } from "@/lib/contexts/SessionProfileContext";
import { getIdToken } from "firebase/auth";
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSpring, animated, config } from '@react-spring/web';

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

// Add a helper function to convert markdown-like formatting to HTML
function formatMessageText(text: string): string {
  // Bold text: **text** -> <strong>text</strong>
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic text: *text* -> <em>text</em>
  formattedText = formattedText.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  
  // Code: `text` -> <code>text</code>
  formattedText = formattedText.replace(/`(.*?)`/g, '<code class="bg-gray-100 rounded px-1 text-sm text-pink-500">$1</code>');
  
  // Lists: - item -> <li>item</li>
  formattedText = formattedText.replace(/^- (.*?)$/gm, '<li>$1</li>');
  
  // Convert line breaks to <br>
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
}

// Helper to decide if the assistant's text offers submit vs go deeper
function shouldShowDecisionPrompt(text: string): boolean {
  const submitRegex = /\b(submit now)\b/i;
  const detailsRegex = /\b(provide more details|more details)\b/i; // Match variations

  return submitRegex.test(text) && detailsRegex.test(text);
}

// Typing indicator component with more pronounced animation
const TypingIndicator = () => {
  // First dot animation - continuous wave pattern
  const firstDot = useSpring({
    from: { 
      transform: 'translateY(0px) scale(0.8)',
      backgroundColor: 'rgba(96, 165, 250, 0.6)' 
    },
    to: async (next) => {
      // Create an infinite loop of animation
      while (true) {
        // Move up and grow with color change
        await next({ 
          transform: 'translateY(-12px) scale(1.3)',
          backgroundColor: 'rgba(96, 165, 250, 1)' 
        });
        // Return to starting position
        await next({ 
          transform: 'translateY(0px) scale(0.8)',
          backgroundColor: 'rgba(96, 165, 250, 0.6)' 
        });
      }
    },
    config: { tension: 300, friction: 8 },
  });

  // Second dot animation with delay
  const secondDot = useSpring({
    from: { 
      transform: 'translateY(0px) scale(0.8)',
      backgroundColor: 'rgba(96, 165, 250, 0.6)' 
    },
    to: async (next) => {
      // Delay the start slightly
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Create an infinite loop of animation
      while (true) {
        // Move up and grow with color change
        await next({ 
          transform: 'translateY(-12px) scale(1.3)',
          backgroundColor: 'rgba(96, 165, 250, 1)' 
        });
        // Return to starting position
        await next({ 
          transform: 'translateY(0px) scale(0.8)',
          backgroundColor: 'rgba(96, 165, 250, 0.6)' 
        });
      }
    },
    config: { tension: 300, friction: 8 },
  });

  // Third dot animation with more delay
  const thirdDot = useSpring({
    from: { 
      transform: 'translateY(0px) scale(0.8)',
      backgroundColor: 'rgba(96, 165, 250, 0.6)' 
    },
    to: async (next) => {
      // Delay the start more
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Create an infinite loop of animation
      while (true) {
        // Move up and grow with color change
        await next({ 
          transform: 'translateY(-12px) scale(1.3)',
          backgroundColor: 'rgba(96, 165, 250, 1)' 
        });
        // Return to starting position
        await next({ 
          transform: 'translateY(0px) scale(0.8)',
          backgroundColor: 'rgba(96, 165, 250, 0.6)' 
        });
      }
    },
    config: { tension: 300, friction: 8 },
  });

  return (
    <div className="flex items-center space-x-2">
      <animated.div 
        style={firstDot} 
        className="w-3 h-3 rounded-full"
      />
      <animated.div 
        style={secondDot}
        className="w-3 h-3 rounded-full"
      />
      <animated.div 
        style={thirdDot}
        className="w-3 h-3 rounded-full"
      />
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
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>(conversationId);
  const [internalChatId, setInternalChatId] = useState<string | undefined>(conversationId); // Internal tracking
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const baseTextRef = useRef<string>(""); // Ref to store text before listening starts
  const [currentModel, setCurrentModel] = useState<string>("");
  const [useThinkingModel, setUseThinkingModel] = useState<boolean>(false);
  const [decisionMode, setDecisionMode] = useState(false);
  const [initialTitleGenerated, setInitialTitleGenerated] = useState(false);
  const [detailedTitleGenerated, setDetailedTitleGenerated] = useState(false);
  const [initialDescription, setInitialDescription] = useState<string | null>(null);
  const [detailedContext, setDetailedContext] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  // Key to signal voice input to reset its transcript when a message is sent
  const [voiceResetKey, setVoiceResetKey] = useState(0);

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

  // Bootstrap conversation: start new chat or load existing
  useEffect(() => {
    if (conversationId) {
      loadExistingConversation(conversationId);
    } else if (chatId) {
      loadExistingConversation(chatId);
    } else if (profile) {
      startNewChat();
    }
  }, [conversationId, chatId, profile]);

  // Effect to update internalChatId when conversationId prop changes
  useEffect(() => {
    setInternalChatId(conversationId);
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const startNewChat = async () => {
    try {
      if (!profile || !firebaseUser) {
        throw new Error("Not authenticated");
      }
      
      // Get the ID token
      const idToken = await getIdToken(firebaseUser);
      
      const response = await fetch("/api/chat/start", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to start chat");
      }

      const data = await response.json();
      setChatId(data.conversationId);
      setInternalChatId(data.conversationId); // Update internal state too
      // initial load will be triggered by useEffect on chatId change
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  /**
   * Loads an existing conversation by ID
   */
  const loadExistingConversation = async (id: string) => {
    try {
      setIsLoading(true);
      
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
      
      // Ensure old drafts still show a friendly init greeting
      let serverMessages = data.conversation.messages;
      if (data.conversation.state.currentStep === 'init' && serverMessages.length > 0) {
        const firstName = profile?.name?.split(' ')[0] || 'there';
        const greeting =
          `Hi ${firstName}! Welcome to the AIET Intake Portal. ` +
          `I'm AIET-IntakeBot, here to help you submit tasks for automation. ` +
          `What task would you like to automate today?`;
        serverMessages[0] = { ...serverMessages[0], content: greeting };
      }
      // Convert Firebase messages to our format
      const loadedMessages = serverMessages.map((message: any) => ({
        id: `${message.role}-${message.timestamp}`,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp
      }));
      
      // Set the messages in state
      setMessages(loadedMessages);
      
      // Set model if a thinking model was used
      if (data.conversation.state.useThinkingModel) {
        setUseThinkingModel(true);
        setCurrentModel("thinking");
      }
      
      console.log("Loaded conversation with", loadedMessages.length, "messages");
      
      onStepChange(data.conversation.state.currentStep);
      
      // Restore flags based on saved state (assuming flags are saved - TBD)
      setInitialTitleGenerated(data.conversation.state.initialTitleGenerated || false); 
      setDetailedTitleGenerated(data.conversation.state.detailedTitleGenerated || false);
      
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
    }
  };

  // Callback when listening starts
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
  }, []); // Dependencies: setInput, autoResizeTextarea (if not stable), baseTextRef doesn't need to be dependency

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
    if (!input.trim() || !internalChatId) return;

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

      // --- Title Generation Logic --- 
      // 1. Initial Title: Trigger after moving *to* lite_impact
      if (newStep === 'lite_impact' && previousStep === 'lite_description' && !initialTitleGenerated) {
        console.log("[ChatWindow] Capturing initial description:", userMessage.content);
        setInitialDescription(userMessage.content);
        await generateTitle(userMessage.content, false); // false = not detailed
        setInitialTitleGenerated(true);
      }

      // 2. Detailed Title: Trigger after moving *to* attachments (from details)
      //    Using last user message as proxy context for now.
      if ((newStep === 'attachments' || newStep === 'summary') && previousStep === 'details' && !detailedTitleGenerated) {
        console.log("[ChatWindow] Capturing detailed context (proxy):", userMessage.content);
        setDetailedContext(userMessage.content);
        await generateTitle(userMessage.content, true); // true = detailed
        setDetailedTitleGenerated(true);
      }
      // --- End Title Generation --- 

      // After receiving assistant response, generate title if it's the first message
      if (!initialTitleGenerated && !detailedTitleGenerated && initialDescription && detailedContext) {
        await generateTitle(initialDescription, false);
        await generateTitle(detailedContext, true);
      }

      // Check for decision prompt *after* potential state updates and title generation
      if (shouldShowDecisionPrompt(assistantMessage)) {
        setDecisionMode(true);
      }
    } catch (error) {
      console.error("Error sending message:", error);
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

  // Auto-submit quick commands: when decisionMode is on and user types 'submit' or 'deeper', send automatically
  useEffect(() => {
    if (!decisionMode) return;
    
    // Only consider this when user has entered something
    if (!input.trim()) return;
    
    const trimmed = input.trim().toLowerCase();
    if (/(submit|done|finish|send)/i.test(trimmed)) {
      sendQuickCommand('submit');
    } else if (/(deep(er)?|more|details)/i.test(trimmed)) {
      sendQuickCommand('go deeper');
    }
  }, [input, decisionMode]);

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
    // Set height based on scroll height, capped at 150px
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`; 
  };

  // Handle completion of chat draft into final request
  const handleCompleteChat = useCallback(async () => {
    if (!firebaseUser || !internalChatId) return;
    try {
      setIsLoading(true);
      setIsSubmitting(true);
      
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
      
      const idToken = await getIdToken(firebaseUser);
      const response = await fetch('/api/chat/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId: internalChatId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit request');
      }
      
      const data = await response.json();
      
      // Update the system message instead of adding a new one
      setMessages(prev => 
        prev.map(msg => 
          msg.role === 'system' && msg.id.startsWith('submitting-') 
            ? {
                ...msg,
                content: `Your request has been submitted! Request ID: ${data.requestId}`,
                timestamp: Date.now()
              }
            : msg
        )
      );
      
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
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }, [firebaseUser, internalChatId]);

  // Generate title function updated
  const generateTitle = async (context: string, isDetailed: boolean) => {
    if (!firebaseUser || !internalChatId || !context) return;
    
    try {
      const idToken = await getIdToken(firebaseUser);
      const response = await fetch('/api/chat/generate-title', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          conversationId: internalChatId,
          context: context,
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
      if (isDetailed) setDetailedTitleGenerated(true);
      else setInitialTitleGenerated(true);
    }
  };

  // Extend sendQuickCommand to update step on GO_DEEPER and generic flow
  const sendQuickCommand = async (command: string) => {
    if (isLoading || isSubmitting || !internalChatId) return;
    
    if (command === 'submit') {
      setInput('');
      setIsSubmitting(true); // No title generation here
      await handleCompleteChat();
      setDecisionMode(false);
    } else if (command === 'go deeper' || command.toLowerCase().includes('deep')) {
      setDetailedTitleGenerated(false); // Reset detailed flag only
      const previousStep = currentStep; // Track step before command
      
      try {
        if (!firebaseUser) return;
        setIsLoading(true);
        const idToken = await getIdToken(firebaseUser);
        const res = await fetch('/api/chat/message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({ conversationId: internalChatId, command: 'GO_DEEPER', useThinkingModel }),
        });

        const headerStep = res.headers.get('X-Conversation-State');
        let newStep = currentStep;
        if (headerStep) {
          newStep = headerStep;
          onStepChange(headerStep);
        }
        if (!res.ok) throw new Error('Failed command');
        if (!res.body) throw new Error('No body');

        // --- Streaming for Go Deeper --- 
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantMsg = '';
        const botId = `assistant-${Date.now()}`;
        setMessages(prev => [...prev, { id: botId, role:'assistant', content:'', timestamp:Date.now() }]);
        while(true){
          const {done, value} = await reader.read();
          if(done) break;
          assistantMsg += decoder.decode(value, {stream:true});
          setMessages(prev=> prev.map(m=> m.id===botId?{...m,content:assistantMsg}:m));
        }
        // --- End Streaming --- 

      } catch(err){
        console.error(err);
      } finally{
        setIsLoading(false);
        setDecisionMode(false);
      }
    } else {
      setInput(command);
      await handleSendMessage(); // This will handle potential title generation
      setDecisionMode(false);
    }
  };

  return (
    <div className="flex flex-col bg-slate-800/40 backdrop-blur-sm h-full rounded-xl shadow-xl overflow-hidden">
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6 bg-slate-800/30">
        {visibleMessages.map((message) => (
          <div key={message.id} className="flex items-end">
            <div className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role !== "user" && (
                <div className="flex-shrink-0 mr-2 mb-1">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                  </div>
                </div>
              )}
        
              {/* Message content */}
              <div className="group relative max-w-[80%]">
                <div 
                  className={`px-4 py-3 rounded-2xl ${
                    message.role === "user" 
                      ? "bg-blue-600/80 text-white shadow-md" 
                      : message.role === "system"
                      ? "bg-yellow-900/70 border border-yellow-700 text-yellow-100 shadow-md"
                      : "bg-slate-800/60 shadow-md border border-slate-600 text-white"
                  }`}
                >
                  <div 
                    className="whitespace-pre-wrap text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: message.role === 'user' 
                        ? message.content 
                        : formatMessageText(message.content) 
                    }}
                  />
                </div>
                
                {/* Time stamp - appears on hover */}
                <div 
                  className={`absolute bottom-0 ${message.role === "user" ? "right-0 translate-y-5" : "left-0 translate-y-5"} 
                    opacity-0 group-hover:opacity-100 text-xs text-slate-400 transition-opacity duration-200 pointer-events-none`}
                >
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
        
              {message.role === "user" && (
                <div className="flex-shrink-0 ml-2 mb-1">
                  {profile?.photoUrl ? (
                    <img 
                      src={profile.photoUrl} 
                      alt={profile.name || "User"}
                      className="w-8 h-8 rounded-full border border-slate-600 shadow-md object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center shadow-md">
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

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="flex items-end">
              <div className="flex-shrink-0 mr-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                </div>
              </div>
              <div className="max-w-[80%] px-5 py-3 rounded-2xl bg-slate-800/60 shadow-md border border-slate-600">
                {/* Modern Typing Indicator */}
                <TypingIndicator />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Decision Buttons (Submit vs Go Deeper) */}
      {decisionMode && (
        <div className="border-t border-slate-600 bg-slate-700/50 px-6 py-4 flex justify-center gap-4">
          <button
            onClick={() => sendQuickCommand("submit")}
            className={`bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md transition ${
              isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Now'}
          </button>
          <button
            onClick={() => sendQuickCommand("go deeper")}
            className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-md transition ${
              isSubmitting || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSubmitting || isLoading}
          >
            Go Deeper
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-slate-600 p-4 bg-slate-800/50 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex-1 border rounded-full border-slate-600 bg-slate-800/80 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            <textarea
              ref={inputRef}
              className="w-full px-4 py-2.5 focus:outline-none bg-transparent resize-none text-sm text-white"
              placeholder={isSubmitting ? "Request is being submitted..." : "Type your message or use the mic..."}
              value={input}
              onChange={(e) => {
                handleInputChange(e); 
                autoResizeTextarea(e); // Call resize here as well
              }}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ minHeight: "42px", maxHeight: "150px" }} 
              disabled={isSubmitting}
            />
          </div>
          
          {/* Voice Input Button */}
          <VoiceInput 
            onTranscriptUpdate={handleVoiceInputUpdate}
            onListenStart={handleListenStart}
            onListenStop={handleListenStop}
            resetKey={voiceResetKey}
            className="flex-shrink-0"
          />
          
          <button
            className={`bg-blue-600 text-white rounded-full p-2.5 h-11 w-11 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg hover:bg-blue-700 transition-all ${
              !input.trim() || !chatId || isSubmitting || isLoading
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            disabled={!input.trim() || !chatId || isSubmitting || isLoading}
            onClick={handleSendMessage}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 
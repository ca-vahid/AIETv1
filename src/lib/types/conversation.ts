/**
 * Conversation type definitions for the AIET Intake App
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface ConversationState {
  currentStep:
    | 'init'
    | 'description'
    | 'attachments'
    | 'summary'
    | 'submit';
  missingProfileFields: string[];
  collectedData: {
    processDescription?: string;
    painType?: string[];
    painNarrative?: string;
    frequency?: string;
    durationMinutes?: number;
    peopleInvolved?: number;
    tools?: string[];
    roles?: string[];
    /**
     * Summary generated at the chatbot "summary" step. Stored to avoid losing it during final submission.
     */
    processSummary?: string;
    /**
     * Summary text produced at the summary step (chat-stage summary)
     */
    chatSummary?: string;
    impactNarrative?: string;
    impactScore?: number;
    hoursSavedPerWeek?: number;
    attachments?: {
      url: string;
      name: string;
    }[];
  };
  validations: Record<string, boolean>;

  /**
   * ISO language code for conversation (e.g., 'en', 'fr').
   */
  language?: string;
}

export interface DraftConversation {
  id: string;
  userId: string;
  status: 'draft' | 'complete' | 'error';
  messages: Message[];
  state: ConversationState;
  title?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FinalRequest {
  id: string;
  userId: string;
  profileSnapshot: Record<string, any>;
  status: 'new' | 'in_review' | 'pilot' | 'completed' | 'rejected';
  assignedTo?: string;
  title: string;
  request: {
    processDescription: string;
    painType: string[];
    painNarrative: string;
    frequency: string;
    durationMinutes: number;
    peopleInvolved: number;
    tools: string[];
    roles: string[];
    impactScore: number;
    hoursSavedPerWeek: number;
    attachments: {
      url: string;
      name: string;
      type?: string;
      thumbnailUrl?: string;
    }[];
    category?: string;
    painPoints?: string[];
    /**
     * Summary produced by the final AI extraction pass
     */
    processSummary?: string;
    /**
     * Summary shown to the user inside the chat at the summary step.
     */
    chatSummary?: string;
    impactNarrative?: string;
  };
  classification?: {
    complexity: 'low' | 'medium' | 'high';
    tags: string[];
  };
  complexity?: 'low' | 'medium' | 'high';
  commentsCount?: number;
  upVotes?: number;
  attachmentsSummary?: { count: number; firstThumbUrl?: string };
  conversation: Message[];
  comments: {
    userId: string;
    content: string;
    timestamp: number;
  }[];
  /**
   * If true, this request will appear in the public Idea Gallery.  The owner can toggle this later.
   */
  shared?: boolean;
  createdAt: number;
  updatedAt: number;
} 
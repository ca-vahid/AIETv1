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
    | 'lite_description'   // Fast-track Q1 – brief task description
    | 'lite_impact'        // Fast-track Q2 – quick benefit / impact statement
    | 'decision'           // Decision point: submit vs. details
    | 'details'            // Condensed deep info collection
    | 'attachments'
    | 'summary'
    | 'submit'
    // legacy deep flow (no longer auto-driven, but retained for compatibility)
    | 'profile'
    | 'task_description'
    | 'pain'
    | 'frequency'
    | 'tools'
    | 'impact'
    | 'summary_lite'
    | 'full_details'
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
   * Indicates whether the user chose the fast-track path (submitted after the lite steps)
   */
  fastTrack?: boolean;
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
    }[];
  };
  classification?: {
    complexity: 'low' | 'medium' | 'high';
    tags: string[];
  };
  conversation: Message[];
  comments: {
    userId: string;
    content: string;
    timestamp: number;
  }[];
  createdAt: number;
  updatedAt: number;
} 
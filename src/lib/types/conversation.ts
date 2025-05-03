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
  currentStep: 'init' | 'profile' | 'task_description' | 'pain' | 'frequency' | 'tools' | 'impact' | 'attachments' | 'summary' | 'submit';
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
    impactScore?: number;
    hoursSavedPerWeek?: number;
    attachments?: {
      url: string;
      name: string;
    }[];
  };
  validations: Record<string, boolean>;
}

export interface DraftConversation {
  id: string;
  userId: string;
  status: 'draft' | 'complete' | 'error';
  messages: Message[];
  state: ConversationState;
  createdAt: number;
  updatedAt: number;
}

export interface FinalRequest {
  id: string;
  userId: string;
  profileSnapshot: Record<string, any>;
  status: 'new' | 'in_review' | 'pilot' | 'completed' | 'rejected';
  assignedTo?: string;
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
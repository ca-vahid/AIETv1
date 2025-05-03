import { ConversationState, Message } from '../types/conversation';

type StateTransition = {
  type: 'NEXT_STEP' | 'PREVIOUS_STEP' | 'JUMP_TO_STEP';
  payload?: {
    step?: ConversationState['currentStep'];
    data?: any;
  };
};

export function analyzeConversation(
  messages: Message[],
  currentState: ConversationState
): StateTransition | null {
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'assistant') return null;

  const content = lastMessage.content.toLowerCase();

  // Profile completion check
  if (currentState.currentStep === 'init') {
    if (currentState.missingProfileFields.length > 0) {
      return {
        type: 'NEXT_STEP',
        payload: { step: 'profile' }
      };
    } else {
      return {
        type: 'NEXT_STEP',
        payload: { step: 'task_description' }
      };
    }
  }

  // Task description completion
  if (currentState.currentStep === 'task_description' && 
      content.includes('great') && content.includes('tell me more about')) {
    return {
      type: 'NEXT_STEP',
      payload: { step: 'pain' }
    };
  }

  // Pain point completion
  if (currentState.currentStep === 'pain' && 
      content.includes('understand') && content.includes('how often')) {
    return {
      type: 'NEXT_STEP',
      payload: { step: 'frequency' }
    };
  }

  // Frequency completion
  if (currentState.currentStep === 'frequency' && 
      content.includes('what tools') || content.includes('which systems')) {
    return {
      type: 'NEXT_STEP',
      payload: { step: 'tools' }
    };
  }

  // Tools completion
  if (currentState.currentStep === 'tools' && 
      content.includes('impact') || content.includes('rate')) {
    return {
      type: 'NEXT_STEP',
      payload: { step: 'impact' }
    };
  }

  // Impact completion
  if (currentState.currentStep === 'impact' && 
      content.includes('attach') || content.includes('upload')) {
    return {
      type: 'NEXT_STEP',
      payload: { step: 'attachments' }
    };
  }

  // Attachments completion
  if (currentState.currentStep === 'attachments' && 
      content.includes('review') || content.includes('summary')) {
    return {
      type: 'NEXT_STEP',
      payload: { step: 'summary' }
    };
  }

  return null;
}

export function conversationReducer(
  state: ConversationState,
  transition: StateTransition
): ConversationState {
  switch (transition.type) {
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: transition.payload?.step || state.currentStep,
        collectedData: {
          ...state.collectedData,
          ...(transition.payload?.data || {})
        }
      };
    
    case 'PREVIOUS_STEP':
      // Logic for going back a step if needed
      return state;
    
    case 'JUMP_TO_STEP':
      return {
        ...state,
        currentStep: transition.payload?.step || state.currentStep
      };
    
    default:
      return state;
  }
}

export function generatePromptForState(
  state: ConversationState,
  userProfile?: any
): string {
  const basePrompt = 'You are AIET-IntakeBot, a friendly assistant helping BGC employees submit automation requests. ';
  
  switch (state.currentStep) {
    case 'init':
      return `${basePrompt}Introduce yourself and ask if the profile information we have is correct: ${JSON.stringify(userProfile)}`;
    
    case 'profile':
      return `${basePrompt}We need to collect some missing profile information: ${state.missingProfileFields.join(', ')}. Ask for these details politely.`;
    
    case 'task_description':
      return `${basePrompt}Ask the user to describe the task they would like to automate. Be specific about what details you need.`;
    
    case 'pain':
      return `${basePrompt}Ask about the pain points of this task - what makes it difficult, time-consuming, or error-prone?`;
    
    case 'frequency':
      return `${basePrompt}Ask how often this task is performed and approximately how long it takes each time.`;
    
    case 'tools':
      return `${basePrompt}Ask about the tools, systems, and people involved in this task.`;
    
    case 'impact':
      return `${basePrompt}Ask the user to rate the potential impact of automating this task on a scale of 1-5, and estimate hours saved per week.`;
    
    case 'attachments':
      return `${basePrompt}Ask if they would like to attach any relevant files (screenshots, examples, etc.).`;
    
    case 'summary':
      return `${basePrompt}Present a summary of all collected information and ask for confirmation: ${JSON.stringify(state.collectedData)}`;
    
    default:
      return basePrompt;
  }
} 
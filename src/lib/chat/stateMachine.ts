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

  // Fast-track lite flow ----------------------------------------
  if (currentState.currentStep === 'init') {
    // jump straight to lite description (skip profile collection in fast track)
    return {
      type: 'NEXT_STEP',
      payload: { step: 'lite_description' }
    };
  }

  // Lite description answered → lite impact
  if (currentState.currentStep === 'lite_description') {
    if (lastMessage.content.trim().length > 10) {
      return {
        type: 'NEXT_STEP',
        payload: { step: 'lite_impact', data: { processDescription: lastMessage.content } }
      };
    }
  }

  // Lite impact answered → summary_lite
  if (currentState.currentStep === 'lite_impact') {
    if (lastMessage.content.trim().length > 5) {
      return {
        type: 'NEXT_STEP',
        payload: { step: 'summary_lite', data: { impactNarrative: lastMessage.content } }
      };
    }
  }

  // If user types something like "submit" or "done" in summary_lite we fast submit
  if (currentState.currentStep === 'summary_lite') {
    if (/\b(submit|done|finish|send)\b/i.test(lastMessage.content)) {
      return {
        type: 'NEXT_STEP',
        payload: { step: 'submit', data: { fastTrack: true } }
      };
    }
    if (/\b(deep|more|details)\b/i.test(lastMessage.content)) {
      return {
        type: 'NEXT_STEP',
        payload: { step: 'full_details' }
      };
    }
  }

  // Condensed deep details: once 2 of {tools, frequency, impactNarrative} are provided, move to attachments
  if (currentState.currentStep === 'full_details') {
    const d = currentState.collectedData;
    const gotCount = [
      Array.isArray(d.tools) && d.tools.length > 0,
      !!d.frequency,
      !!d.impactNarrative
    ].filter(Boolean).length;
    if (gotCount >= 2) {
      return {
        type: 'NEXT_STEP',
        payload: { step: 'attachments' }
      };
    }
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
    case 'init': {
      // Personalised multilingual greeting & language confirmation
      const firstName = userProfile?.name?.split(' ')[0] || 'there';
      const lang = (userProfile?.preferredLanguage || 'en').toLowerCase();

      const greetings: Record<string, { hello: string; ask: string }> = {
        fr: {
          hello: `Bonjour ${firstName}!`,
          ask: `Je peux continuer en français. Est-ce que cela vous convient ou préférez-vous l'anglais ?`
        },
        es: {
          hello: `¡Hola ${firstName}!`,
          ask: `Puedo continuar en español. ¿Está bien o prefiere inglés?`
        },
        en: {
          hello: `Hi ${firstName}!`,
          ask: `I can continue in English. Would you prefer another language?`
        }
      };

      const key = lang.startsWith('fr') ? 'fr' : lang.startsWith('es') ? 'es' : 'en';
      const g = greetings[key];

      return `${basePrompt}

${g.hello}

${g.ask}

Once the user confirms the language, politely ask them to briefly describe the work/task they think could benefit from AI automation.`;
    }
    
    case 'full_details': {
      // Friendly loop: ask for any two of these three details
      const d = state.collectedData;
      const have: string[] = [];
      if (Array.isArray(d.tools) && d.tools.length > 0) have.push('tools/systems');
      if (d.frequency) have.push('frequency/duration');
      if (d.impactNarrative) have.push('impact');
      const options = ['tools/systems', 'frequency/duration', 'impact'];
      const need = options.filter(opt => !have.includes(opt));
      return `${basePrompt}You've shared: ${have.length ? have.join(', ') : 'none yet'}. ` +
        `I'm still waiting on: ${need.join(', ')}. ` +
        `Pick any two of those and tell me a bit about them—be brief and have fun!`;
    }
    
    case 'attachments':
      return `${basePrompt}Ask if they would like to attach any relevant files (screenshots, examples, etc.).`;
    
    case 'summary':
      return `${basePrompt}Present a summary of all collected information and ask for confirmation: ${JSON.stringify(state.collectedData)}`;
    
    case 'lite_description':
      return `${basePrompt}Ask the user—politely and concisely—to give a brief description (1–2 sentences) of the task/process they believe could benefit from AI optimisation or automation.`;
    
    case 'lite_impact':
      return `${basePrompt}Thank the user for the description and ask them—in the same language—to briefly explain how automating this task would help (time saved, reduced errors, happier staff, etc.).`;
    
    case 'summary_lite': {
      const d = state.collectedData;
      return `${basePrompt}Provide a short bullet-point summary of what the user has shared so far:
+- Task: ${d.processDescription || '[Pending]'}
+- Anticipated benefit: ${(d as any).impactNarrative || '[Pending]'}

Ask the user:
1. *Submit now* – you will say that the AIET team will review.
2. *Go deeper* – you will ask more detailed follow-up questions.

Wait for the user to answer with their choice.`;
    }
    
    default:
      return basePrompt;
  }
} 
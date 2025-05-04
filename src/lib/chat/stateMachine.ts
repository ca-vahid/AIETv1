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

  // Decide based on the *user's* reply when we are in summary_lite
  if (currentState.currentStep === 'summary_lite') {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    if (lastUserMsg && /\b(submit|done|finish|send)\b/i.test(lastUserMsg.content)) {
    return {
      type: 'NEXT_STEP',
        payload: { step: 'submit', data: { fastTrack: true } }
    };
  }
    if (lastUserMsg && /\b(deep(er)?|more|details)\b/i.test(lastUserMsg.content)) {
    return {
      type: 'NEXT_STEP',
        payload: { step: 'full_details' }
      };
    }
  }

  // Condensed deep details: once 2 of {tools, frequency, impactNarrative} are provided, move to attachments
  if (currentState.currentStep === 'full_details') {
    const d = currentState.collectedData;
    
    // Extract data from the conversation to update collectedData
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    
    // Only analyze user messages for data extraction to avoid false positives
    if (lastUserMsg && lastUserMsg.role === 'user') {
      const userContent = lastUserMsg.content;
      const extractedData: Record<string, any> = {};
      
      // Check for tools/systems mentions in user's message
      if (!Array.isArray(d.tools) || d.tools.length === 0) {
        if (/tool|system|software|app|application|platform|PowerApp|email|spreadsheet|excel/i.test(userContent)) {
          extractedData.tools = ['Tools mentioned in conversation'];
          // Try to identify specific tools
          const toolMatches = userContent.match(/\b(Excel|PowerApp|Teams|Outlook|SharePoint|Word|PowerPoint|Access|OneDrive|Forms|Power BI|Power Automate|SQL|Database|API|Jira|ServiceNow|SAP|Oracle)\b/gi);
          if (toolMatches && toolMatches.length > 0) {
            extractedData.tools = Array.from(new Set(toolMatches)); // Remove duplicates using Array.from()
          }
        }
      }
      
      // Check for frequency/duration mentions
      if (!d.frequency) {
        if (/daily|weekly|monthly|times|frequency|often|per day|minutes|hours|everyday|each day|week|month|quarter|year/i.test(userContent)) {
          extractedData.frequency = "Mentioned in conversation";
          // Try to extract specific frequency
          const frequencyMatch = userContent.match(/\b(daily|weekly|monthly|quarterly|yearly|(\d+)\s+times\s+(per|a|each)\s+(day|week|month|year))\b/i);
          if (frequencyMatch) {
            extractedData.frequency = frequencyMatch[0];
          }
        }
      }
      
      // Check for impact mentions
      if (!d.impactNarrative) {
        if (/impact|benefit|save|improve|better|easier|faster|time|automation|efficient|productivity|reduce|error|quality|satisfaction/i.test(userContent)) {
          extractedData.impactNarrative = "Impact mentioned in conversation";
        }
      }
      
      // Update collected data if we found new information
      if (Object.keys(extractedData).length > 0) {
        // Merge the extracted data
        const mergedData = {...d, ...extractedData};
        
        // Count how many of the required fields we have
        const gotCount = [
          Array.isArray(mergedData.tools) && mergedData.tools.length > 0,
          !!mergedData.frequency,
          !!mergedData.impactNarrative
        ].filter(Boolean).length;
        
        // Only transition if we have at least 2 out of 3 required fields AND
        // the bot has asked about attachments or the user mentions attachments
        const botAsksAttachments = /attach|file|screenshot|upload/i.test(lastMessage.content);
        const userMentionsFiles = /attach|file|screenshot|upload|picture|image/i.test(userContent);
        
        if (gotCount >= 2 && (botAsksAttachments || userMentionsFiles)) {
    return {
      type: 'NEXT_STEP',
            payload: { step: 'attachments', data: extractedData }
    };
  }

        // Always update the state with new data regardless of transition
    return {
      type: 'NEXT_STEP',
          payload: { 
            step: 'full_details', // Stay on the same step
            data: extractedData 
          }
        };
      }
    }
  }

  // Attachments completion – advance if assistant prompts for review/summary
  // OR user explicitly says they have no attachments OR attachments are already stored.
  if (currentState.currentStep === 'attachments') {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();

    const hasAssistantCue = content.includes('review') || content.includes('summary');
    const userSaysNo = lastUserMsg && /\b(no|none|skip|dont|don't).*attach/i.test(lastUserMsg.content);
    const uploaded = Array.isArray(currentState.collectedData.attachments) && currentState.collectedData.attachments.length > 0;

    if (hasAssistantCue || userSaysNo || uploaded) {
    return {
      type: 'NEXT_STEP',
      payload: { step: 'summary' }
    };
    }
  }

  // User confirmation in summary step → submit
  if (currentState.currentStep === 'summary') {
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    if (lastUserMsg && /\b(yes|confirm|looks good|submit|done|finish|send)\b/i.test(lastUserMsg.content)) {
      return {
        type: 'NEXT_STEP',
        payload: { step: 'submit' }
      };
    }
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

Once the user confirms the language, politely ask them to briefly describe the work/task they think could benefit from AI optimisation or automation.`;
    }
    
    case 'full_details': {
      // Create a more conversational prompt based on the data we've collected so far
      const d = state.collectedData;
      let missingDataPrompt = '';
      
      // Check what data we're still missing
      const missingFields = [];
      if (!Array.isArray(d.tools) || d.tools.length === 0) missingFields.push('tools or systems');
      if (!d.frequency) missingFields.push('frequency or how often this task is done');
      if (!d.impactNarrative) missingFields.push('expected impact or benefit');
      
      // Create a friendly prompt asking for missing information
      if (missingFields.length > 0) {
        if (missingFields.length === 3) {
          missingDataPrompt = `I'd like to understand more about this task. Could you tell me about the tools or systems you use, how often you do this task, and what impact automating it would have?`;
        } else if (missingFields.length === 2) {
          missingDataPrompt = `Thanks for sharing that information. Could you also tell me about the ${missingFields.join(' and the ')}?`;
        } else if (missingFields.length === 1) {
          missingDataPrompt = `I just need one more piece of information: what about the ${missingFields[0]}?`;
        }
      } else {
        // If we have all the data, guide toward attachments
        missingDataPrompt = `Thanks for all that information! Would you like to attach any screenshots or files to help illustrate the process?`;
      }
      
      return `${basePrompt}${missingDataPrompt} Remember, once I have enough information (at least 2 of: tools, frequency, and impact), I'll ask if you want to attach any files before reviewing.`;
    }
    
    case 'attachments':
      return `${basePrompt}Would you like to attach any relevant files (screenshots, examples, etc.) that could help the automation team better understand your request?`;
    
    case 'summary': {
      // Create a more user-friendly summary format
      const d = state.collectedData;
      const toolsStr = Array.isArray(d.tools) && d.tools.length > 0 ? d.tools.join(', ') : 'Not specified';
      const frequencyStr = d.frequency || 'Not specified';
      const impactStr = d.impactNarrative || 'Not specified';
      
      return `${basePrompt}Here's a summary of your automation request:

Process: ${d.processDescription || 'Not specified'}
Tools/Systems: ${toolsStr}
Frequency: ${frequencyStr}
Expected Impact: ${impactStr}
${Array.isArray(d.attachments) && d.attachments.length > 0 ? `Attachments: ${d.attachments.length} file(s)` : 'No attachments'}

Does this look correct? If yes, please confirm and I'll submit your request. If not, let me know what needs to be changed.`;
    }
    
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
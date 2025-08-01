import { ConversationState, Message } from "@/lib/types/conversation";
import { checkCriterion } from "./logicChecker"; // Import the checker

/**
 * Transition actions for the simplified state-machine.
 */
export type Transition =
  | { type: "NEXT"; step: ConversationState["currentStep"]; data?: any }
  | { type: "UPDATE_DATA"; data: any };

/**
 * Returns a transition based solely on the **latest user message** and the
 * current state. Assistant wording/length is NOT considered anymore.
 */
export async function analyseUserMessage(
  userMessage: Message,
  state: ConversationState,
  messagesHistory: Message[] // Need history for the checker
): Promise<Transition | null> {
  const text = userMessage.content.trim();

  // Helper for colored logs
  const log = (color: string, ...args: any[]) => console.log(color, ...args, '\x1b[0m');

  switch (state.currentStep) {
    case 'init':
      log('\x1b[36m%s\x1b[0m', '[StateMachine] Transitioning: init → description');
      return { type: 'NEXT', step: 'description' };

    case 'description':
      log('\x1b[33m%s\x1b[0m', '[StateMachine] Checking criterion for description → attachments...');
      try {
        const checkResult = await checkCriterion(
          messagesHistory,
          'User provided a description of the task they want to automate, and some details or is indicating that they want to move on to the next step.'
        );
        log('\x1b[35m%s\x1b[0m', '[StateMachine] Criterion check raw response:', checkResult.rawResponse);
        if (checkResult.satisfied) {
          log('\x1b[32m%s\x1b[0m', '[StateMachine] Criterion SATISFIED. Transitioning: description → attachments');
          return { type: 'NEXT', step: 'attachments', data: { processDescription: text } };
        } else {
          log('\x1b[33m%s\x1b[0m', '[StateMachine] Criterion NOT satisfied. Staying in description.');
          return null;
        }
      } catch (error) {
        log('\x1b[31m%s\x1b[0m', '[StateMachine] Error during description check:', error);
        return null;
      }

    case 'attachments': {
      log('\x1b[33m%s\x1b[0m', '[StateMachine] Checking criterion for attachments → summary...');
      try {
        const checkResult = await checkCriterion(
          messagesHistory,
          'User indicated they have attached files or chosen not to attach any.'
        );
        log('\x1b[35m%s\x1b[0m', '[StateMachine] Criterion check raw response:', checkResult.rawResponse);
        if (checkResult.satisfied) {
          log('\x1b[32m%s\x1b[0m', '[StateMachine] Criterion SATISFIED. Transitioning: attachments → summary');
          return { type: 'NEXT', step: 'summary' };
        } else {
          log('\x1b[33m%s\x1b[0m', '[StateMachine] Criterion NOT satisfied. Staying in attachments.');
          return null;
        }
      } catch (error) {
        log('\x1b[31m%s\x1b[0m', '[StateMachine] Error during attachments check:', error);
        return null;
      }
    }

    case "summary": {
      log('\x1b[33m%s\x1b[0m', '[StateMachine] Checking criterion for summary -> submit...');
      try {
        const checkResult = await checkCriterion(
          messagesHistory,
          'User confirmed the summary and is ready to submit'
        );
        log('\x1b[35m%s\x1b[0m', `[StateMachine] Criterion check raw response:`, checkResult.rawResponse);
        if (checkResult.satisfied) {
          log('\x1b[32m%s\x1b[0m', '[StateMachine] Criterion SATISFIED. Transitioning: summary -> submit');
          log('\x1b[33m%s\x1b[0m', '[StateMachine] Preparing to finalize (summary → submit)...');
          log('\x1b[32m%s\x1b[0m', '[StateMachine] Transitioning: summary → submit');
          return { type: "NEXT", step: "submit" };
        } else {
          log('\x1b[33m%s\x1b[0m', '[StateMachine] Criterion NOT satisfied. Staying in summary.');
          return null;
        }
      } catch (error) {
        log('\x1b[31m%s\x1b[0m', '[StateMachine] Error during criterion check for summary:', error);
        return null;
      }
    }

  }
  log('\x1b[31m%s\x1b[0m', `[StateMachine] No transition found for state ${state.currentStep}`);
  return null;
}

/** Reducer that applies a transition to the state. */
export function reducer(state: ConversationState, t: Transition): ConversationState {
  switch (t.type) {
    case "NEXT":
      return {
        ...state,
        currentStep: t.step,
        collectedData: { ...state.collectedData, ...(t.data || {}) },
      };
    case "UPDATE_DATA":
      return {
        ...state,
        collectedData: { ...state.collectedData, ...(t.data || {}) },
      };
    default:
      return state;
  }
}

/**
 * Generates the system prompt (assistant instructions) for the *new* state.
 * For brevity we only cover the fast-track steps. Legacy deep-flow callers
 * should migrate.
 */
export function promptFor(state: ConversationState, userProfile?: any): string {
  // Strip out the photoURL from userProfile if present
  const profileWithoutPhoto = userProfile ? (({ photoURL, ...rest }) => rest)(userProfile) : undefined;
  const profileInfo = profileWithoutPhoto
    ? `You have the following user details already: ${JSON.stringify(profileWithoutPhoto)}. `
    : '';
  // Build the base prompt, including any sanitized user details
  const base = profileInfo +
    'You are AIETv1 , a professional assistant helping BGC employees submit ideas to be looked at by the AI team to see if we can use genAI or new AI systems to help user save time energy or be more efficient. ' +
    'Not only that but maybe user want to do something but they couldnt because it too complicate reuquires programmnign or scripting skills ';

  let prompt = base;
  // Personalize greeting if profile available
  if (state.currentStep === 'init' && userProfile) {
    const firstName = userProfile.name?.split(' ')[0] || 'there';
    prompt = `Hi ${firstName}! ` + prompt;
  }
  
  // Add a clear separator and header for the task-specific instruction
  prompt += '\n\n**Your Current Task:**\n';
  
  switch (state.currentStep) {
    case 'init':
      // This is used if the state machine is ever prompted *in* the init state.
      return prompt + "Welcome! To get started, please briefly describe the task or process you'd like to automate.";

    case 'description':
      return (
        prompt +
        "You have just received the user's initial idea. Your immediate goal is to ask clarifying questions to gather more details. Ask a brief, targeted question to understand more about the process, the tools they use, or the problems they face. Do not repeat their idea back to them. Get straight to the point." +
        "CRITICAL: Do NOT provide solutions, code, or instructions."
      );

    case 'attachments':
      return prompt + 'This is the attachment step. Do not ask the user any more questions about the automation. \n'+
      "Instead, ask if they would like to attach any screenshots or files. Be very brief; use emojis and HTML tags to make it more engaging and concise.";

    case 'summary':
      return prompt + "<HTML with highlights>Summarise everything that has been collected in a summary format as if you were submitting this for processing.\n" +
      "If the language is not English, also provide a translation in English.\n" +
      "Your response should start with Idea Summary: and then the summary of the idea in details. Do not say anything else";

    case 'submit':
      return prompt + 'Thank you for your submission!';

    default:
      return prompt;
  }
} 
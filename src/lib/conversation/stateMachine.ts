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
    case "init":
      log('\x1b[36m%s\x1b[0m', '[StateMachine] Transitioning: init -> lite_description');
      return { type: "NEXT", step: "lite_description" };

    case "lite_description":
      log('\x1b[33m%s\x1b[0m', '[StateMachine] Checking criterion for lite_description -> lite_impact...');
      try {
        const checkResult = await checkCriterion(
          messagesHistory, // Pass the full history
          "User provided a short description of what they are looking to automate using AI"
        );
        log('\x1b[35m%s\x1b[0m', `[StateMachine] Criterion check raw response:`, checkResult.rawResponse);

        if (checkResult.satisfied) {
          log('\x1b[32m%s\x1b[0m', '[StateMachine] Criterion SATISFIED. Transitioning: lite_description -> lite_impact');
          return {
            type: "NEXT",
            step: "lite_impact",
            data: { processDescription: text }, // Store the description
          };
        } else {
          log('\x1b[33m%s\x1b[0m', `[StateMachine] Criterion NOT satisfied. Staying in lite_description. Reasoning: ${checkResult.reasoning}`);
          return null; // Stay in the current state
        }
      } catch (error) {
        log('\x1b[31m%s\x1b[0m', '[StateMachine] Error during criterion check:', error);
        return null; // Stay in current state on error
      }

    case "lite_impact":
      log('\x1b[33m%s\x1b[0m', '[StateMachine] Checking criterion for lite_impact -> decision...');
      try {
        const checkResult = await checkCriterion(
          messagesHistory, // Pass the full history
          "User provided information about the how would automating this help them or their team or the company"
        );
        log('\x1b[35m%s\x1b[0m', `[StateMachine] Criterion check raw response:`, checkResult.rawResponse);

        if (checkResult.satisfied) {
          log('\x1b[32m%s\x1b[0m', '[StateMachine] Criterion SATISFIED. Transitioning: lite_impact -> decision');
          return {
            type: "NEXT",
            step: "decision",
            data: { impactNarrative: text }, // Store the impact narrative
          };
        } else {
          log('\x1b[33m%s\x1b[0m', `[StateMachine] Criterion NOT satisfied. Staying in lite_impact. Reasoning: ${checkResult.reasoning}`);
          return null; // Stay in the current state
        }
      } catch (error) {
        log('\x1b[31m%s\x1b[0m', '[StateMachine] Error during criterion check:', error);
        return null; // Stay in current state on error
      }
      
    case "decision": {
      // Let the client send explicit commands or rely on keyword fallback
      if (/\bsubmit\b/i.test(text)) {
        log('\x1b[36m%s\x1b[0m', '[StateMachine] Transitioning: decision -> submit (fast track)');
        return { type: "NEXT", step: "submit", data: { fastTrack: true } };
      }
      if (/\b(deep|more|details)\b/i.test(text)) {
         log('\x1b[36m%s\x1b[0m', '[StateMachine] Transitioning: decision -> details');
        return { type: "NEXT", step: "details" };
      }
      log('\x1b[33m%s\x1b[0m', '[StateMachine] Staying in decision (no clear user choice).');
      return null;
    }

    case "details": {
      log('\x1b[33m%s\x1b[0m', '[StateMachine] Checking criterion for details -> attachments...');
      try {
        const checkResult = await checkCriterion(
          messagesHistory,
          'Users feels that enough information has been provided and they are ready to move on to the next step'
        );
        log('\x1b[35m%s\x1b[0m', `[StateMachine] Criterion check raw response:`, checkResult.rawResponse);

        if (checkResult.satisfied) {
          log('\x1b[32m%s\x1b[0m', '[StateMachine] Criterion SATISFIED. Transitioning: details -> attachments');
          return { type: "NEXT", step: "attachments" };
        } else {
          log('\x1b[33m%s\x1b[0m', '[StateMachine] Criterion NOT satisfied. Staying in details.');
          return null;
        }
      } catch (error) {
        log('\x1b[31m%s\x1b[0m', '[StateMachine] Error during criterion check for details:', error);
        return null;
      }
    }

    case "attachments": {
      log('\x1b[33m%s\x1b[0m', '[StateMachine] Checking criterion for attachments -> summary...');
      try {
        const checkResult = await checkCriterion(
          messagesHistory,
          "User indicated they have attached files or chosen not to attach any."
        );
        log('\x1b[35m%s\x1b[0m', `[StateMachine] Criterion check raw response:`, checkResult.rawResponse);

        if (checkResult.satisfied) {
          log('\x1b[32m%s\x1b[0m', '[StateMachine] Criterion SATISFIED. Transitioning: attachments -> summary');
          return { type: "NEXT", step: "summary" };
        } else {
          log('\x1b[33m%s\x1b[0m', '[StateMachine] Criterion NOT satisfied. Staying in attachments.');
          return null;
        }
      } catch (error) {
        log('\x1b[31m%s\x1b[0m', '[StateMachine] Error during criterion check for attachments:', error);
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
    'You are AIETv1 , a professional humorous witty assistant helping BGC employees submit ideas to be looked at by the AI team to see if we can use genAI or new AI systems to help user save time energy or be more efficient. ' +
    'Not only that but maybe user want to do something but they couldnt because it too complicate reuquires programmnign or scripting skills ' +
    'Important: Currently we are in this step: ';

  let prompt = base;
  // Personalize greeting if profile available
  if (state.currentStep === 'init' && userProfile) {
    const firstName = userProfile.name?.split(' ')[0] || 'there';
    prompt = `Hi ${firstName}! ` + prompt;
  }
  switch (state.currentStep) {
    case "init":
      return prompt + "-- THIS NEVER RUNS BECAUSE INIT IS STARTED IN ANOTHER FILE --";
    case "lite_description":
      return prompt + "Ask the user to provide the description of the task they want to us to look into. Do not move into providing solutions or offering advice. Just ask for the description. Once you are happy say let's move on to the next step.";
    case "lite_impact":
      return prompt + "Ask how would automating this help them, or team, or company  ?";
    case "decision":
      return (
        prompt +
        "Summarise what you have gathered so far in a beautiful highlighted HTML format, be descriptive and detailed. \n" +
        "If the language is not English, also provide a translation in English. with the same HTML format. \n" +
        "Ask the user if they want to *Submit Now* or *Provide More Details*. Focus only on asking this choice."+
        " Wait for their decision."
      );
      case "details":
        return prompt +
          "Talk with user and drill down to the details." +
          "Try to ask one or two questions in each prompt and then move on to the next batch so that you dont overwhelm the user. \n" +
          "After you got at least two questions answered, let user know that they can go to the next step 'Attahcment' by letting oyu know. If they are willing to go deeper, guide them with more questions.";
  
    case "attachments":
      return prompt + "Would you like to attach any screenshots or files?";
    case "summary":
      return prompt + "Summarise everything that have collected, write it in detailed specifics and sections in a professional HTML format. \n" +
      "If the language is not English, also provide a translation in English. with the same HTML format. \n" +
      " Ask user if this is good to go and if they are ready to submit or they want to make any changes. ";
    case "submit":
      return prompt + "Thank the user for their submission and sign off.";
    default:
      return prompt;
  }
} 
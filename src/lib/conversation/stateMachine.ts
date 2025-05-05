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
          "User provided information about the impact or benefit of automating the task"
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
          'The assistant indicates enough details have been gathered by saying [DETAILS COMPLETED]'
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
      if (/attach|file|screenshot|upload/i.test(text) || /\bno\b/i.test(text)) {
        log('\x1b[36m%s\x1b[0m', '[StateMachine] Transitioning: attachments -> summary');
        return { type: "NEXT", step: "summary" };
      }
      log('\x1b[33m%s\x1b[0m', '[StateMachine] Staying in attachments.');
      return null;
    }

    case "summary": {
      if (/\b(yes|confirm|looks good|submit|done|finish|send)\b/i.test(text)) {
         log('\x1b[36m%s\x1b[0m', '[StateMachine] Transitioning: summary -> submit');
        return { type: "NEXT", step: "submit" };
      }
       log('\x1b[33m%s\x1b[0m', '[StateMachine] Staying in summary (no confirmation).');
       return null;
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
  const base = 'You are AIETv2-IntakeBot, a friendly assistant helping BGC employees submit automation ideas. This group that you are part of has recently been created to help employees find ideas to automate, repetative tasks or even exteremely hard work that is time consuming and can be automated. So that is your goal and your approach should be such that it helps with this. be through and specially when summarizing and going for submission include AS MUCH detials as psossible so nothing is missed. ';
  let prompt = base;
  // Personalize greeting if profile available
  if (state.currentStep === 'init' && userProfile) {
    const firstName = userProfile.name?.split(' ')[0] || 'there';
    prompt = `Hi ${firstName}! ` + prompt;
  }
  switch (state.currentStep) {
    case "init":
      return prompt + "Greet the user and ask for a brief description of the task.";
    case "lite_description":
      return prompt + "Please provide a short (1-2 sentence) description of the task.";
    case "lite_impact":
      return prompt + "Thanks! How would automating this help you?";
    case "decision":
      return (
        prompt +
        "Ask the user if they want to *Submit Now* or *Provide More Details*. Focus only on asking this choice."+
        " Wait for their decision."
      );
      case "details":
        return prompt +
          "Ask the user specific questions about their automation request. You can customize your answers based on the users request and try to find more details about how we can automate this. :\n\n" +
          "Think about this carefully and ask the user specific questions to help you understand their request better.\n" +
          "Specially that the requst can be implemented by some sort of AI or automation. \n" +
          "\n" +
          "Try to ask specific questions in each prompt and then move on to the next one. \n" +
          "Once you feel that enough information has been gathered or if you feel that the user wants to move on to the next step, provide the signal to move on to the next step which is saying [DETAILS COMPLETED]";
  
    case "attachments":
      return prompt + "Would you like to attach any screenshots or files?";
    case "summary":
      return prompt + "Summarise all collected data and ask for confirmation to submit.";
    case "submit":
      return prompt + "Thank the user for their submission and sign off.";
    default:
      return prompt;
  }
} 
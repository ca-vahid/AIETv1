import { ConversationState, Message } from "@/lib/types/conversation";
import { UserProfile } from "@/app/api/profile/route";

/**
 * Defines possible conversation state transitions
 */
export type ConversationStateTransition =
  | { type: "INITIALIZE" }
  | { type: "PROFILE_COMPLETE" }
  | { type: "TASK_DESCRIPTION_COMPLETE"; data: { processDescription: string } }
  | { type: "PAIN_COMPLETE"; data: { painType: string[]; painNarrative: string } }
  | { type: "FREQUENCY_COMPLETE"; data: { frequency: string; durationMinutes: number; peopleInvolved: number } }
  | { type: "TOOLS_COMPLETE"; data: { tools: string[]; roles: string[] } }
  | { type: "IMPACT_COMPLETE"; data: { impactScore: number; hoursSavedPerWeek: number } }
  | { type: "ATTACHMENTS_COMPLETE"; data: { attachments: { url: string; name: string }[] } }
  | { type: "CONFIRM_SUMMARY" }
  | { type: "EDIT_SUMMARY" }
  | { type: "SUBMIT" };

/**
 * Processes a state transition in the conversation state machine
 * @param currentState Current conversation state
 * @param action State transition action
 * @returns Updated conversation state
 */
export function conversationReducer(
  currentState: ConversationState,
  action: ConversationStateTransition
): ConversationState {
  const newState = { ...currentState };

  switch (action.type) {
    case "INITIALIZE":
      return {
        ...newState,
        currentStep: "init",
        missingProfileFields: [],
        collectedData: {},
        validations: {}
      };

    case "PROFILE_COMPLETE":
      return {
        ...newState,
        currentStep: "task_description",
        missingProfileFields: []
      };

    case "TASK_DESCRIPTION_COMPLETE":
      return {
        ...newState,
        currentStep: "pain",
        collectedData: {
          ...newState.collectedData,
          processDescription: action.data.processDescription
        },
        validations: {
          ...newState.validations,
          task_description: true
        }
      };

    case "PAIN_COMPLETE":
      return {
        ...newState,
        currentStep: "frequency",
        collectedData: {
          ...newState.collectedData,
          painType: action.data.painType,
          painNarrative: action.data.painNarrative
        },
        validations: {
          ...newState.validations,
          pain: true
        }
      };

    case "FREQUENCY_COMPLETE":
      return {
        ...newState,
        currentStep: "tools",
        collectedData: {
          ...newState.collectedData,
          frequency: action.data.frequency,
          durationMinutes: action.data.durationMinutes,
          peopleInvolved: action.data.peopleInvolved
        },
        validations: {
          ...newState.validations,
          frequency: true
        }
      };

    case "TOOLS_COMPLETE":
      return {
        ...newState,
        currentStep: "impact",
        collectedData: {
          ...newState.collectedData,
          tools: action.data.tools,
          roles: action.data.roles
        },
        validations: {
          ...newState.validations,
          tools: true
        }
      };

    case "IMPACT_COMPLETE":
      return {
        ...newState,
        currentStep: "attachments",
        collectedData: {
          ...newState.collectedData,
          impactScore: action.data.impactScore,
          hoursSavedPerWeek: action.data.hoursSavedPerWeek
        },
        validations: {
          ...newState.validations,
          impact: true
        }
      };

    case "ATTACHMENTS_COMPLETE":
      return {
        ...newState,
        currentStep: "summary",
        collectedData: {
          ...newState.collectedData,
          attachments: action.data.attachments
        },
        validations: {
          ...newState.validations,
          attachments: true
        }
      };

    case "CONFIRM_SUMMARY":
      return {
        ...newState,
        currentStep: "submit",
        validations: {
          ...newState.validations,
          summary: true
        }
      };

    case "EDIT_SUMMARY":
      return {
        ...newState,
        currentStep: "summary",
        validations: {
          ...newState.validations,
          summary: false
        }
      };

    case "SUBMIT":
      return {
        ...newState,
        currentStep: "submit",
        validations: {
          ...newState.validations,
          submit: true
        }
      };

    default:
      return currentState;
  }
}

/**
 * Checks if a profile is complete enough to proceed
 * @param profile The user profile to check
 * @returns Array of missing fields, empty if complete
 */
export function checkProfileCompleteness(profile: UserProfile | null): string[] {
  if (!profile) return ["user"];
  
  const requiredFields: (keyof UserProfile)[] = [
    "name", 
    "email", 
    "jobTitle", 
    "department", 
    "officeLocation"
  ];
  
  return requiredFields.filter(field => !profile[field]);
}

/**
 * Analyzes an AI message and user message to detect what information was collected
 * @param aiMessage The AI assistant's message 
 * @param userMessage The user's response
 * @param currentState Current conversation state
 * @returns A state transition action or null if no transition is detected
 */
export async function analyzeConversation(
  messages: Message[], 
  currentState: ConversationState
): Promise<ConversationStateTransition | null> {
  if (messages.length < 2) return null;

  const lastUserMsg = messages.filter(m => m.role === "user").pop();
  const lastAiMsg = messages.filter(m => m.role === "assistant").pop();
  
  if (!lastUserMsg || !lastAiMsg) return null;

  // For now, we'll use simple heuristics and return null 
  // (meaning "no state transition detected")
  // In a full implementation, this would use GPT/Gemini to actually analyze the content
  
  switch (currentState.currentStep) {
    case "init":
      return { type: "PROFILE_COMPLETE" };
      
    case "task_description":
      if (lastUserMsg.content.length > 15) {
        return { 
          type: "TASK_DESCRIPTION_COMPLETE", 
          data: { 
            processDescription: lastUserMsg.content 
          } 
        };
      }
      break;
      
    case "pain":
      if (lastUserMsg.content.length > 15) {
        return { 
          type: "PAIN_COMPLETE", 
          data: { 
            painType: ["time", "errors"], // This would be extracted from the message
            painNarrative: lastUserMsg.content 
          } 
        };
      }
      break;
      
    // Other cases would be handled similarly
  }
  
  return null;
}

/**
 * Generates a system prompt based on the current conversation state
 */
export function generatePromptForState(
  state: ConversationState, 
  profile: UserProfile | null
): string {
  let prompt = `You are AIET-IntakeBot, an AI assistant that helps employees at BGC Engineering submit tasks for automation. 
Your goal is to collect all the information needed to evaluate a task for automation.

Current conversation state: ${state.currentStep}`;

  if (profile) {
    prompt += `\n\nUser profile:
- Name: ${profile.name}
- Job Title: ${profile.jobTitle || "Unknown"}
- Department: ${profile.department || "Unknown"}
- Office Location: ${profile.officeLocation || "Unknown"}
- Preferred Language: ${profile.preferredLanguage || "en-US"}`;
  }

  // Add state-specific instructions
  switch (state.currentStep) {
    case "init":
      prompt += `\n\nIntroduce yourself and welcome the user. Ask them what task they would like to automate.`;
      break;
      
    case "task_description":
      prompt += `\n\nAsk the user to describe the specific task they would like to automate in detail. 
Get them to be as specific as possible about what the task involves.`;
      break;
      
    case "pain":
      prompt += `\n\nNow that you understand the task, ask the user why this task is difficult, time-consuming, or error-prone. 
What makes it a pain point? Try to categorize the pain as: time, errors, cost, boredom, etc.`;
      break;
      
    case "frequency":
      prompt += `\n\nAsk the user how often this task is performed (daily, weekly, monthly, etc.), 
approximately how many minutes it takes each time, and how many people are typically involved.`;
      break;
      
    case "tools":
      prompt += `\n\nAsk the user what software tools, systems, or manual processes are currently used for this task.
Also ask which roles or job titles are typically involved in this process.`;
      break;
      
    case "impact":
      prompt += `\n\nAsk the user to rate the potential impact of automating this task on a scale from 1-5 
(where 1 is minor improvement and 5 is major improvement). Also ask how many hours per week they 
estimate could be saved across all team members if this task was automated.`;
      break;
      
    case "attachments":
      prompt += `\n\nAsk if the user has any example files, screenshots, or documentation they would like to 
attach to help the automation team understand the task better. Let them know this is optional.`;
      break;
      
    case "summary":
      const data = state.collectedData;
      prompt += `\n\nSummarize all the information collected so far in a structured way:

Task Description: ${data.processDescription || "[Not provided]"}
Pain Points: ${data.painNarrative || "[Not provided]"}
Frequency: ${data.frequency || "[Not provided]"}
Duration: ${data.durationMinutes ? `${data.durationMinutes} minutes` : "[Not provided]"}
People Involved: ${data.peopleInvolved || "[Not provided]"}
Tools Used: ${data.tools?.join(", ") || "[Not provided]"}
Roles Involved: ${data.roles?.join(", ") || "[Not provided]"}
Impact Score: ${data.impactScore || "[Not provided]"}/5
Hours Saved Weekly: ${data.hoursSavedPerWeek || "[Not provided]"}
Attachments: ${data.attachments && data.attachments.length > 0 ? data.attachments.map(a => a.name).join(", ") : "None"}

Ask the user if this summary is correct or if they want to make any changes.`;
      break;
      
    case "submit":
      prompt += `\n\nThank the user for submitting their automation request. Let them know the AIET team will 
review their request and get back to them within one business day. You can add a fun geology-related fact 
or dad joke as a farewell.`;
      break;
  }

  prompt += `\n\nRemember to be conversational, friendly, and helpful. If the user response is vague, ask follow-up questions.
If they seem stuck, provide relevant examples for their department.`;

  return prompt;
} 
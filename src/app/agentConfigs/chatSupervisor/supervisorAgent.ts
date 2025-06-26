// NOTE: everything that used to mention “NewTelco” now references “ClinConnect”
// and the domain-specific guidance has been rewritten for a healthcare / clinical-trials
// support context.

import { RealtimeItem, tool } from '@openai/agents/realtime';

import {
  exampleAccountInfo,
  examplePolicyDocs,
  exampleStoreLocations,
} from './sampleData';

/**
 * ────────────────────────────────────────────────────────────────────────────────
 * SUPERVISOR AGENT INSTRUCTIONS
 * ────────────────────────────────────────────────────────────────────────────────
 *
 * The junior agent you supervise fields live voice or chat inquiries from
 * patients, caregivers, or partner-organization staff who need help navigating
 * the clinical-trial process via ClinConnect.  Every instruction block below
 * has been rewritten from the original NewTelco wording to match ClinConnect’s
 * mission and compliance requirements (HIPAA, FDA guidance, etc.).
 */
export const supervisorAgentInstructions = `You are an expert customer-service **supervisor agent** for ClinConnect, guiding a junior agent who is speaking directly with callers.  Use the tools provided, follow the domain-specific rules, and craft each next message so the junior agent can read it verbatim.

==== GLOBAL GUIDELINES ====
• You may speak directly or call a tool first, then answer.  
• If a tool needs data you don’t have, instruct the junior agent to ask the caller for it.  
• Your text will be read exactly, so write as though you’re talking to the caller.

==== DOMAIN-SPECIFIC AGENT INSTRUCTIONS ====
You are a helpful customer-service agent for **ClinConnect**, whose mission is to connect patients with actively recruiting clinical trials and provide free navigator support.

▪ Always greet at the start of a conversation with:  
  “Hi, you’ve reached ClinConnect—how can I help you today?”

▪ Before answering any factual question about ClinConnect’s services, a patient’s
  account, trial status, or internal policy, **always call an appropriate tool**
  and rely solely on retrieved context—never on your own memory.

▪ If the caller explicitly asks to speak with a human, escalate immediately.

▪ Prohibited topics for direct discussion: personal medical advice, political or
  religious commentary, controversial current events, or criticism of other
  organizations. You may provide factual resources but never diagnose or treat.

▪ Vary sample phrases; never repeat the same phrase in one conversation.

▪ Follow the output format exactly; cite every factual statement that comes from
  a retrieved document.

==== RESPONSE STYLE ====
• Professional, warm, and concise—this is a voice interaction, so keep sentences
  short and avoid bullets. Prioritize clarity over exhaustive detail.  
• Mention only the top one or two crucial facts, summarizing the rest briefly.  
• Never speculate. If a request exceeds available tools or data, politely refuse
  and offer to escalate.

==== TOOL-CALL RULES ====
• If required parameters are missing, the message **must** ask for them before
  invoking the tool. Never pass empty or placeholder values.  
• Offer additional help only if you know relevant information exists.

==== SAMPLE PHRASES ====
Deflecting a prohibited topic  
• “I’m sorry, I can’t discuss that subject. Is there something else I can help with?”

If no tool or info can fulfill the request  
• “I’m afraid I’m unable to do that. Would you like me to connect you with a
   human navigator for further assistance?”

Before calling a tool  
• “One moment while I retrieve that information for you.”

If required info is missing  
• “Could you provide your phone number ending in the last four digits so I can
   locate your account?”

==== CITATION FORMAT ====
Factual statements must cite the source immediately in-line:  
  [Document Name](ID)

`;

// ────────────────────────────────────────────────────────────────────────────────
// TOOLS
// (Names kept unchanged for compatibility, but descriptions updated for ClinConnect)
// ────────────────────────────────────────────────────────────────────────────────
export const supervisorAgentTools = [
  {
    type: 'function',
    name: 'lookupPolicyDocument',
    description:
      'Searches internal ClinConnect SOPs, security white-papers, and policy docs by topic.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description:
            'The policy topic or keyword—for example “HIPAA compliance” or “trial-matching algorithm”.',
        },
      },
      required: ['topic'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'getUserAccountInfo',
    description:
      'Retrieves a caller’s ClinConnect account profile (read-only).',
    parameters: {
      type: 'object',
      properties: {
        phone_number: {
          type: 'string',
          description:
            "Caller’s phone number in the format “(xxx) xxx-xxxx”, supplied by the user.",
        },
      },
      required: ['phone_number'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'findNearestStore',
    description:
      'Returns nearest partner clinic or resource center based on ZIP—kept for parity with legacy code.',
    parameters: {
      type: 'object',
      properties: {
        zip_code: {
          type: 'string',
          description: 'Five-digit ZIP code provided by the caller.',
        },
      },
      required: ['zip_code'],
      additionalProperties: false,
    },
  },
];

// ────────────────────────────────────────────────────────────────────────────────
// FETCH / TOOL-EXECUTION HELPERS (unchanged except for comment tweaks)
// ────────────────────────────────────────────────────────────────────────────────
async function fetchResponsesMessage(body: any) {
  const response = await fetch('/api/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, parallel_tool_calls: false }),
  });

  if (!response.ok) {
    console.warn('Server returned an error:', response);
    return { error: 'Something went wrong.' };
  }

  const completion = await response.json();
  return completion;
}

function getToolResponse(fName: string) {
  switch (fName) {
    case 'getUserAccountInfo':
      return exampleAccountInfo;
    case 'lookupPolicyDocument':
      return examplePolicyDocs;
    case 'findNearestStore':
      return exampleStoreLocations;
    default:
      return { result: true };
  }
}

/**
 * Iteratively handles function calls until the supervisor produces a final
 * textual answer. No logic changes needed—only comments updated for clarity.
 */
async function handleToolCalls(
  body: any,
  response: any,
  addBreadcrumb?: (title: string, data?: any) => void,
) {
  let currentResponse = response;

  while (true) {
    if (currentResponse?.error) {
      return { error: 'Something went wrong.' } as any;
    }

    const outputItems: any[] = currentResponse.output ?? [];
    const functionCalls = outputItems.filter((item) => item.type === 'function_call');

    if (functionCalls.length === 0) {
      const assistantMessages = outputItems.filter((item) => item.type === 'message');
      const finalText = assistantMessages
        .map((msg: any) => {
          const contentArr = msg.content ?? [];
          return contentArr
            .filter((c: any) => c.type === 'output_text')
            .map((c: any) => c.text)
            .join('');
        })
        .join('\n');
      return finalText;
    }

    for (const toolCall of functionCalls) {
      const fName = toolCall.name;
      const args = JSON.parse(toolCall.arguments || '{}');
      const toolRes = getToolResponse(fName);

      if (addBreadcrumb) {
        addBreadcrumb(`[supervisorAgent] function call: ${fName}`, args);
        addBreadcrumb(`[supervisorAgent] function call result: ${fName}`, toolRes);
      }

      body.input.push(
        {
          type: 'function_call',
          call_id: toolCall.call_id,
          name: toolCall.name,
          arguments: toolCall.arguments,
        },
        {
          type: 'function_call_output',
          call_id: toolCall.call_id,
          output: JSON.stringify(toolRes),
        },
      );
    }

    currentResponse = await fetchResponsesMessage(body);
  }
}

export const getNextResponseFromSupervisor = tool({
  name: 'getNextResponseFromSupervisor',
  description:
    'Returns the next supervisor message guiding the junior ClinConnect agent.',
  parameters: {
    type: 'object',
    properties: {
      relevantContextFromLastUserMessage: {
        type: 'string',
        description:
          'Key info from the caller’s most recent message. Omit only if nothing new was said.',
      },
    },
    required: ['relevantContextFromLastUserMessage'],
    additionalProperties: false,
  },
  execute: async (input, details) => {
    const { relevantContextFromLastUserMessage } = input as {
      relevantContextFromLastUserMessage: string;
    };

    const addBreadcrumb = (details?.context as any)?.addTranscriptBreadcrumb as
      | ((title: string, data?: any) => void)
      | undefined;

    const history: RealtimeItem[] = (details?.context as any)?.history ?? [];
    const filteredLogs = history.filter((log) => log.type === 'message');

    const body: any = {
      model: 'gpt-4.1',
      input: [
        {
          type: 'message',
          role: 'system',
          content: supervisorAgentInstructions,
        },
        {
          type: 'message',
          role: 'user',
          content: `==== Conversation History ====
${JSON.stringify(filteredLogs, null, 2)}

==== Relevant Context From Last User Message ===
${relevantContextFromLastUserMessage}
`,
        },
      ],
      tools: supervisorAgentTools,
    };

    const response = await fetchResponsesMessage(body);
    if (response.error) {
      return { error: 'Something went wrong.' };
    }

    const finalText = await handleToolCalls(body, response, addBreadcrumb);
    if ((finalText as any)?.error) {
      return { error: 'Something went wrong.' };
    }

    return { nextResponse: finalText as string };
  },
});
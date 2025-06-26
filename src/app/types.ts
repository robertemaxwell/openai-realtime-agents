import { z } from "zod";

// Define the allowed moderation categories only once
export const MODERATION_CATEGORIES = [
  "OFFENSIVE",
  "OFF_BRAND",
  "VIOLENCE",
  "NONE",
] as const;

// Derive the union type for ModerationCategory from the array
export type ModerationCategory = (typeof MODERATION_CATEGORIES)[number];

// Create a Zod enum based on the same array
export const ModerationCategoryZod = z.enum([...MODERATION_CATEGORIES]);

export type SessionStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED";

export interface ToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
  pattern?: string;
  properties?: Record<string, ToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
  items?: ToolParameterProperty;
}

export interface ToolParameters {
  type: string;
  properties: Record<string, ToolParameterProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface Tool {
  type: "function";
  name: string;
  description: string;
  parameters: ToolParameters;
}

export interface AgentConfig {
  name: string;
  publicDescription: string; // gives context to agent transfer tool
  instructions: string;
  tools: Tool[];
  toolLogic?: Record<
    string,
    (args: any, transcriptLogsFiltered: TranscriptItem[], addTranscriptBreadcrumb?: (title: string, data?: any) => void) => Promise<any> | any
  >;
  // addTranscriptBreadcrumb is a param in case we want to add additional breadcrumbs, e.g. for nested tool calls from a supervisor agent.
  downstreamAgents?:
    | AgentConfig[]
    | { name: string; publicDescription: string }[];
}

export type AllAgentConfigsType = Record<string, AgentConfig[]>;

export interface GuardrailResultType {
  status: "IN_PROGRESS" | "DONE";
  testText?: string; 
  category?: ModerationCategory;
  rationale?: string;
}

export interface TranscriptItem {
  itemId: string;
  type: "MESSAGE" | "BREADCRUMB";
  role?: "user" | "assistant";
  title?: string;
  data?: Record<string, any>;
  expanded: boolean;
  timestamp: string;
  createdAtMs: number;
  status: "IN_PROGRESS" | "DONE";
  isHidden: boolean;
  guardrailResult?: GuardrailResultType;
}

export interface Log {
  id: number;
  timestamp: string;
  direction: string;
  eventName: string;
  data: any;
  expanded: boolean;
  type: string;
}

export interface ServerEvent {
  type: string;
  event_id?: string;
  item_id?: string;
  transcript?: string;
  delta?: string;
  session?: {
    id?: string;
  };
  item?: {
    id?: string;
    object?: string;
    type?: string;
    status?: string;
    name?: string;
    arguments?: string;
    role?: "user" | "assistant";
    content?: {
      type?: string;
      transcript?: string | null;
      text?: string;
    }[];
  };
  response?: {
    output?: {
      id: string;
      type?: string;
      name?: string;
      arguments?: any;
      call_id?: string;
      role: string;
      content?: any;
    }[];
    metadata: Record<string, any>;
    status_details?: {
      error?: any;
    };
  };
}

export interface LoggedEvent {
  id: number;
  direction: "client" | "server";
  expanded: boolean;
  timestamp: string;
  eventName: string;
  eventData: Record<string, any>; // can have arbitrary objects logged
}

// Update the GuardrailOutputZod schema to use the shared ModerationCategoryZod
export const GuardrailOutputZod = z.object({
  moderationRationale: z.string(),
  moderationCategory: ModerationCategoryZod,
  testText: z.string().optional(),
});

export type GuardrailOutput = z.infer<typeof GuardrailOutputZod>;

// Clinical Trial Types
export interface ClinicalTrial {
  id: string;
  nctId: string;
  title: string;
  briefSummary: string;
  detailedDescription?: string;
  phase: string;
  status: 'recruiting' | 'active' | 'completed' | 'suspended' | 'terminated';
  condition: string[];
  intervention: string[];
  sponsor: string;
  location: {
    facility: string;
    city: string;
    state: string;
    country: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  }[];
  eligibilityCriteria: {
    inclusionCriteria: string[];
    exclusionCriteria: string[];
    minAge?: string;
    maxAge?: string;
    gender: 'all' | 'male' | 'female';
  };
  estimatedEnrollment: number;
  studyStartDate?: string;
  primaryCompletionDate?: string;
  studyCompletionDate?: string;
  url?: string;
}

export interface PatientProfile {
  id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  conditions: string[];
  medications: string[];
  allergies: string[];
  medicalHistory: string[];
  location: {
    city: string;
    state: string;
    country: string;
  };
  preferences: {
    maxDistance: number; // in miles
    travelWillingness: 'local' | 'regional' | 'national' | 'international';
    phasePreference?: string[];
  };
}

export interface TrialMatch {
  trial: ClinicalTrial;
  matchScore: number;
  matchReasons: string[];
  eligibilityStatus: 'eligible' | 'potentially_eligible' | 'not_eligible';
  eligibilityNotes: string[];
}

export interface EnrollmentApplication {
  id: string;
  patientId: string;
  trialId: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'enrolled';
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
  contactPreference: 'phone' | 'email' | 'both';
}

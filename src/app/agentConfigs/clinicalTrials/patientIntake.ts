import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const patientIntakeAgent = new RealtimeAgent({
  name: 'patientIntakeAgent',
  voice: 'sage',
  handoffDescription:
    "Specializes in collecting patient medical information, demographics, and preferences for clinical trial matching. Should be routed when a new patient needs to create their profile or update their medical information.",

  instructions: `You are a compassionate clinical trial intake specialist. Your role is to:

1. Welcome patients warmly and explain how clinical trials can provide access to cutting-edge treatments
2. Collect comprehensive medical information including:
   - Current medical conditions and diagnoses
   - Current medications and treatments
   - Medical history and previous treatments
   - Age, gender, and location
   - Any known allergies or adverse reactions
3. Understand patient preferences for:
   - Maximum travel distance for trials
   - Trial phase preferences (Phase I, II, III, IV)
   - Contact preferences
4. Educate patients about clinical trials and what to expect
5. Ensure patient privacy and explain how their information will be used
6. Hand off to trial search agent once complete profile is collected

Always be empathetic, as patients may be dealing with serious health conditions. Explain medical terms in simple language and ensure patients feel supported throughout the process.`,

  tools: [
    tool({
      name: 'createPatientProfile',
      description: 'Creates a new patient profile with collected medical information and preferences',
      parameters: {
        type: 'object',
        properties: {
          age: {
            type: 'number',
            description: 'Patient age in years',
          },
          gender: {
            type: 'string',
            enum: ['male', 'female', 'other'],
            description: 'Patient gender',
          },
          conditions: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of current medical conditions or diagnoses',
          },
          medications: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of current medications',
          },
          allergies: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of known allergies',
          },
          medicalHistory: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of relevant past medical history',
          },
          city: {
            type: 'string',
            description: 'Patient city',
          },
          state: {
            type: 'string',
            description: 'Patient state/province',
          },
          country: {
            type: 'string',
            description: 'Patient country',
          },
          maxDistance: {
            type: 'number',
            description: 'Maximum distance willing to travel in miles',
          },
          travelWillingness: {
            type: 'string',
            enum: ['local', 'regional', 'national', 'international'],
            description: 'General travel willingness',
          },
          phasePreference: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['Phase I', 'Phase II', 'Phase III', 'Phase IV']
            },
            description: 'Preferred clinical trial phases (optional)',
          },
          contactPhone: {
            type: 'string',
            description: 'Patient phone number',
          },
          contactEmail: {
            type: 'string',
            description: 'Patient email address',
          },
          contactPreference: {
            type: 'string',
            enum: ['phone', 'email', 'both'],
            description: 'Preferred contact method',
          }
        },
        required: ['age', 'gender', 'conditions', 'city', 'state', 'country', 'maxDistance', 'travelWillingness', 'contactPreference'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const patientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // In a real implementation, this would save to a database
        const patientProfile = {
          id: patientId,
          ...input,
          createdAt: new Date().toISOString(),
        };

        return {
          success: true,
          patientId,
          message: 'Patient profile created successfully. You can now search for matching clinical trials.',
          profileSummary: {
            conditions: input.conditions,
            location: `${input.city}, ${input.state}`,
            travelWillingness: input.travelWillingness,
          }
        };
      },
    }),

    tool({
      name: 'updatePatientProfile',
      description: 'Updates an existing patient profile with new information',
      parameters: {
        type: 'object',
        properties: {
          patientId: {
            type: 'string',
            description: 'Existing patient ID',
          },
          updates: {
            type: 'object',
            description: 'Fields to update in the patient profile',
            additionalProperties: true,
          }
        },
        required: ['patientId', 'updates'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        // In a real implementation, this would update the database
        return {
          success: true,
          message: 'Patient profile updated successfully.',
          patientId: input.patientId,
        };
      },
    }),

    tool({
      name: 'explainClinicalTrials',
      description: 'Provides educational information about clinical trials',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['basics', 'phases', 'rights', 'benefits_risks', 'process', 'costs', 'informed_consent'],
            description: 'The clinical trial topic to explain',
          }
        },
        required: ['topic'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const explanations = {
          basics: 'Clinical trials are research studies that test new treatments, drugs, or medical devices in people. They help doctors learn if new treatments are safe and effective.',
          phases: 'Clinical trials happen in phases: Phase I tests safety in small groups, Phase II tests effectiveness, Phase III compares to standard treatments in larger groups, and Phase IV monitors long-term effects after approval.',
          rights: 'As a clinical trial participant, you have the right to: understand the study, ask questions, leave at any time, receive quality medical care, and have your privacy protected.',
          benefits_risks: 'Benefits may include access to new treatments, close monitoring by medical experts, and contributing to medical research. Risks may include unknown side effects, time commitment, and that the treatment may not work.',
          process: 'The process typically involves: screening to see if you qualify, informed consent, treatment phase with regular monitoring, and follow-up visits.',
          costs: 'Clinical trials typically cover the cost of the investigational treatment and trial-related care. You may still be responsible for standard medical care costs.',
          informed_consent: 'Informed consent is a process where you learn about the trial and decide whether to participate. You can ask questions and take time to decide.',
        };

        return {
          topic: input.topic,
          explanation: explanations[input.topic as keyof typeof explanations],
        };
      },
    }),
  ],

  handoffs: [],
}); 
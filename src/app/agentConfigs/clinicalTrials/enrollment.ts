import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const enrollmentAgent = new RealtimeAgent({
  name: 'enrollmentAgent',
  voice: 'sage',
  handoffDescription:
    "Handles clinical trial enrollment applications, screening processes, and enrollment coordination. Should be routed when patients want to apply for specific trials or need help with the enrollment process.",

  instructions: `You are a clinical trial enrollment specialist. Your role is to:

1. Guide patients through the enrollment application process
2. Explain what to expect during screening and enrollment
3. Help patients prepare for screening visits
4. Coordinate with study teams and facilities
5. Track application status and follow up
6. Provide support throughout the enrollment process
7. Answer questions about trial participation

Always be supportive and thorough in explaining each step. Help patients feel prepared and confident about their participation. Coordinate closely with study teams to ensure smooth enrollment.`,

  tools: [
    tool({
      name: 'submitTrialApplication',
      description: 'Submits a patient application for a specific clinical trial',
      parameters: {
        type: 'object',
        properties: {
          patientId: {
            type: 'string',
            description: 'Patient ID',
          },
          trialId: {
            type: 'string',
            description: 'Trial ID to apply for',
          },
          contactPreference: {
            type: 'string',
            enum: ['phone', 'email', 'both'],
            description: 'How the patient prefers to be contacted',
          },
          availability: {
            type: 'object',
            properties: {
              preferredDays: {
                type: 'array',
                items: { type: 'string' },
                description: 'Preferred days of the week for appointments'
              },
              preferredTimes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Preferred times of day for appointments'
              }
            },
            description: 'Patient availability for appointments'
          },
          urgency: {
            type: 'string',
            enum: ['routine', 'urgent', 'emergency'],
            description: 'Urgency of the patient\'s medical situation',
          },
          additionalNotes: {
            type: 'string',
            description: 'Any additional information the patient wants to share',
          }
        },
        required: ['patientId', 'trialId', 'contactPreference'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return {
          success: true,
          applicationId,
          message: 'Your application has been submitted successfully. The study team will contact you within 2-3 business days.',
          nextSteps: [
            'Study team will review your application',
            'Initial phone screening call',
            'If eligible, schedule screening visit',
            'Complete informed consent process'
          ],
          estimatedTimeToContact: '2-3 business days',
          contactInfo: {
            studyCoordinator: 'Sarah Johnson, RN',
            phone: '(617) 555-0123',
            email: 'clinicaltrials@umc.edu'
          }
        };
      },
    }),

    tool({
      name: 'checkApplicationStatus',
      description: 'Checks the status of a patient\'s trial application',
      parameters: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'Application ID to check',
          }
        },
        required: ['applicationId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        // Mock application status
        const statuses = ['submitted', 'under_review', 'screening_scheduled', 'screening_completed', 'enrolled', 'not_eligible'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        const statusMessages = {
          submitted: 'Your application has been submitted and is waiting for initial review.',
          under_review: 'Your application is currently being reviewed by the study team.',
          screening_scheduled: 'Your screening appointment has been scheduled. Check your email for details.',
          screening_completed: 'Your screening is complete. Results are being reviewed.',
          enrolled: 'Congratulations! You have been enrolled in the study.',
          not_eligible: 'Unfortunately, you do not meet the eligibility criteria for this study.'
        };

        return {
          applicationId: input.applicationId,
          status: randomStatus,
          statusMessage: statusMessages[randomStatus as keyof typeof statusMessages],
          lastUpdated: new Date().toISOString(),
          nextAction: randomStatus === 'screening_scheduled' ? 'Attend your screening appointment' :
                     randomStatus === 'enrolled' ? 'Attend your first study visit' :
                     'Wait for study team to contact you'
        };
      },
    }),

    tool({
      name: 'scheduleScreeningVisit',
      description: 'Schedules a screening visit for a clinical trial',
      parameters: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'Application ID',
          },
          preferredDate: {
            type: 'string',
            description: 'Preferred date for screening visit (YYYY-MM-DD)',
          },
          preferredTime: {
            type: 'string',
            description: 'Preferred time for screening visit',
          },
          specialRequirements: {
            type: 'string',
            description: 'Any special requirements or accommodations needed',
          }
        },
        required: ['applicationId', 'preferredDate'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        return {
          success: true,
          scheduledDate: input.preferredDate,
          scheduledTime: input.preferredTime || '10:00 AM',
          location: {
            facility: 'University Medical Center',
            address: '123 Medical Drive, Boston, MA 02115',
            floor: '3rd Floor, Clinical Research Unit',
            parking: 'Visitor parking available in Garage A'
          },
          duration: '2-3 hours',
          whatToBring: [
            'Photo ID',
            'Insurance cards',
            'List of current medications',
            'Recent medical records',
            'Comfortable clothing'
          ],
          preparation: [
            'Fast for 8 hours before visit (for blood work)',
            'Bring a list of questions',
            'Arrive 15 minutes early'
          ],
          contactForQuestions: '(617) 555-0123'
        };
      },
    }),

    tool({
      name: 'getEnrollmentChecklist',
      description: 'Provides a checklist of steps for trial enrollment',
      parameters: {
        type: 'object',
        properties: {
          trialPhase: {
            type: 'string',
            description: 'The phase of the clinical trial',
          }
        },
        required: ['trialPhase'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const baseChecklist = [
          { step: 'Submit application', completed: true },
          { step: 'Initial phone screening', completed: false },
          { step: 'Review informed consent', completed: false },
          { step: 'Screening visit', completed: false },
          { step: 'Medical history review', completed: false },
          { step: 'Physical examination', completed: false },
          { step: 'Laboratory tests', completed: false },
          { step: 'Eligibility confirmation', completed: false },
          { step: 'Final enrollment', completed: false }
        ];

        const phaseSpecificSteps = {
          'Phase I': [
            { step: 'Safety monitoring plan review', completed: false },
            { step: 'Dose escalation explanation', completed: false }
          ],
          'Phase III': [
            { step: 'Randomization process explanation', completed: false },
            { step: 'Quality of life questionnaires', completed: false }
          ]
        };

        const additionalSteps = phaseSpecificSteps[input.trialPhase as keyof typeof phaseSpecificSteps] || [];

        return {
          checklist: [...baseChecklist, ...additionalSteps],
          estimatedTimeframe: '2-4 weeks from application to enrollment',
          tips: [
            'Keep all your medical records organized',
            'Maintain open communication with the study team',
            'Ask questions whenever you\'re unsure',
            'Follow all preparation instructions carefully'
          ]
        };
      },
    }),

    tool({
      name: 'coordinateWithStudyTeam',
      description: 'Coordinates communication between patient and study team',
      parameters: {
        type: 'object',
        properties: {
          patientId: {
            type: 'string',
            description: 'Patient ID',
          },
          trialId: {
            type: 'string',
            description: 'Trial ID',
          },
          message: {
            type: 'string',
            description: 'Message to relay to study team',
          },
          urgency: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Urgency level of the message',
          }
        },
        required: ['patientId', 'trialId', 'message'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        return {
          success: true,
          messageId: `msg_${Date.now()}`,
          message: 'Your message has been forwarded to the study team.',
          expectedResponse: input.urgency === 'high' ? 'Same day' : 
                           input.urgency === 'medium' ? '1-2 business days' : 
                           '2-3 business days',
          studyCoordinatorContact: '(617) 555-0123'
        };
      },
    }),
  ],

  handoffs: [],
}); 
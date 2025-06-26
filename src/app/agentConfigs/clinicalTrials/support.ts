import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const supportAgent = new RealtimeAgent({
  name: 'supportAgent',
  voice: 'sage',
  handoffDescription:
    "Provides ongoing support, answers questions, and helps patients navigate their clinical trial journey. Should be routed for general questions, concerns, or when patients need emotional support.",

  instructions: `You are a compassionate clinical trial support specialist. Your role is to:

1. Provide emotional support and encouragement to patients
2. Answer questions about clinical trials, procedures, and processes
3. Help patients understand their rights and responsibilities
4. Connect patients with additional resources and support services
5. Address concerns about trial participation
6. Provide information about side effects and what to expect
7. Help patients communicate with their healthcare teams

Always be empathetic, patient, and thorough in your responses. Remember that patients may be dealing with serious health conditions and may feel anxious or overwhelmed. Provide clear, accurate information while being supportive.`,

  tools: [
    tool({
      name: 'provideEmotionalSupport',
      description: 'Provides emotional support and encouragement to patients',
      parameters: {
        type: 'object',
        properties: {
          concern: {
            type: 'string',
            enum: ['anxiety', 'fear', 'uncertainty', 'side_effects', 'family_concerns', 'financial', 'other'],
            description: 'Type of concern or emotion the patient is experiencing',
          },
          specificConcern: {
            type: 'string',
            description: 'Specific details about the patient\'s concern',
          }
        },
        required: ['concern'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const supportResponses = {
          anxiety: {
            response: 'It\'s completely normal to feel anxious about participating in a clinical trial. Many patients experience these feelings.',
            suggestions: [
              'Talk with your healthcare team about your concerns',
              'Connect with other trial participants if possible',
              'Practice relaxation techniques like deep breathing',
              'Keep a journal of your thoughts and feelings'
            ],
            resources: ['Patient support groups', 'Counseling services', 'Meditation apps']
          },
          fear: {
            response: 'Fear about clinical trials is understandable. Remember that trials have many safety measures in place.',
            suggestions: [
              'Learn more about the trial\'s safety protocols',
              'Ask about the study\'s safety monitoring board',
              'Discuss your fears with the study team',
              'Remember you can withdraw at any time'
            ],
            resources: ['Educational materials', 'Safety monitoring information', 'Patient advocates']
          },
          uncertainty: {
            response: 'Uncertainty is a natural part of clinical trial participation. Focus on what you can control.',
            suggestions: [
              'Ask questions whenever you have them',
              'Keep informed about your treatment progress',
              'Maintain open communication with your care team',
              'Set realistic expectations'
            ],
            resources: ['Patient education materials', 'Support groups', 'Communication tools']
          }
        };

        const support = supportResponses[input.concern as keyof typeof supportResponses] || {
          response: 'Thank you for sharing your concerns. Your feelings are valid and important.',
          suggestions: ['Speak with your healthcare team', 'Seek support from family and friends'],
          resources: ['Patient support services']
        };

        return {
          supportMessage: support.response,
          suggestions: support.suggestions,
          resources: support.resources,
          followUp: 'Would you like to discuss any specific aspects of your concern in more detail?'
        };
      },
    }),

    tool({
      name: 'explainSideEffects',
      description: 'Explains potential side effects and how to manage them',
      parameters: {
        type: 'object',
        properties: {
          treatment: {
            type: 'string',
            description: 'Type of treatment or intervention',
          },
          specificSideEffect: {
            type: 'string',
            description: 'Specific side effect the patient is asking about',
          }
        },
        required: ['treatment'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        return {
          generalInfo: 'Side effects vary depending on the treatment and individual patient factors.',
          commonSideEffects: [
            'Fatigue or tiredness',
            'Nausea or digestive issues',
            'Changes in appetite',
            'Skin reactions at injection sites',
            'Headaches'
          ],
          managementTips: [
            'Report all side effects to your study team',
            'Keep a symptom diary',
            'Stay hydrated and maintain good nutrition',
            'Get adequate rest',
            'Follow all medication instructions'
          ],
          whenToCallDoctor: [
            'Severe or worsening symptoms',
            'Symptoms that interfere with daily activities',
            'New or unexpected symptoms',
            'Any symptoms that concern you'
          ],
          emergencyContacts: {
            studyTeam: '(617) 555-0123',
            afterhours: '(617) 555-HELP',
            emergency: '911'
          }
        };
      },
    }),

    tool({
      name: 'explainPatientRights',
      description: 'Explains patient rights in clinical trials',
      parameters: {
        type: 'object',
        properties: {
          specificRight: {
            type: 'string',
            enum: ['informed_consent', 'withdraw', 'privacy', 'compensation', 'medical_care', 'all'],
            description: 'Specific patient right to explain',
          }
        },
        required: ['specificRight'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const rights = {
          informed_consent: {
            title: 'Right to Informed Consent',
            description: 'You have the right to understand all aspects of the study before agreeing to participate.',
            details: [
              'Purpose and procedures of the study',
              'Potential risks and benefits',
              'Alternative treatments available',
              'Time to consider your decision',
              'Opportunity to ask questions'
            ]
          },
          withdraw: {
            title: 'Right to Withdraw',
            description: 'You can leave the study at any time without penalty.',
            details: [
              'No need to give a reason',
              'Your medical care will not be affected',
              'You can change your mind at any point',
              'Data collected up to that point may still be used'
            ]
          },
          privacy: {
            title: 'Right to Privacy',
            description: 'Your personal and medical information must be kept confidential.',
            details: [
              'HIPAA protections apply',
              'Only authorized personnel can access your data',
              'Information is coded to protect identity',
              'You can request access to your data'
            ]
          },
          all: {
            title: 'All Patient Rights',
            description: 'As a clinical trial participant, you have comprehensive rights.',
            details: [
              'Right to informed consent',
              'Right to withdraw at any time',
              'Right to privacy and confidentiality',
              'Right to quality medical care',
              'Right to ask questions',
              'Right to file complaints'
            ]
          }
        };

        const selectedRight = rights[input.specificRight as keyof typeof rights];
        
        return {
          title: selectedRight.title,
          description: selectedRight.description,
          details: selectedRight.details,
          additionalInfo: 'If you feel your rights have been violated, you can contact the Institutional Review Board (IRB) or a patient advocate.'
        };
      },
    }),

    tool({
      name: 'connectWithResources',
      description: 'Connects patients with additional support resources',
      parameters: {
        type: 'object',
        properties: {
          resourceType: {
            type: 'string',
            enum: ['financial', 'transportation', 'support_groups', 'educational', 'advocacy', 'counseling'],
            description: 'Type of resource needed',
          },
          location: {
            type: 'string',
            description: 'Patient location for local resources',
          }
        },
        required: ['resourceType'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const resources = {
          financial: {
            title: 'Financial Assistance Resources',
            options: [
              'Patient assistance programs',
              'Clinical trial expense coverage',
              'Transportation assistance',
              'Lodging assistance programs',
              'Co-pay assistance programs'
            ],
            contacts: [
              'ClinicalTrials.gov - Find Your Trial financial info',
              'NeedyMeds.org',
              'Patient Access Network Foundation'
            ]
          },
          transportation: {
            title: 'Transportation Resources',
            options: [
              'Medical transport services',
              'Ride-sharing programs',
              'Public transportation assistance',
              'Volunteer driver programs',
              'Travel reimbursement programs'
            ],
            contacts: [
              'Local medical transport companies',
              'American Cancer Society Road to Recovery',
              'Local senior services'
            ]
          },
          support_groups: {
            title: 'Patient Support Groups',
            options: [
              'Disease-specific support groups',
              'Clinical trial participant groups',
              'Online support communities',
              'Caregiver support groups',
              'Peer mentorship programs'
            ],
            contacts: [
              'Local hospitals and medical centers',
              'Disease-specific organizations',
              'Online communities like CaringBridge'
            ]
          }
        };

        const selectedResource = resources[input.resourceType as keyof typeof resources];
        
        return {
          title: selectedResource.title,
          options: selectedResource.options,
          contacts: selectedResource.contacts,
          nextSteps: 'Would you like help connecting with any of these specific resources?'
        };
      },
    }),

    tool({
      name: 'provideEducationalInfo',
      description: 'Provides educational information about clinical trials and medical topics',
      parameters: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            enum: ['clinical_trial_basics', 'research_process', 'regulatory_oversight', 'participant_safety', 'data_use', 'results_sharing'],
            description: 'Educational topic to explain',
          }
        },
        required: ['topic'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const educationalContent = {
          clinical_trial_basics: {
            title: 'Clinical Trial Basics',
            content: 'Clinical trials are research studies that test new treatments, devices, or approaches to prevent, detect, or treat diseases.',
            keyPoints: [
              'They follow strict scientific protocols',
              'They have multiple phases of testing',
              'They require ethical review and approval',
              'They are conducted by qualified researchers'
            ]
          },
          participant_safety: {
            title: 'Participant Safety',
            content: 'Patient safety is the top priority in clinical trials.',
            keyPoints: [
              'Institutional Review Boards oversee trials',
              'Data Safety Monitoring Boards review ongoing data',
              'Adverse events are carefully tracked',
              'Trials can be stopped if safety concerns arise'
            ]
          }
        };

        const content = educationalContent[input.topic as keyof typeof educationalContent];
        
        return {
          title: content.title,
          content: content.content,
          keyPoints: content.keyPoints,
          additionalResources: [
            'ClinicalTrials.gov education section',
            'FDA patient information guides',
            'NIH clinical trial information'
          ]
        };
      },
    }),
  ],

  handoffs: [],
}); 
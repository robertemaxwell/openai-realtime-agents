import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const trialSearchAgent = new RealtimeAgent({
  name: 'trialSearchAgent',
  voice: 'sage',
  handoffDescription:
    "Specializes in searching and matching clinical trials to patient profiles. Should be routed when patients need to find trials based on their medical conditions, location, or specific criteria.",

  instructions: `You are an expert clinical trial search specialist. Your role is to:

1. Search for clinical trials that match patient profiles and criteria
2. Explain trial details in easy-to-understand language
3. Highlight why specific trials might be good matches
4. Provide information about trial locations, phases, and requirements
5. Help patients understand eligibility criteria
6. Save interesting trials for patients to review later
7. Hand off to enrollment agent when patients want to apply

Always present information clearly and help patients understand their options. Be encouraging about potential matches while being honest about eligibility requirements.`,

  tools: [
    tool({
      name: 'searchTrialsByCondition',
      description: 'Searches for clinical trials by medical condition',
      parameters: {
        type: 'object',
        properties: {
          conditions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Medical conditions to search for',
          },
          location: {
            type: 'object',
            properties: {
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              maxDistance: { type: 'number' }
            },
            description: 'Patient location and travel preferences',
          },
          phase: {
            type: 'array',
            items: { type: 'string' },
            description: 'Preferred trial phases',
          },
          status: {
            type: 'string',
            enum: ['recruiting', 'active', 'all'],
            description: 'Trial recruitment status',
          }
        },
        required: ['conditions'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        try {
          // Use real ClinicalTrials.gov API
          const response = await fetch(`/api/clinical-trials?action=search&condition=${encodeURIComponent(input.conditions?.join(' ') || '')}&location=${encodeURIComponent(input.location?.state || '')}&phase=${encodeURIComponent(input.phase?.join(' ') || '')}&status=${input.status || 'recruiting'}`);
          
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }
          
          const apiData = await response.json();
          
          if (apiData.success) {
            return {
              trials: apiData.trials,
              totalFound: apiData.totalCount,
              searchCriteria: input,
              usingRealData: !apiData.fallbackMode
            };
          } else {
            throw new Error(apiData.error || 'Unknown API error');
          }
        } catch (error) {
          console.error('Error fetching trials from API:', error);
          
          // Fallback to mock data for demonstration
          const mockTrials = [
            {
              id: 'trial_001',
              nctId: 'NCT12345678',
              title: 'Phase II Study of Novel Cancer Immunotherapy',
              briefSummary: 'Testing a new immunotherapy treatment for advanced solid tumors.',
              phase: 'Phase II',
              status: 'recruiting',
              condition: ['Cancer', 'Solid Tumor', 'Advanced Cancer'],
              intervention: ['Immunotherapy', 'CAR-T Cell Therapy'],
              sponsor: 'University Medical Center',
              location: [
                {
                  facility: 'University Medical Center',
                  city: 'Boston',
                  state: 'Massachusetts',
                  country: 'United States',
                  contactName: 'Dr. Sarah Johnson',
                  contactPhone: '(617) 555-0123',
                  contactEmail: 'clinicaltrials@umc.edu'
                }
              ],
              eligibilityCriteria: {
                inclusionCriteria: [
                  'Age 18 years or older',
                  'Histologically confirmed solid tumor',
                  'Progressive disease after standard therapy',
                  'ECOG performance status 0-2'
                ],
                exclusionCriteria: [
                  'Active autoimmune disease',
                  'Concurrent malignancy',
                  'Severe cardiac dysfunction'
                ],
                minAge: '18',
                maxAge: '85',
                gender: 'all'
              },
              estimatedEnrollment: 50,
              url: 'https://clinicaltrials.gov/ct2/show/NCT12345678'
            },
            {
              id: 'trial_002',
              nctId: 'NCT87654321',
              title: 'Phase III Diabetes Management Study',
              briefSummary: 'Comparing new diabetes medication to standard treatment.',
              phase: 'Phase III',
              status: 'recruiting',
              condition: ['Type 2 Diabetes', 'Diabetes Mellitus'],
              intervention: ['Investigational Drug', 'Metformin'],
              sponsor: 'Pharmaceutical Research Institute',
              location: [
                {
                  facility: 'Regional Diabetes Center',
                  city: 'Chicago',
                  state: 'Illinois',
                  country: 'United States',
                  contactName: 'Dr. Michael Chen',
                  contactPhone: '(312) 555-0456',
                  contactEmail: 'diabetes.trials@rdc.org'
                }
              ],
              eligibilityCriteria: {
                inclusionCriteria: [
                  'Type 2 Diabetes diagnosis',
                  'HbA1c between 7-11%',
                  'Age 25-75 years',
                  'BMI 25-40 kg/m²'
                ],
                exclusionCriteria: [
                  'Type 1 Diabetes',
                  'Severe kidney disease',
                  'Recent heart attack'
                ],
                minAge: '25',
                maxAge: '75',
                gender: 'all'
              },
              estimatedEnrollment: 200,
              url: 'https://clinicaltrials.gov/ct2/show/NCT87654321'
            }
          ];

          // Filter trials based on search criteria (fallback)
          const filteredTrials = mockTrials.filter(trial => {
            // Check condition match
            const conditionMatch = input.conditions ? input.conditions.some((condition: string) =>
              trial.condition.some(trialCondition =>
                trialCondition.toLowerCase().includes(condition.toLowerCase()) ||
                condition.toLowerCase().includes(trialCondition.toLowerCase())
              )
            ) : true;

            // Check phase if specified
            const phaseMatch = !input.phase || 
              input.phase.includes(trial.phase);

            // Check status if specified
            const statusMatch = !input.status || 
              input.status === 'all' || 
              trial.status === input.status;

            return conditionMatch && phaseMatch && statusMatch;
          });

          return {
            trials: filteredTrials,
            totalFound: filteredTrials.length,
            searchCriteria: input,
            usingRealData: false,
            fallbackMode: true
          };
        }
      },
    }),

    tool({
      name: 'getTrialDetails',
      description: 'Gets detailed information about a specific clinical trial',
      parameters: {
        type: 'object',
        properties: {
          trialId: {
            type: 'string',
            description: 'The trial ID to get details for',
          }
        },
        required: ['trialId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        // Mock detailed trial data
        const trialDetails = {
          id: input.trialId,
          detailedDescription: 'This study aims to evaluate the safety and efficacy of a novel treatment approach. Participants will receive comprehensive medical care and close monitoring throughout the study period.',
          studyStartDate: '2024-03-15',
          primaryCompletionDate: '2025-12-30',
          studyCompletionDate: '2026-06-30',
          primaryOutcome: 'Overall response rate at 6 months',
          secondaryOutcome: ['Progression-free survival', 'Quality of life measures', 'Safety profile'],
          studyDesign: 'Randomized, double-blind, placebo-controlled',
          armGroups: [
            { name: 'Experimental Arm', description: 'Investigational treatment + standard care' },
            { name: 'Control Arm', description: 'Placebo + standard care' }
          ]
        };

        return trialDetails;
      },
    }),

    tool({
      name: 'calculateEligibility',
      description: 'Calculates patient eligibility for a specific trial',
      parameters: {
        type: 'object',
        properties: {
          trialId: {
            type: 'string',
            description: 'The trial ID to check eligibility for',
          },
          patientAge: {
            type: 'number',
            description: 'Patient age',
          },
          patientGender: {
            type: 'string',
            description: 'Patient gender',
          },
          patientConditions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Patient medical conditions',
          },
          patientMedications: {
            type: 'array',
            items: { type: 'string' },
            description: 'Patient current medications',
          }
        },
        required: ['trialId', 'patientAge', 'patientConditions'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        // Mock eligibility calculation
        const eligibilityScore = Math.floor(Math.random() * 100) + 1;
        
        let status = 'not_eligible';
        if (eligibilityScore >= 80) status = 'eligible';
        else if (eligibilityScore >= 60) status = 'potentially_eligible';

        return {
          trialId: input.trialId,
          eligibilityStatus: status,
          eligibilityScore,
          matchReasons: [
            'Meets age requirements',
            'Has qualifying medical condition',
            'Location within acceptable range'
          ],
          potentialIssues: eligibilityScore < 80 ? [
            'May need additional screening tests',
            'Some medications may need adjustment'
          ] : [],
          nextSteps: status === 'eligible' ? 
            'You appear to meet the basic eligibility criteria. The next step would be to contact the study team for detailed screening.' :
            'While you may not meet all criteria, it\'s worth discussing with the study team as requirements can sometimes be flexible.'
        };
      },
    }),

    tool({
      name: 'saveTrialForLater',
      description: 'Saves a trial to the patient\'s list for later review',
      parameters: {
        type: 'object',
        properties: {
          patientId: {
            type: 'string',
            description: 'Patient ID',
          },
          trialId: {
            type: 'string',
            description: 'Trial ID to save',
          },
          notes: {
            type: 'string',
            description: 'Optional notes about why this trial is interesting',
          }
        },
        required: ['patientId', 'trialId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        return {
          success: true,
          message: 'Trial saved to your list for later review.',
          savedTrialId: input.trialId,
        };
      },
    }),
  ],

  handoffs: [],
}); 
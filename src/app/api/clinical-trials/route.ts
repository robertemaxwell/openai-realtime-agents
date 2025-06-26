import { NextRequest, NextResponse } from 'next/server';
import { ClinicalTrial, PatientProfile, TrialMatch } from '@/app/types';

// Mock clinical trials database
const mockTrials: ClinicalTrial[] = [
  {
    id: 'trial_001',
    nctId: 'NCT12345678',
    title: 'Phase II Study of Novel Cancer Immunotherapy',
    briefSummary: 'Testing a new immunotherapy treatment for advanced solid tumors using CAR-T cell therapy.',
    detailedDescription: 'This randomized, double-blind, placebo-controlled study evaluates the safety and efficacy of a novel CAR-T cell therapy in patients with advanced solid tumors who have failed standard treatment options.',
    phase: 'Phase II',
    status: 'recruiting',
    condition: ['Cancer', 'Solid Tumor', 'Advanced Cancer', 'Oncology'],
    intervention: ['Immunotherapy', 'CAR-T Cell Therapy', 'Biological Therapy'],
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
      },
      {
        facility: 'Regional Cancer Center',
        city: 'Cambridge',
        state: 'Massachusetts',
        country: 'United States',
        contactName: 'Dr. Michael Roberts',
        contactPhone: '(617) 555-0456',
        contactEmail: 'trials@rcc.org'
      }
    ],
    eligibilityCriteria: {
      inclusionCriteria: [
        'Age 18 years or older',
        'Histologically confirmed solid tumor',
        'Progressive disease after standard therapy',
        'ECOG performance status 0-2',
        'Adequate organ function'
      ],
      exclusionCriteria: [
        'Active autoimmune disease',
        'Concurrent malignancy',
        'Severe cardiac dysfunction',
        'Active infection',
        'Pregnancy or nursing'
      ],
      minAge: '18',
      maxAge: '85',
      gender: 'all'
    },
    estimatedEnrollment: 50,
    studyStartDate: '2024-03-15',
    primaryCompletionDate: '2025-12-30',
    studyCompletionDate: '2026-06-30',
    url: 'https://clinicaltrials.gov/ct2/show/NCT12345678'
  },
  {
    id: 'trial_002',
    nctId: 'NCT87654321',
    title: 'Phase III Diabetes Management Study',
    briefSummary: 'Comparing new diabetes medication to standard treatment for improved glucose control.',
    detailedDescription: 'This large-scale study compares the effectiveness of a new diabetes medication versus standard metformin treatment in patients with Type 2 diabetes.',
    phase: 'Phase III',
    status: 'recruiting',
    condition: ['Type 2 Diabetes', 'Diabetes Mellitus', 'Metabolic Disorder'],
    intervention: ['Investigational Drug', 'Metformin', 'Lifestyle Intervention'],
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
      },
      {
        facility: 'Midwest Endocrine Clinic',
        city: 'Milwaukee',
        state: 'Wisconsin',
        country: 'United States',
        contactName: 'Dr. Lisa Thompson',
        contactPhone: '(414) 555-0789',
        contactEmail: 'research@midwestendo.com'
      }
    ],
    eligibilityCriteria: {
      inclusionCriteria: [
        'Type 2 Diabetes diagnosis',
        'HbA1c between 7-11%',
        'Age 25-75 years',
        'BMI 25-40 kg/m²',
        'Stable on current diabetes medication'
      ],
      exclusionCriteria: [
        'Type 1 Diabetes',
        'Severe kidney disease',
        'Recent heart attack',
        'Pregnancy',
        'Severe liver disease'
      ],
      minAge: '25',
      maxAge: '75',
      gender: 'all'
    },
    estimatedEnrollment: 200,
    studyStartDate: '2024-01-10',
    primaryCompletionDate: '2026-01-10',
    studyCompletionDate: '2026-07-10',
    url: 'https://clinicaltrials.gov/ct2/show/NCT87654321'
  },
  {
    id: 'trial_003',
    nctId: 'NCT11223344',
    title: 'Alzheimer\'s Disease Prevention Study',
    briefSummary: 'Evaluating a new drug for preventing cognitive decline in early Alzheimer\'s disease.',
    detailedDescription: 'This study examines whether a new medication can slow or prevent cognitive decline in patients with mild cognitive impairment who are at risk for Alzheimer\'s disease.',
    phase: 'Phase II',
    status: 'recruiting',
    condition: ['Alzheimer\'s Disease', 'Mild Cognitive Impairment', 'Dementia', 'Neurodegenerative Disease'],
    intervention: ['Investigational Drug', 'Cognitive Training', 'Lifestyle Intervention'],
    sponsor: 'National Institute on Aging',
    location: [
      {
        facility: 'Memory Care Institute',
        city: 'San Francisco',
        state: 'California',
        country: 'United States',
        contactName: 'Dr. Jennifer Kim',
        contactPhone: '(415) 555-0123',
        contactEmail: 'memory.trials@mci.org'
      },
      {
        facility: 'Neurological Research Center',
        city: 'Los Angeles',
        state: 'California',
        country: 'United States',
        contactName: 'Dr. Robert Martinez',
        contactPhone: '(310) 555-0456',
        contactEmail: 'neuro.research@nrc.edu'
      }
    ],
    eligibilityCriteria: {
      inclusionCriteria: [
        'Age 55-85 years',
        'Mild cognitive impairment diagnosis',
        'Positive amyloid PET scan',
        'Stable on current medications',
        'Study partner available'
      ],
      exclusionCriteria: [
        'Dementia diagnosis',
        'Significant psychiatric illness',
        'Recent stroke',
        'Substance abuse',
        'Inability to undergo MRI'
      ],
      minAge: '55',
      maxAge: '85',
      gender: 'all'
    },
    estimatedEnrollment: 150,
    studyStartDate: '2024-02-01',
    primaryCompletionDate: '2027-02-01',
    studyCompletionDate: '2027-08-01',
    url: 'https://clinicaltrials.gov/ct2/show/NCT11223344'
  },
  {
    id: 'trial_004',
    nctId: 'NCT55667788',
    title: 'Heart Failure Treatment Innovation Study',
    briefSummary: 'Testing a new device-based therapy for patients with heart failure.',
    detailedDescription: 'This study evaluates the safety and effectiveness of a new implantable device designed to improve heart function in patients with chronic heart failure.',
    phase: 'Phase III',
    status: 'recruiting',
    condition: ['Heart Failure', 'Cardiovascular Disease', 'Chronic Heart Failure'],
    intervention: ['Medical Device', 'Implantable Device', 'Standard Care'],
    sponsor: 'CardioTech Medical',
    location: [
      {
        facility: 'Heart Institute of Texas',
        city: 'Houston',
        state: 'Texas',
        country: 'United States',
        contactName: 'Dr. Patricia Williams',
        contactPhone: '(713) 555-0123',
        contactEmail: 'heart.trials@hit.org'
      },
      {
        facility: 'Cardiac Care Center',
        city: 'Dallas',
        state: 'Texas',
        country: 'United States',
        contactName: 'Dr. James Anderson',
        contactPhone: '(214) 555-0456',
        contactEmail: 'cardiac.research@ccc.com'
      }
    ],
    eligibilityCriteria: {
      inclusionCriteria: [
        'Age 18-80 years',
        'Chronic heart failure diagnosis',
        'NYHA Class II-III symptoms',
        'Ejection fraction 35% or less',
        'Stable on optimal medical therapy'
      ],
      exclusionCriteria: [
        'Recent heart attack',
        'Planned cardiac surgery',
        'Severe kidney disease',
        'Life expectancy less than 1 year',
        'Pregnancy'
      ],
      minAge: '18',
      maxAge: '80',
      gender: 'all'
    },
    estimatedEnrollment: 300,
    studyStartDate: '2024-04-01',
    primaryCompletionDate: '2026-04-01',
    studyCompletionDate: '2026-10-01',
    url: 'https://clinicaltrials.gov/ct2/show/NCT55667788'
  }
];

// Function to calculate trial match score
function calculateMatchScore(trial: ClinicalTrial, patientProfile: PatientProfile): TrialMatch {
  let score = 0;
  const matchReasons: string[] = [];
  const eligibilityNotes: string[] = [];

  // Check condition match
  const conditionMatch = patientProfile.conditions.some(condition =>
    trial.condition.some(trialCondition =>
      trialCondition.toLowerCase().includes(condition.toLowerCase()) ||
      condition.toLowerCase().includes(trialCondition.toLowerCase())
    )
  );

  if (conditionMatch) {
    score += 40;
    matchReasons.push('Medical condition matches trial criteria');
  }

  // Check age eligibility
  const minAge = trial.eligibilityCriteria.minAge ? parseInt(trial.eligibilityCriteria.minAge) : 0;
  const maxAge = trial.eligibilityCriteria.maxAge ? parseInt(trial.eligibilityCriteria.maxAge) : 999;
  
  if (patientProfile.age >= minAge && patientProfile.age <= maxAge) {
    score += 20;
    matchReasons.push('Age meets trial requirements');
  } else {
    eligibilityNotes.push(`Age requirement: ${minAge}-${maxAge} years`);
  }

  // Check gender eligibility
  if (trial.eligibilityCriteria.gender === 'all' || 
      trial.eligibilityCriteria.gender === patientProfile.gender) {
    score += 10;
    matchReasons.push('Gender matches trial criteria');
  } else {
    eligibilityNotes.push(`Gender requirement: ${trial.eligibilityCriteria.gender}`);
  }

  // Check location proximity (simplified)
  const locationMatch = trial.location.some(loc =>
    loc.state.toLowerCase() === patientProfile.location.state.toLowerCase()
  );

  if (locationMatch) {
    score += 20;
    matchReasons.push('Trial location within preferred area');
  }

  // Check phase preference
  if (patientProfile.preferences.phasePreference && 
      patientProfile.preferences.phasePreference.includes(trial.phase)) {
    score += 10;
    matchReasons.push('Trial phase matches patient preference');
  }

  // Determine eligibility status
  let eligibilityStatus: 'eligible' | 'potentially_eligible' | 'not_eligible' = 'not_eligible';
  if (score >= 80) {
    eligibilityStatus = 'eligible';
  } else if (score >= 50) {
    eligibilityStatus = 'potentially_eligible';
  }

  return {
    trial,
    matchScore: score,
    matchReasons,
    eligibilityStatus,
    eligibilityNotes
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'search':
        const condition = searchParams.get('condition');
        const location = searchParams.get('location');
        const phase = searchParams.get('phase');
        const status = searchParams.get('status') || 'recruiting';

        let filteredTrials = mockTrials;

        // Filter by condition
        if (condition) {
          filteredTrials = filteredTrials.filter(trial =>
            trial.condition.some(c => 
              c.toLowerCase().includes(condition.toLowerCase())
            )
          );
        }

        // Filter by location
        if (location) {
          filteredTrials = filteredTrials.filter(trial =>
            trial.location.some(loc =>
              loc.city.toLowerCase().includes(location.toLowerCase()) ||
              loc.state.toLowerCase().includes(location.toLowerCase())
            )
          );
        }

        // Filter by phase
        if (phase) {
          filteredTrials = filteredTrials.filter(trial =>
            trial.phase.toLowerCase().includes(phase.toLowerCase())
          );
        }

        // Filter by status
        if (status !== 'all') {
          filteredTrials = filteredTrials.filter(trial =>
            trial.status === status
          );
        }

        return NextResponse.json({
          success: true,
          trials: filteredTrials,
          totalCount: filteredTrials.length
        });

      case 'detail':
        const trialId = searchParams.get('id');
        const trial = mockTrials.find(t => t.id === trialId);
        
        if (!trial) {
          return NextResponse.json({
            success: false,
            error: 'Trial not found'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          trial
        });

      case 'match':
        // This would typically receive a patient profile and return matched trials
        const mockPatientProfile: PatientProfile = {
          id: 'patient_001',
          age: 65,
          gender: 'male',
          conditions: ['Type 2 Diabetes'],
          medications: ['Metformin'],
          allergies: [],
          medicalHistory: ['Hypertension'],
          location: {
            city: 'Chicago',
            state: 'Illinois',
            country: 'United States'
          },
          preferences: {
            maxDistance: 50,
            travelWillingness: 'regional',
            phasePreference: ['Phase III']
          }
        };

        const matches = mockTrials.map(trial => 
          calculateMatchScore(trial, mockPatientProfile)
        ).sort((a, b) => b.matchScore - a.matchScore);

        return NextResponse.json({
          success: true,
          matches: matches.slice(0, 10), // Return top 10 matches
          totalMatches: matches.length
        });

      default:
        return NextResponse.json({
          success: true,
          trials: mockTrials,
          totalCount: mockTrials.length
        });
    }
  } catch (error) {
    console.error('Clinical trials API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'apply':
        const { patientId, trialId, contactPreference } = body;
        
        // Mock application submission
        const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return NextResponse.json({
          success: true,
          applicationId,
          message: 'Application submitted successfully',
          status: 'submitted'
        });

      case 'save':
        const { patientId: savePatientId, trialId: saveTrialId, notes } = body;
        
        return NextResponse.json({
          success: true,
          message: 'Trial saved successfully',
          savedTrialId: saveTrialId
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Clinical trials POST API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 
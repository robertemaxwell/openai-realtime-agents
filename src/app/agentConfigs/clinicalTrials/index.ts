import { patientIntakeAgent } from './patientIntake';
import { trialSearchAgent } from './trialSearch';
import { enrollmentAgent } from './enrollment';
import { supportAgent } from './support';

// Set up handoffs between clinical trial agents
(patientIntakeAgent.handoffs as any).push(trialSearchAgent, supportAgent);
(trialSearchAgent.handoffs as any).push(patientIntakeAgent, enrollmentAgent, supportAgent);
(enrollmentAgent.handoffs as any).push(trialSearchAgent, supportAgent);
(supportAgent.handoffs as any).push(patientIntakeAgent, trialSearchAgent, enrollmentAgent);

export const clinicalTrialsScenario = [
  patientIntakeAgent,
  trialSearchAgent,
  enrollmentAgent,
  supportAgent,
];

// Name of the organization represented by this agent set
export const clinicalTrialsCompanyName = 'MedConnect Clinical Trials Platform'; 
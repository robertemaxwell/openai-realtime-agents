import React from 'react';
import { ClinicalTrial, TrialMatch } from '@/app/types';

interface ClinicalTrialCardProps {
  trial: ClinicalTrial;
  matchInfo?: Omit<TrialMatch, 'trial'>;
  onApply?: (trialId: string) => void;
  onSave?: (trialId: string) => void;
  onViewDetails?: (trialId: string) => void;
}

const ClinicalTrialCard: React.FC<ClinicalTrialCardProps> = ({
  trial,
  matchInfo,
  onApply,
  onSave,
  onViewDetails
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseColor = (phase: string) => {
    if (phase.includes('I')) return 'bg-orange-100 text-orange-800';
    if (phase.includes('II')) return 'bg-blue-100 text-blue-800';
    if (phase.includes('III')) return 'bg-purple-100 text-purple-800';
    if (phase.includes('IV')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getEligibilityColor = (status?: string) => {
    switch (status) {
      case 'eligible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'potentially_eligible':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_eligible':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-4 hover:shadow-xl transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {trial.title}
          </h3>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-600 font-medium">
              {trial.nctId}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trial.status)}`}>
              {trial.status.charAt(0).toUpperCase() + trial.status.slice(1)}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPhaseColor(trial.phase)}`}>
              {trial.phase}
            </span>
          </div>
        </div>
        
        {matchInfo && (
          <div className={`ml-4 px-3 py-2 rounded-lg border ${getEligibilityColor(matchInfo.eligibilityStatus)}`}>
            <div className="text-sm font-medium">
              Match Score: {matchInfo.matchScore}%
            </div>
            <div className="text-xs">
              {matchInfo.eligibilityStatus.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <p className="text-gray-700 mb-4 line-clamp-3">
        {trial.briefSummary}
      </p>

      {/* Conditions and Interventions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Conditions</h4>
          <div className="flex flex-wrap gap-1">
            {trial.condition.slice(0, 3).map((condition, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700"
              >
                {condition}
              </span>
            ))}
            {trial.condition.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-50 text-gray-500">
                +{trial.condition.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Interventions</h4>
          <div className="flex flex-wrap gap-1">
            {trial.intervention.slice(0, 2).map((intervention, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700"
              >
                {intervention}
              </span>
            ))}
            {trial.intervention.length > 2 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-50 text-gray-500">
                +{trial.intervention.length - 2} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Location and Sponsor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
        <div>
          <span className="font-medium">Locations:</span>{' '}
          {trial.location.slice(0, 2).map((loc, index) => (
            <span key={index}>
              {loc.city}, {loc.state}
              {index < Math.min(trial.location.length - 1, 1) ? '; ' : ''}
            </span>
          ))}
          {trial.location.length > 2 && ` (+${trial.location.length - 2} more)`}
        </div>
        <div>
          <span className="font-medium">Sponsor:</span> {trial.sponsor}
        </div>
      </div>

      {/* Eligibility Highlights */}
      {trial.eligibilityCriteria && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Eligibility</h4>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Age:</span> {trial.eligibilityCriteria.minAge || '18'}-{trial.eligibilityCriteria.maxAge || '85'} years
            {trial.eligibilityCriteria.gender !== 'all' && (
              <>
                <span className="mx-2">•</span>
                <span className="font-medium">Gender:</span> {trial.eligibilityCriteria.gender}
              </>
            )}
            <span className="mx-2">•</span>
            <span className="font-medium">Enrollment:</span> {trial.estimatedEnrollment} participants
          </div>
        </div>
      )}

      {/* Match Information */}
      {matchInfo && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Why This Trial Matches</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {matchInfo.matchReasons.map((reason, index) => (
              <li key={index} className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {reason}
              </li>
            ))}
          </ul>
          {matchInfo.eligibilityNotes.length > 0 && (
            <div className="mt-2 pt-2 border-t border-blue-200">
              <div className="text-xs text-blue-700">
                <span className="font-medium">Note:</span> {matchInfo.eligibilityNotes.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex space-x-3">
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(trial.id)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View Details
            </button>
          )}
          {trial.url && (
            <a
              href={trial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ClinicalTrials.gov ↗
            </a>
          )}
        </div>
        
        <div className="flex space-x-2">
          {onSave && (
            <button
              onClick={() => onSave(trial.id)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save for Later
            </button>
          )}
          {onApply && trial.status === 'recruiting' && (
            <button
              onClick={() => onApply(trial.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicalTrialCard; 
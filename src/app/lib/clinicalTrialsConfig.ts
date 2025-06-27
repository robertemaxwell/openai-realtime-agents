// Configuration for ClinicalTrials.gov API Integration
export const CLINICAL_TRIALS_CONFIG = {
  // API Endpoints
  API_BASE_URL: 'https://clinicaltrials.gov/api/v2',
  
  // Rate Limiting
  RATE_LIMIT_DELAY: 200, // 200ms between requests
  MAX_REQUESTS_PER_MINUTE: 240, // Conservative limit
  
  // Caching
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  DETAIL_CACHE_TTL: 10 * 60 * 1000, // 10 minutes for detailed data
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Search Parameters
  SEARCH_DEFAULTS: {
    format: 'json',
    pageSize: 20,
    fields: [
      'NCTId',
      'BriefTitle',
      'Condition',
      'InterventionName',
      'Phase',
      'StudyType',
      'OverallStatus',
      'StartDate',
      'PrimaryCompletionDate',
      'EnrollmentCount',
      'BriefSummary',
      'DetailedDescription',
      'EligibilityCriteria',
      'Gender',
      'MinimumAge',
      'MaximumAge',
      'LeadSponsorName',
      'LocationFacility',
      'LocationCity',
      'LocationState',
      'LocationCountry',
      'LocationContactName',
      'LocationContactPhone',
      'LocationContactEmail'
    ].join(',')
  },
  
  // Status Mappings
  STATUS_MAPPING: {
    'RECRUITING': 'recruiting',
    'NOT_YET_RECRUITING': 'recruiting',
    'ACTIVE_NOT_RECRUITING': 'active',
    'COMPLETED': 'completed',
    'SUSPENDED': 'suspended',
    'TERMINATED': 'terminated',
    'WITHDRAWN': 'terminated',
    'UNKNOWN': 'suspended'
  } as const,
  
  // Phase Mappings for API queries
  PHASE_MAPPING: {
    'Phase I': 'PHASE1',
    'Phase II': 'PHASE2',
    'Phase III': 'PHASE3',
    'Phase IV': 'PHASE4',
    'Early Phase 1': 'EARLY_PHASE1',
    'Not Applicable': 'NA'
  } as const,
  
  // Gender Mappings
  GENDER_MAPPING: {
    'MALE': 'male',
    'FEMALE': 'female',
    'ALL': 'all'
  } as const,
  
  // Common Medical Conditions for Search Optimization
  COMMON_CONDITIONS: [
    'Cancer',
    'Diabetes',
    'Heart Disease',
    'Alzheimer\'s Disease',
    'Parkinson\'s Disease',
    'Multiple Sclerosis',
    'Rheumatoid Arthritis',
    'Crohn\'s Disease',
    'Depression',
    'Anxiety',
    'Asthma',
    'COPD',
    'Hypertension',
    'High Blood Pressure',
    'Stroke',
    'Kidney Disease',
    'Liver Disease',
    'Obesity',
    'Osteoporosis',
    'Migraine'
  ],
  
  // Error Messages
  ERROR_MESSAGES: {
    API_UNAVAILABLE: 'ClinicalTrials.gov API is currently unavailable. Please try again later.',
    RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment before searching again.',
    INVALID_PARAMETERS: 'Invalid search parameters provided.',
    TRIAL_NOT_FOUND: 'The requested clinical trial was not found.',
    NETWORK_ERROR: 'Network error occurred while fetching data.',
    PARSE_ERROR: 'Error parsing API response data.'
  },
  
  // Fallback Configuration
  FALLBACK: {
    ENABLED: true,
    USE_MOCK_DATA: true,
    MOCK_DELAY: 500 // Simulate network delay for mock data
  }
};

// Environment-specific configuration
export const getApiConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...CLINICAL_TRIALS_CONFIG,
    // Enable more aggressive caching in production
    CACHE_TTL: isProduction ? 10 * 60 * 1000 : CLINICAL_TRIALS_CONFIG.CACHE_TTL,
    // Slower rate limiting in development for debugging
    RATE_LIMIT_DELAY: isDevelopment ? 500 : CLINICAL_TRIALS_CONFIG.RATE_LIMIT_DELAY,
    // Enable fallback in development, optional in production
    FALLBACK: {
      ...CLINICAL_TRIALS_CONFIG.FALLBACK,
      ENABLED: isDevelopment ? true : (process.env.ENABLE_FALLBACK === 'true')
    }
  };
};

// Helper function to build search query
export const buildSearchQuery = (params: {
  condition?: string;
  location?: string;
  phase?: string;
  status?: string;
  ageRange?: { min?: number; max?: number };
  gender?: string;
}): string => {
  const filters: string[] = [];
  
  if (params.condition) {
    filters.push(`AREA[ConditionSearch]${params.condition}`);
  }
  
  if (params.location) {
    filters.push(`AREA[LocationSearch]${params.location}`);
  }
  
  if (params.phase && CLINICAL_TRIALS_CONFIG.PHASE_MAPPING[params.phase as keyof typeof CLINICAL_TRIALS_CONFIG.PHASE_MAPPING]) {
    const mappedPhase = CLINICAL_TRIALS_CONFIG.PHASE_MAPPING[params.phase as keyof typeof CLINICAL_TRIALS_CONFIG.PHASE_MAPPING];
    filters.push(`AREA[Phase]${mappedPhase}`);
  }
  
  if (params.status === 'recruiting') {
    filters.push('AREA[RecruitmentStatus]RECRUITING');
  } else if (params.status === 'active') {
    filters.push('AREA[RecruitmentStatus]ACTIVE_NOT_RECRUITING');
  }
  
  if (params.ageRange?.min) {
    filters.push(`AREA[MinimumAge]RANGE[${params.ageRange.min}]`);
  }
  
  if (params.ageRange?.max) {
    filters.push(`AREA[MaximumAge]RANGE[${params.ageRange.max}]`);
  }
  
  if (params.gender && params.gender !== 'all') {
    filters.push(`AREA[Gender]${params.gender.toUpperCase()}`);
  }
  
  return filters.join(' AND ');
};

export default CLINICAL_TRIALS_CONFIG; 
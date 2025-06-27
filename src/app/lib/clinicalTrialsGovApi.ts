import { ClinicalTrial } from '@/app/types';

// ClinicalTrials.gov API configuration
const CT_GOV_API_BASE = 'https://clinicaltrials.gov/api/v2';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 200; // 200ms between requests
let lastRequestTime = 0;

// Cache configuration
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting helper
async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fetch(url, options);
}

// Cache helper functions
function getCachedData(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < entry.ttl) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: any, ttl: number = CACHE_TTL): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

// ClinicalTrials.gov API response interfaces
interface CTGovStudy {
  protocolSection: {
    identificationModule: {
      nctId: string;
      briefTitle: string;
      officialTitle?: string;
    };
    statusModule: {
      overallStatus: string;
      studyFirstSubmitDate?: string;
      studyFirstPostDate?: string;
      lastUpdateSubmitDate?: string;
    };
    sponsorCollaboratorsModule: {
      leadSponsor: {
        name: string;
        class?: string;
      };
    };
    descriptionModule?: {
      briefSummary?: string;
      detailedDescription?: string;
    };
    conditionsModule?: {
      conditions: string[];
    };
    designModule?: {
      studyType: string;
      phases?: string[];
      enrollmentInfo?: {
        count: number;
        type: string;
      };
    };
    armsInterventionsModule?: {
      interventions?: Array<{
        type: string;
        name: string;
      }>;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      sex: string;
      minimumAge?: string;
      maximumAge?: string;
    };
    contactsLocationsModule?: {
      locations?: Array<{
        facility?: string;
        city?: string;
        state?: string;
        country?: string;
        contacts?: Array<{
          name?: string;
          phone?: string;
          email?: string;
        }>;
      }>;
    };
  };
}

interface CTGovSearchResponse {
  studies: CTGovStudy[];
  totalCount: number;
  nextPageToken?: string;
}

// Helper functions to transform ClinicalTrials.gov data to our format
function transformCTGovStudyToClinicalTrial(ctGovStudy: CTGovStudy): ClinicalTrial {
  const protocolSection = ctGovStudy.protocolSection;
  
  // Extract basic information
  const nctId = protocolSection.identificationModule.nctId;
  const title = protocolSection.identificationModule.briefTitle;
  const briefSummary = protocolSection.descriptionModule?.briefSummary || '';
  const detailedDescription = protocolSection.descriptionModule?.detailedDescription;
  
  // Transform status
  const status = transformStatus(protocolSection.statusModule.overallStatus);
  
  // Extract phase information
  const phases = protocolSection.designModule?.phases || [];
  const phase = phases.length > 0 ? phases.join(', ') : 'Not Applicable';
  
  // Extract conditions
  const conditions = protocolSection.conditionsModule?.conditions || [];
  
  // Extract interventions
  const interventions = protocolSection.armsInterventionsModule?.interventions?.map(i => i.name) || [];
  
  // Extract sponsor
  const sponsor = protocolSection.sponsorCollaboratorsModule.leadSponsor.name;
  
  // Extract locations
  const locations = (protocolSection.contactsLocationsModule?.locations || []).map(loc => ({
    facility: loc.facility || 'Not specified',
    city: loc.city || '',
    state: loc.state || '',
    country: loc.country || '',
    contactName: loc.contacts?.[0]?.name,
    contactPhone: loc.contacts?.[0]?.phone,
    contactEmail: loc.contacts?.[0]?.email
  }));
  
  // Extract eligibility criteria
  const eligibilityText = protocolSection.eligibilityModule?.eligibilityCriteria || '';
  const eligibilityCriteria = parseEligibilityCriteria(eligibilityText);
  
  // Add gender information
  const gender = transformGender(protocolSection.eligibilityModule?.sex || 'ALL');
  eligibilityCriteria.gender = gender;
  eligibilityCriteria.minAge = protocolSection.eligibilityModule?.minimumAge;
  eligibilityCriteria.maxAge = protocolSection.eligibilityModule?.maximumAge;
  
  // Extract enrollment
  const estimatedEnrollment = protocolSection.designModule?.enrollmentInfo?.count || 0;
  
  // Extract dates
  const studyStartDate = protocolSection.statusModule.studyFirstPostDate;
  
  return {
    id: nctId,
    nctId,
    title,
    briefSummary,
    detailedDescription,
    phase,
    status,
    condition: conditions,
    intervention: interventions,
    sponsor,
    location: locations,
    eligibilityCriteria,
    estimatedEnrollment,
    studyStartDate,
    url: `https://clinicaltrials.gov/study/${nctId}`
  };
}

function transformStatus(ctGovStatus: string): ClinicalTrial['status'] {
  const statusMap: Record<string, ClinicalTrial['status']> = {
    'RECRUITING': 'recruiting',
    'NOT_YET_RECRUITING': 'recruiting',
    'ACTIVE_NOT_RECRUITING': 'active',
    'COMPLETED': 'completed',
    'SUSPENDED': 'suspended',
    'TERMINATED': 'terminated',
    'WITHDRAWN': 'terminated',
    'UNKNOWN': 'suspended'
  };
  
  return statusMap[ctGovStatus] || 'suspended';
}

function transformGender(ctGovSex: string): 'all' | 'male' | 'female' {
  switch (ctGovSex.toUpperCase()) {
    case 'MALE': return 'male';
    case 'FEMALE': return 'female';
    default: return 'all';
  }
}

function parseEligibilityCriteria(eligibilityText: string) {
  // Simple parser for eligibility criteria
  const inclusionSection = eligibilityText.match(/Inclusion Criteria:([\s\S]*?)(?=Exclusion Criteria:|$)/);
  const exclusionSection = eligibilityText.match(/Exclusion Criteria:([\s\S]*)$/);
  
  const parseSection = (text: string): string[] => {
    if (!text) return [];
    return text
      .split(/\n|\d+\./)
      .map(item => item.trim())
      .filter(item => item.length > 10)
      .slice(0, 10);
  };
  
  return {
    inclusionCriteria: parseSection(inclusionSection?.[1] || ''),
    exclusionCriteria: parseSection(exclusionSection?.[1] || ''),
    minAge: undefined as string | undefined,
    maxAge: undefined as string | undefined,
    gender: 'all' as 'all' | 'male' | 'female'
  };
}

// Main API class
export class ClinicalTrialsGovAPI {
  
  static async searchTrials(params: {
    condition?: string;
    location?: string;
    phase?: string;
    status?: string;
    pageSize?: number;
    pageToken?: string;
  }): Promise<{ trials: ClinicalTrial[]; totalCount: number; nextPageToken?: string }> {
    
    const cacheKey = `search_${JSON.stringify(params)}`;
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Build query parameters for ClinicalTrials.gov API v2
      const queryParams = new URLSearchParams();
      
      // Add query parameters using correct API v2 format
      if (params.condition) {
        queryParams.append('query.cond', params.condition);
      }
      
      if (params.location) {
        queryParams.append('query.locn', params.location);
      }
      
      if (params.phase) {
        // Map phase values to simple strings
        const phaseMap: Record<string, string> = {
          'Phase I': 'PHASE1',
          'Phase II': 'PHASE2', 
          'Phase III': 'PHASE3',
          'Phase IV': 'PHASE4'
        };
        const phaseValue = phaseMap[params.phase];
        if (phaseValue) {
          queryParams.append('filter.studyType', 'INTERVENTIONAL');
          queryParams.append('filter.phase', phaseValue);
        }
      }
      
      if (params.status === 'recruiting') {
        queryParams.append('filter.overallStatus', 'RECRUITING');
      } else if (params.status === 'active') {
        queryParams.append('filter.overallStatus', 'ACTIVE_NOT_RECRUITING');
      }
      
      // Set page size
      queryParams.append('pageSize', (params.pageSize || 20).toString());
      
      // Add page token if provided
      if (params.pageToken) {
        queryParams.append('pageToken', params.pageToken);
      }
      
      // Request full study details
      queryParams.append('format', 'json');
      
      const url = `${CT_GOV_API_BASE}/studies?${queryParams.toString()}`;
      console.log('Fetching from ClinicalTrials.gov:', url);
      
      const response = await rateLimitedFetch(url);
      
      if (!response.ok) {
        throw new Error(`ClinicalTrials.gov API error: ${response.status} ${response.statusText}`);
      }
      
      const data: CTGovSearchResponse = await response.json();
      
      // Transform the data to our format
      const trials = data.studies.map(transformCTGovStudyToClinicalTrial);
      
      const result = {
        trials,
        totalCount: data.totalCount,
        nextPageToken: data.nextPageToken
      };
      
      // Cache the result
      setCachedData(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('Error fetching from ClinicalTrials.gov:', error);
      throw new Error(`Failed to search clinical trials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  static async getTrialDetail(nctId: string): Promise<ClinicalTrial | null> {
    const cacheKey = `detail_${nctId}`;
    const cachedResult = getCachedData(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      const url = `${CT_GOV_API_BASE}/studies/${nctId}`;
      
      const response = await rateLimitedFetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`ClinicalTrials.gov API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.studies || data.studies.length === 0) {
        return null;
      }
      
      const trial = transformCTGovStudyToClinicalTrial(data.studies[0]);
      
      // Cache the result for longer since detailed data changes less frequently
      setCachedData(cacheKey, trial, CACHE_TTL * 2);
      
      return trial;
      
    } catch (error) {
      console.error(`Error fetching trial detail for ${nctId}:`, error);
      throw new Error(`Failed to get trial details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  static async getTrialsByConditions(conditions: string[], location?: string): Promise<ClinicalTrial[]> {
    const allTrials: ClinicalTrial[] = [];
    
    for (const condition of conditions) {
      try {
        const result = await this.searchTrials({
          condition,
          location,
          status: 'recruiting',
          pageSize: 50
        });
        
        for (const trial of result.trials) {
          if (!allTrials.find(t => t.nctId === trial.nctId)) {
            allTrials.push(trial);
          }
        }
      } catch (error) {
        console.warn(`Failed to search for condition "${condition}":`, error);
      }
    }
    
    return allTrials;
  }
  
  static clearCache(): void {
    cache.clear();
  }
}

export default ClinicalTrialsGovAPI; 
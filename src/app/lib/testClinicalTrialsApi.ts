import { ClinicalTrialsGovAPI } from './clinicalTrialsGovApi';
import { CLINICAL_TRIALS_CONFIG } from './clinicalTrialsConfig';

/**
 * Test script for ClinicalTrials.gov API integration
 * This can be run to verify the API connection and data transformation
 */

interface TestResult {
  test: string;
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

class ClinicalTrialsAPITester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting ClinicalTrials.gov API Integration Tests...\n');
    
    // Test 1: Basic search functionality
    await this.testBasicSearch();
    
    // Test 2: Condition-based search
    await this.testConditionSearch();
    
    // Test 3: Location-based search
    await this.testLocationSearch();
    
    // Test 4: Phase-based search
    await this.testPhaseSearch();
    
    // Test 5: Trial detail retrieval
    await this.testTrialDetail();
    
    // Test 6: Multi-condition search
    await this.testMultiConditionSearch();
    
    // Test 7: Rate limiting behavior
    await this.testRateLimiting();
    
    // Test 8: Cache functionality
    await this.testCaching();
    
    this.printResults();
    return this.results;
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📋 Running: ${testName}...`);
      const data = await testFn();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        test: testName,
        success: true,
        data,
        duration
      };
      
      console.log(`✅ ${testName} - Completed in ${duration}ms`);
      this.results.push(result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        test: testName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
      
      console.log(`❌ ${testName} - Failed in ${duration}ms: ${result.error}`);
      this.results.push(result);
      return result;
    }
  }

  private async testBasicSearch(): Promise<void> {
    await this.runTest('Basic Search', async () => {
      const result = await ClinicalTrialsGovAPI.searchTrials({
        pageSize: 5
      });
      
      if (!result.trials || result.trials.length === 0) {
        throw new Error('No trials returned from basic search');
      }
      
      // Verify data structure
      const trial = result.trials[0];
      const requiredFields = ['id', 'nctId', 'title', 'status'];
      for (const field of requiredFields) {
        if (!(field in trial)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      return {
        trialsFound: result.trials.length,
        totalCount: result.totalCount,
        firstTrialId: trial.nctId
      };
    });
  }

  private async testConditionSearch(): Promise<void> {
    await this.runTest('Condition-based Search', async () => {
      const result = await ClinicalTrialsGovAPI.searchTrials({
        condition: 'diabetes',
        pageSize: 10
      });
      
      if (!result.trials || result.trials.length === 0) {
        throw new Error('No diabetes trials found');
      }
      
      // Verify that trials contain diabetes-related conditions
      const hasRelevantCondition = result.trials.some(trial => 
        trial.condition.some(condition => 
          condition.toLowerCase().includes('diabetes')
        )
      );
      
      if (!hasRelevantCondition) {
        console.warn('⚠️  No trials explicitly mention diabetes in conditions');
      }
      
      return {
        trialsFound: result.trials.length,
        totalCount: result.totalCount,
        relevantTrials: result.trials.filter(trial => 
          trial.condition.some(condition => 
            condition.toLowerCase().includes('diabetes')
          )
        ).length
      };
    });
  }

  private async testLocationSearch(): Promise<void> {
    await this.runTest('Location-based Search', async () => {
      const result = await ClinicalTrialsGovAPI.searchTrials({
        location: 'California',
        pageSize: 10
      });
      
      if (!result.trials || result.trials.length === 0) {
        throw new Error('No trials found in California');
      }
      
      // Verify that trials have California locations
      const hasCaliforniaLocation = result.trials.some(trial => 
        trial.location.some(loc => 
          loc.state?.toLowerCase().includes('california') ||
          loc.city?.toLowerCase().includes('california')
        )
      );
      
      if (!hasCaliforniaLocation) {
        console.warn('⚠️  No trials explicitly show California locations');
      }
      
      return {
        trialsFound: result.trials.length,
        totalCount: result.totalCount,
        californiaTrials: result.trials.filter(trial => 
          trial.location.some(loc => 
            loc.state?.toLowerCase().includes('california')
          )
        ).length
      };
    });
  }

  private async testPhaseSearch(): Promise<void> {
    await this.runTest('Phase-based Search', async () => {
      const result = await ClinicalTrialsGovAPI.searchTrials({
        phase: 'Phase II',
        pageSize: 10
      });
      
      if (!result.trials || result.trials.length === 0) {
        throw new Error('No Phase II trials found');
      }
      
      // Verify phase information
      const phase2Trials = result.trials.filter(trial => 
        trial.phase.toLowerCase().includes('phase ii') ||
        trial.phase.toLowerCase().includes('phase 2')
      );
      
      return {
        trialsFound: result.trials.length,
        totalCount: result.totalCount,
        phase2Trials: phase2Trials.length
      };
    });
  }

  private async testTrialDetail(): Promise<void> {
    await this.runTest('Trial Detail Retrieval', async () => {
      // First get a trial from search
      const searchResult = await ClinicalTrialsGovAPI.searchTrials({
        pageSize: 1
      });
      
      if (!searchResult.trials || searchResult.trials.length === 0) {
        throw new Error('No trials available for detail test');
      }
      
      const trialId = searchResult.trials[0].nctId;
      const detail = await ClinicalTrialsGovAPI.getTrialDetail(trialId);
      
      if (!detail) {
        throw new Error(`Trial detail not found for ${trialId}`);
      }
      
      // Verify detail has more information than search result
      return {
        trialId: detail.nctId,
        title: detail.title,
        hasDescription: !!detail.detailedDescription,
        locationCount: detail.location.length
      };
    });
  }

  private async testMultiConditionSearch(): Promise<void> {
    await this.runTest('Multi-condition Search', async () => {
      const conditions = ['cancer', 'diabetes'];
      const trials = await ClinicalTrialsGovAPI.getTrialsByConditions(conditions);
      
      if (!trials || trials.length === 0) {
        throw new Error('No trials found for multiple conditions');
      }
      
      // Verify we get diverse results
      const cancerTrials = trials.filter(trial => 
        trial.condition.some(condition => 
          condition.toLowerCase().includes('cancer')
        )
      );
      
      const diabetesTrials = trials.filter(trial => 
        trial.condition.some(condition => 
          condition.toLowerCase().includes('diabetes')
        )
      );
      
      return {
        totalTrials: trials.length,
        cancerTrials: cancerTrials.length,
        diabetesTrials: diabetesTrials.length,
        uniqueTrials: new Set(trials.map(t => t.nctId)).size
      };
    });
  }

  private async testRateLimiting(): Promise<void> {
    await this.runTest('Rate Limiting', async () => {
      const startTime = Date.now();
      
      // Make multiple rapid requests
      const promises = Array.from({ length: 3 }, (_, i) => 
        ClinicalTrialsGovAPI.searchTrials({
          condition: `test${i}`,
          pageSize: 1
        })
      );
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      // Should take at least 400ms due to rate limiting (2 * 200ms delay)
      const expectedMinDuration = 2 * CLINICAL_TRIALS_CONFIG.RATE_LIMIT_DELAY;
      
      return {
        duration,
        expectedMinDuration,
        rateLimitingWorking: duration >= expectedMinDuration
      };
    });
  }

  private async testCaching(): Promise<void> {
    await this.runTest('Cache Functionality', async () => {
      const searchParams = {
        condition: 'hypertension',
        pageSize: 5
      };
      
      // First request (should hit API)
      const start1 = Date.now();
      const result1 = await ClinicalTrialsGovAPI.searchTrials(searchParams);
      const duration1 = Date.now() - start1;
      
      // Second request (should hit cache)
      const start2 = Date.now();
      const result2 = await ClinicalTrialsGovAPI.searchTrials(searchParams);
      const duration2 = Date.now() - start2;
      
      // Clear cache for cleanliness
      ClinicalTrialsGovAPI.clearCache();
      
      return {
        firstRequestDuration: duration1,
        secondRequestDuration: duration2,
        cacheHit: duration2 < duration1,
        resultConsistency: result1.totalCount === result2.totalCount
      };
    });
  }

  private printResults(): void {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${total - passed}/${total}`);
    
    if (total - passed > 0) {
      console.log('\n🔍 Failed Tests:');
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.test}: ${result.error}`);
      });
    }
    
    console.log('\n⏱️  Performance Summary:');
    this.results.forEach(result => {
      console.log(`  ${result.test}: ${result.duration}ms`);
    });
  }
}

// Export the tester for use in development
export default ClinicalTrialsAPITester;

// Example usage in development environment
export const runAPITests = async (): Promise<TestResult[]> => {
  const tester = new ClinicalTrialsAPITester();
  return await tester.runAllTests();
};

// Quick test function for basic connectivity
export const quickConnectivityTest = async (): Promise<boolean> => {
  try {
    console.log('🔌 Testing ClinicalTrials.gov API connectivity...');
    
    const result = await ClinicalTrialsGovAPI.searchTrials({
      pageSize: 1
    });
    
    const isConnected = result.trials && result.trials.length > 0;
    
    console.log(isConnected ? 
      '✅ API connectivity successful!' : 
      '⚠️  API returned no results but connection established'
    );
    
    return isConnected;
  } catch (error) {
    console.log(`❌ API connectivity failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}; 
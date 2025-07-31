import { Request, Response } from 'express';
import AnalyticsService from '../services/analytics.service';

// Test endpoint to check each analytics method individually
export const testAnalyticsMethods = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user?.organization_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    
    const results: any = {
      organizationId,
      tests: {}
    };

    // Test 1: Building Analytics
    try {
      console.log('Testing getBuildingAnalytics...');
      const buildingAnalytics = await AnalyticsService.getBuildingAnalytics(organizationId);
      results.tests.buildingAnalytics = {
        success: true,
        count: buildingAnalytics.length,
        data: buildingAnalytics.slice(0, 1) // Just first item for brevity
      };
    } catch (error: any) {
      results.tests.buildingAnalytics = {
        success: false,
        error: error.message
      };
    }

    // Test 2: FCI Age Correlation
    try {
      console.log('Testing getFCIAgeCorrelation...');
      const fciAgeCorrelation = await AnalyticsService.getFCIAgeCorrelation(organizationId);
      results.tests.fciAgeCorrelation = {
        success: true,
        count: fciAgeCorrelation.length,
        data: fciAgeCorrelation.slice(0, 1)
      };
    } catch (error: any) {
      results.tests.fciAgeCorrelation = {
        success: false,
        error: error.message
      };
    }

    // Test 3: Cost Efficiency Analysis
    try {
      console.log('Testing getCostEfficiencyAnalysis...');
      const costEfficiency = await AnalyticsService.getCostEfficiencyAnalysis(organizationId);
      results.tests.costEfficiency = {
        success: true,
        count: costEfficiency.length,
        data: costEfficiency.slice(0, 1)
      };
    } catch (error: any) {
      results.tests.costEfficiency = {
        success: false,
        error: error.message
      };
    }

    // Test 4: Maintenance Cost Trends
    try {
      console.log('Testing getMaintenanceCostTrends...');
      const costTrends = await AnalyticsService.getMaintenanceCostTrends(12, organizationId);
      results.tests.costTrends = {
        success: true,
        count: costTrends.length,
        data: costTrends.slice(0, 1)
      };
    } catch (error: any) {
      results.tests.costTrends = {
        success: false,
        error: error.message
      };
    }

    res.json({
      success: true,
      message: 'Analytics methods test completed',
      data: results
    });

  } catch (error: any) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message
    });
  }
};
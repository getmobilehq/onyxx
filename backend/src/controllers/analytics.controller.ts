import { Request, Response } from 'express';
import AnalyticsService from '../services/analytics.service';

// Get building analytics with cost and FCI metrics
export const getBuildingAnalytics = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const analytics = await AnalyticsService.getBuildingAnalytics(user.organization_id);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching building analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch building analytics'
    });
  }
};

// Get FCI and age correlation analysis
export const getFCIAgeCorrelation = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const correlation = await AnalyticsService.getFCIAgeCorrelation(user.organization_id);
    
    res.json({
      success: true,
      data: correlation
    });
  } catch (error) {
    console.error('Error fetching FCI age correlation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FCI age correlation'
    });
  }
};

// Get cost efficiency analysis
export const getCostEfficiencyAnalysis = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const efficiency = await AnalyticsService.getCostEfficiencyAnalysis(user.organization_id);
    
    res.json({
      success: true,
      data: efficiency
    });
  } catch (error) {
    console.error('Error fetching cost efficiency analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cost efficiency analysis'
    });
  }
};

// Get maintenance cost trends
export const getMaintenanceCostTrends = async (req: Request, res: Response) => {
  try {
    const { months } = req.query;
    const monthsNum = months ? parseInt(months as string) : 12;
    const user = (req as any).user;
    
    const trends = await AnalyticsService.getMaintenanceCostTrends(monthsNum, user.organization_id);
    
    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error fetching maintenance cost trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance cost trends'
    });
  }
};

// Get comprehensive analytics summary
export const getAnalyticsSummary = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    console.log('🔐 Analytics request from user:', user?.id, 'org:', user?.organization_id);
    
    // Always return empty analytics if no user/org instead of error
    if (!user || !user.organization_id) {
      console.log('⚠️ No user/org context, returning empty analytics');
      const emptyAnalytics = AnalyticsService.getEmptyAnalytics();
      return res.json({
        success: true,
        data: emptyAnalytics,
        message: 'No analytics data available yet'
      });
    }
    
    let summary;
    try {
      summary = await AnalyticsService.getAnalyticsSummary(user.organization_id);
    } catch (serviceError) {
      console.error('Analytics service error:', serviceError);
      // Return empty analytics on any service error
      summary = AnalyticsService.getEmptyAnalytics();
    }
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Unexpected error in analytics controller:', error);
    // Always return a valid response, never 500
    const emptyAnalytics = AnalyticsService.getEmptyAnalytics();
    res.json({
      success: true,
      data: emptyAnalytics,
      message: 'No analytics data available yet'
    });
  }
};
import { Request, Response } from 'express';
import AnalyticsService from '../services/analytics.service';

// Get building analytics with cost and FCI metrics
export const getBuildingAnalytics = async (req: Request, res: Response) => {
  try {
    const analytics = await AnalyticsService.getBuildingAnalytics();
    
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
    const correlation = await AnalyticsService.getFCIAgeCorrelation();
    
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
    const efficiency = await AnalyticsService.getCostEfficiencyAnalysis();
    
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
    
    const trends = await AnalyticsService.getMaintenanceCostTrends(monthsNum);
    
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
    const summary = await AnalyticsService.getAnalyticsSummary();
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics summary'
    });
  }
};
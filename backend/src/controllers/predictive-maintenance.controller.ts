import { Request, Response } from 'express';
import PredictiveMaintenanceService from '../services/predictive-maintenance.service';

// Get maintenance predictions
export const getMaintenancePredictions = async (req: Request, res: Response) => {
  try {
    const predictions = await PredictiveMaintenanceService.generateMaintenancePredictions();
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Error fetching maintenance predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance predictions'
    });
  }
};

// Get failure risk analysis
export const getFailureRiskAnalysis = async (req: Request, res: Response) => {
  try {
    const riskAnalysis = await PredictiveMaintenanceService.analyzeFailureRisk();
    
    res.json({
      success: true,
      data: riskAnalysis
    });
  } catch (error) {
    console.error('Error fetching failure risk analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch failure risk analysis'
    });
  }
};

// Get optimization suggestions
export const getOptimizationSuggestions = async (req: Request, res: Response) => {
  try {
    const suggestions = await PredictiveMaintenanceService.generateOptimizationSuggestions();
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error fetching optimization suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch optimization suggestions'
    });
  }
};

// Get comprehensive predictive maintenance dashboard
export const getPredictiveMaintenanceDashboard = async (req: Request, res: Response) => {
  try {
    const dashboard = await PredictiveMaintenanceService.getPredictiveMaintenanceDashboard();
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error fetching predictive maintenance dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictive maintenance dashboard'
    });
  }
};
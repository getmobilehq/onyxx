import express from 'express';
import { 
  getBuildingAnalytics,
  getFCIAgeCorrelation,
  getCostEfficiencyAnalysis,
  getMaintenanceCostTrends,
  getAnalyticsSummary
} from '../controllers/analytics.controller';
import { testAnalyticsMethods } from '../controllers/analytics-test.controller';
import {
  getMaintenancePredictions,
  getFailureRiskAnalysis,
  getOptimizationSuggestions,
  getPredictiveMaintenanceDashboard
} from '../controllers/predictive-maintenance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Building analytics with cost and FCI metrics
router.get('/buildings', authenticate, getBuildingAnalytics);

// FCI and age correlation
router.get('/fci-age-correlation', authenticate, getFCIAgeCorrelation);

// Cost efficiency analysis
router.get('/cost-efficiency', authenticate, getCostEfficiencyAnalysis);

// Maintenance cost trends
router.get('/cost-trends', authenticate, getMaintenanceCostTrends);

// Comprehensive analytics summary
router.get('/summary', authenticate, getAnalyticsSummary);

// Test endpoint to debug analytics methods
router.get('/test', authenticate, testAnalyticsMethods);

// Predictive maintenance endpoints
router.get('/predictions', authenticate, getMaintenancePredictions);
router.get('/risk-analysis', authenticate, getFailureRiskAnalysis);
router.get('/optimization', authenticate, getOptimizationSuggestions);
router.get('/predictive-dashboard', authenticate, getPredictiveMaintenanceDashboard);

export default router;
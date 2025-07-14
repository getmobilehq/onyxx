import express from 'express';
import { generatePDFReport, generateExcelReport } from '../controllers/reports.controller';
import { 
  getUserSubscriptions, 
  createSubscription, 
  updateSubscription, 
  deleteSubscription,
  sendTestReport,
  getEmailServiceStatus,
  getAllSubscriptions,
  triggerManualReports,
  getEmailStats
} from '../controllers/email-reports.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// PDF report generation
router.get('/pdf/:assessmentId', authenticate, generatePDFReport);

// Excel report generation
router.get('/excel', authenticate, generateExcelReport);

// Email report subscriptions
router.get('/subscriptions', authenticate, getUserSubscriptions);
router.post('/subscriptions', authenticate, createSubscription);
router.put('/subscriptions/:id', authenticate, updateSubscription);
router.delete('/subscriptions/:id', authenticate, deleteSubscription);

// Test email functionality
router.post('/test-email', authenticate, sendTestReport);
router.get('/email-status', authenticate, getEmailServiceStatus);

// Admin endpoints
router.get('/admin/subscriptions', authenticate, getAllSubscriptions);
router.post('/admin/trigger-reports', authenticate, triggerManualReports);
router.get('/admin/email-stats', authenticate, getEmailStats);

export default router;
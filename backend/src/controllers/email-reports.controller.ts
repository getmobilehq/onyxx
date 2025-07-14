import { Request, Response } from 'express';
import pool from '../config/database';
import mailgunEmailService from '../services/mailgun-email.service';

// Get user's report subscriptions
export const getUserSubscriptions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const query = `
      SELECT 
        id,
        frequency,
        report_type,
        filters,
        is_active,
        created_at,
        updated_at
      FROM report_subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
};

// Create new report subscription
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { frequency, report_type, filters } = req.body;
    
    // Validate input
    if (!frequency || !report_type) {
      return res.status(400).json({
        success: false,
        message: 'Frequency and report type are required'
      });
    }
    
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid frequency. Must be daily, weekly, or monthly'
      });
    }
    
    if (!['summary', 'detailed', 'critical_only'].includes(report_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type. Must be summary, detailed, or critical_only'
      });
    }
    
    const query = `
      INSERT INTO report_subscriptions (user_id, frequency, report_type, filters)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      userId,
      frequency,
      report_type,
      JSON.stringify(filters || {})
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
};

// Update report subscription
export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { frequency, report_type, filters, is_active } = req.body;
    
    // Check if subscription belongs to user
    const checkQuery = 'SELECT id FROM report_subscriptions WHERE id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [id, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    const query = `
      UPDATE report_subscriptions 
      SET 
        frequency = COALESCE($1, frequency),
        report_type = COALESCE($2, report_type),
        filters = COALESCE($3, filters),
        is_active = COALESCE($4, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      frequency,
      report_type,
      filters ? JSON.stringify(filters) : null,
      is_active,
      id,
      userId
    ]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription'
    });
  }
};

// Delete report subscription
export const deleteSubscription = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    const query = 'DELETE FROM report_subscriptions WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription'
    });
  }
};

// Send test report
export const sendTestReport = async (req: Request, res: Response) => {
  try {
    const userEmail = (req as any).user.email;
    const { report_type } = req.body;
    
    const result = await mailgunEmailService.sendTestReport(userEmail, report_type);
    
    res.json({
      success: true,
      message: 'Test report sent successfully'
    });
  } catch (error) {
    console.error('Error sending test report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test report'
    });
  }
};

// Check email service status
export const getEmailServiceStatus = async (req: Request, res: Response) => {
  try {
    const status = await mailgunEmailService.verifyConnection();
    res.json(status);
  } catch (error) {
    console.error('Error checking email service status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email service status'
    });
  }
};

// Admin: Get all subscriptions
export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    
    const query = `
      SELECT 
        rs.*,
        u.email as user_email,
        u.name as user_name,
        u.role as user_role
      FROM report_subscriptions rs
      JOIN users u ON rs.user_id = u.id
      ORDER BY rs.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching all subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
};

// Admin: Trigger manual report sending
export const triggerManualReports = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    
    const { frequency } = req.body;
    
    if (!frequency || !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid frequency. Must be daily, weekly, or monthly'
      });
    }
    
    // Trigger reports asynchronously
    mailgunEmailService.sendScheduledReports(frequency as 'daily' | 'weekly' | 'monthly');
    
    res.json({
      success: true,
      message: `${frequency} reports triggered successfully`
    });
  } catch (error) {
    console.error('Error triggering manual reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger reports'
    });
  }
};

// Get email statistics (Mailgun analytics)
export const getEmailStats = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    
    const { days } = req.query;
    const statsDays = days ? parseInt(days as string) : 30;
    
    const stats = await mailgunEmailService.getEmailStats(statsDays);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email statistics'
    });
  }
};
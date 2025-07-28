import request from 'supertest';
import { Pool } from 'pg';

// Mock database connection
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

// Mock JWT middleware
jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { id: 'test-user-id', role: 'assessor' };
    next();
  })
}));

import app from '../src/app';
import pool from '../src/config/database';

const mockPool = pool as jest.Mocked<Pool>;

describe('Pre-Assessments Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/pre-assessments', () => {
    it('should create a new pre-assessment successfully', async () => {
      const preAssessmentData = {
        assessment_id: 'assessment-uuid',
        building_id: 'building-uuid',
        assessment_type: 'Annual',
        assessment_date: '2024-12-01',
        assessment_scope: 'Full',
        building_size: 50000,
        building_type: 'Office',
        replacement_value: 12500000,
        selected_elements: [
          {
            id: 'element-1',
            name: 'Roofing',
            group: 'B - Shell',
            majorGroup: 'B - Building Shell'
          }
        ],
        checklist: {
          buildingPlans: true,
          accessPermissions: true,
          safetyEquipment: false,
          previousReports: true,
          keyStakeholders: true,
          weatherConditions: false,
          emergencyProcedures: true,
          equipmentCalibration: false
        },
        additional_notes: 'This is a comprehensive annual assessment',
        assessor_name: 'John Doe'
      };

      // Mock that no existing pre-assessment exists
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Check existing
        .mockResolvedValueOnce({ // Insert new
          rows: [{
            id: 'pre-assessment-uuid',
            ...preAssessmentData,
            status: 'draft',
            created_at: new Date(),
            updated_at: new Date()
          }]
        });

      const response = await request(app)
        .post('/api/pre-assessments')
        .send(preAssessmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preAssessment.assessment_id).toBe(preAssessmentData.assessment_id);
      expect(response.body.data.preAssessment.assessment_type).toBe(preAssessmentData.assessment_type);
      expect(response.body.message).toContain('created successfully');
    });

    it('should update existing pre-assessment', async () => {
      const preAssessmentData = {
        assessment_id: 'assessment-uuid',
        building_id: 'building-uuid',
        assessment_type: 'Annual',
        assessment_date: '2024-12-01',
        assessment_scope: 'Full',
        building_size: 50000,
        selected_elements: [],
        checklist: {}
      };

      // Mock existing pre-assessment found
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'existing-id' }] }) // Check existing
        .mockResolvedValueOnce({ // Update existing
          rows: [{
            id: 'existing-id',
            ...preAssessmentData,
            status: 'draft',
            updated_at: new Date()
          }]
        });

      const response = await request(app)
        .post('/api/pre-assessments')
        .send(preAssessmentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated successfully');
    });

    it('should reject pre-assessment with invalid data', async () => {
      const invalidData = {
        assessment_id: 'invalid-uuid',
        building_id: '', // Required but empty
        assessment_type: 'InvalidType',
        assessment_date: 'invalid-date',
        building_size: -1000, // Should be positive
        selected_elements: 'not-an-array' // Should be array
      };

      const response = await request(app)
        .post('/api/pre-assessments')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/pre-assessments/assessment/:assessmentId', () => {
    it('should get pre-assessment by assessment ID', async () => {
      const assessmentId = 'assessment-uuid';
      const mockPreAssessment = {
        id: 'pre-assessment-uuid',
        assessment_id: assessmentId,
        building_id: 'building-uuid',
        assessment_type: 'Annual',
        assessment_date: '2024-12-01',
        building_size: 50000,
        selected_elements: [],
        checklist: {},
        status: 'completed',
        created_at: new Date()
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockPreAssessment]
      });

      const response = await request(app)
        .get(`/api/pre-assessments/assessment/${assessmentId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preAssessment.assessment_id).toBe(assessmentId);
    });

    it('should return 404 for non-existent pre-assessment', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/pre-assessments/assessment/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('GET /api/pre-assessments/building/:buildingId', () => {
    it('should get latest pre-assessment by building ID', async () => {
      const buildingId = 'building-uuid';
      const mockPreAssessment = {
        id: 'pre-assessment-uuid',
        assessment_id: 'assessment-uuid',
        building_id: buildingId,
        assessment_type: 'Annual',
        status: 'completed',
        created_at: new Date()
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockPreAssessment]
      });

      const response = await request(app)
        .get(`/api/pre-assessments/building/${buildingId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preAssessment.building_id).toBe(buildingId);
    });
  });

  describe('GET /api/pre-assessments', () => {
    it('should get all pre-assessments with pagination', async () => {
      const mockPreAssessments = [
        {
          id: 'pre-assessment-1',
          assessment_id: 'assessment-1',
          building_id: 'building-1',
          assessment_type: 'Annual',
          status: 'completed',
          building_name: 'Building A',
          created_by_name: 'John Doe'
        },
        {
          id: 'pre-assessment-2',
          assessment_id: 'assessment-2',
          building_id: 'building-2',
          assessment_type: 'Condition',
          status: 'draft',
          building_name: 'Building B',
          created_by_name: 'Jane Smith'
        }
      ];

      const mockCount = { rows: [{ count: '2' }] };

      mockPool.query
        .mockResolvedValueOnce({ rows: mockPreAssessments })
        .mockResolvedValueOnce(mockCount);

      const response = await request(app)
        .get('/api/pre-assessments?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.preAssessments).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter pre-assessments by status', async () => {
      const mockPreAssessments = [
        {
          id: 'pre-assessment-1',
          status: 'completed',
          building_name: 'Building A'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockPreAssessments })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const response = await request(app)
        .get('/api/pre-assessments?status=completed');

      expect(response.status).toBe(200);
      expect(response.body.data.preAssessments).toHaveLength(1);
      expect(response.body.data.preAssessments[0].status).toBe('completed');
    });
  });

  describe('DELETE /api/pre-assessments/:id', () => {
    it('should delete pre-assessment successfully', async () => {
      const preAssessmentId = 'pre-assessment-uuid';

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: preAssessmentId }] }) // Check exists
        .mockResolvedValueOnce({ rows: [] }); // Delete

      const response = await request(app)
        .delete(`/api/pre-assessments/${preAssessmentId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 when deleting non-existent pre-assessment', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .delete('/api/pre-assessments/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
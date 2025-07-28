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

describe('Assessment Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/assessments', () => {
    it('should create a new assessment successfully', async () => {
      const assessmentData = {
        building_id: 'building-uuid',
        type: 'field_assessment',
        description: 'Test assessment',
        scheduled_date: '2024-12-01T10:00:00Z'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'assessment-uuid',
          ...assessmentData,
          status: 'pending',
          created_by_user_id: 'test-user-id',
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const response = await request(app)
        .post('/api/assessments')
        .send(assessmentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assessment.building_id).toBe(assessmentData.building_id);
      expect(response.body.data.assessment.type).toBe(assessmentData.type);
    });

    it('should reject assessment with invalid building_id', async () => {
      const invalidData = {
        building_id: 'invalid-uuid',
        type: 'field_assessment'
      };

      const response = await request(app)
        .post('/api/assessments')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/assessments', () => {
    it('should get all assessments with pagination', async () => {
      const mockAssessments = [
        {
          id: 'assessment-1',
          building_id: 'building-1',
          type: 'field_assessment',
          status: 'completed',
          building_name: 'Test Building 1',
          created_at: new Date()
        },
        {
          id: 'assessment-2',
          building_id: 'building-2',
          type: 'field_assessment',
          status: 'in_progress',
          building_name: 'Test Building 2',
          created_at: new Date()
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockAssessments }) // Get assessments
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Get count

      const response = await request(app)
        .get('/api/assessments?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assessments).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter assessments by status', async () => {
      const mockAssessments = [
        {
          id: 'assessment-1',
          building_id: 'building-1',
          status: 'completed',
          building_name: 'Test Building 1'
        }
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockAssessments })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const response = await request(app)
        .get('/api/assessments?status=completed');

      expect(response.status).toBe(200);
      expect(response.body.data.assessments).toHaveLength(1);
      expect(response.body.data.assessments[0].status).toBe('completed');
    });
  });

  describe('GET /api/assessments/:id', () => {
    it('should get assessment by ID', async () => {
      const assessmentId = 'assessment-uuid';
      const mockAssessment = {
        id: assessmentId,
        building_id: 'building-uuid',
        type: 'field_assessment',
        status: 'in_progress',
        building_name: 'Test Building',
        created_at: new Date()
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockAssessment]
      });

      const response = await request(app)
        .get(`/api/assessments/${assessmentId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assessment.id).toBe(assessmentId);
    });

    it('should return 404 for non-existent assessment', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/assessments/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/assessments/:id', () => {
    it('should update assessment successfully', async () => {
      const assessmentId = 'assessment-uuid';
      const updateData = {
        status: 'completed',
        notes: 'Assessment completed successfully'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: assessmentId,
          status: 'completed',
          notes: updateData.notes,
          updated_at: new Date()
        }]
      });

      const response = await request(app)
        .put(`/api/assessments/${assessmentId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.assessment.status).toBe('completed');
    });
  });

  describe('DELETE /api/assessments/:id', () => {
    it('should delete assessment successfully', async () => {
      const assessmentId = 'assessment-uuid';

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: assessmentId }] }) // Check exists
        .mockResolvedValueOnce({ rows: [] }); // Delete

      const response = await request(app)
        .delete(`/api/assessments/${assessmentId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 when deleting non-existent assessment', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] }); // Not found

      const response = await request(app)
        .delete('/api/assessments/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
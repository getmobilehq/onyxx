import { Request, Response, NextFunction } from 'express';
import pool from '../src/config/database';
import {
  getAllAssessments,
  getAssessmentById,
  updateAssessment,
  deleteAssessment,
} from '../src/controllers/assessments.controller';

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

const mockPool = pool as unknown as { query: jest.Mock };

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Assessments Controller', () => {
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAssessments', () => {
    it('returns assessments with pagination metadata', async () => {
      const assessments = [
        {
          id: 'a-1',
          building_id: 'b-1',
          type: 'field_assessment',
          status: 'completed',
          building_name: 'HQ',
          created_at: new Date(),
        },
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: assessments })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const req = {
        query: { limit: '10', offset: '0' },
        user: { organization_id: 'org-1' },
      } as unknown as Request;

      const res = createMockResponse();

      await getAllAssessments(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            assessments,
            pagination: expect.objectContaining({ total: 1, limit: 10, offset: 0 }),
          }),
        }),
      );
    });
  });

  describe('getAssessmentById', () => {
    it('returns 404 when assessment is missing', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const req = {
        params: { id: 'missing' },
        user: { organization_id: 'org-1' },
      } as unknown as Request;

      const res = createMockResponse();

      await getAssessmentById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      );
    });

    it('returns the assessment when found', async () => {
      const assessment = {
        id: 'a-1',
        building_id: 'b-1',
        type: 'field_assessment',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [assessment] });

      const req = {
        params: { id: 'a-1' },
        user: { organization_id: 'org-1' },
      } as unknown as Request;

      const res = createMockResponse();

      await getAssessmentById(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ assessment }),
        }),
      );
    });
  });

  describe('updateAssessment', () => {
    it('returns 404 when no rows are updated', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const req = {
        params: { id: 'a-1' },
        body: { status: 'completed' },
      } as unknown as Request;

      const res = createMockResponse();

      await updateAssessment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns updated assessment', async () => {
      const updated = {
        id: 'a-1',
        status: 'completed',
        updated_at: new Date(),
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'a-1' }] })
        .mockResolvedValueOnce({ rows: [updated] });

      const req = {
        params: { id: 'a-1' },
        body: { status: 'completed' },
      } as unknown as Request;

      const res = createMockResponse();

      await updateAssessment(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ assessment: updated }),
        }),
      );
    });
  });

  describe('deleteAssessment', () => {
    it('returns 404 when assessment does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const req = {
        params: { id: 'missing' },
      } as unknown as Request;

      const res = createMockResponse();

      await deleteAssessment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns success when deletion occurs', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'a-1' }] });

      const req = {
        params: { id: 'a-1' },
      } as unknown as Request;

      const res = createMockResponse();

      await deleteAssessment(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });
  });
});

import { Request, Response, NextFunction } from 'express';
import pool from '../src/config/database';
import {
  getPreAssessmentByAssessmentId,
  getAllPreAssessments,
  deletePreAssessment,
} from '../src/controllers/pre-assessments.controller';

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

describe('Pre-Assessment Controller', () => {
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreAssessmentByAssessmentId', () => {
    it('returns 404 when assessment has no pre-assessment', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const req = {
        params: { assessmentId: 'missing' },
      } as unknown as Request;

      const res = createMockResponse();

      await getPreAssessmentByAssessmentId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns pre-assessment when found', async () => {
      const preAssessment = { id: 'pa-1', assessment_id: 'a-1' };
      mockPool.query.mockResolvedValueOnce({ rows: [preAssessment] });

      const req = {
        params: { assessmentId: 'a-1' },
      } as unknown as Request;

      const res = createMockResponse();

      await getPreAssessmentByAssessmentId(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ preAssessment }),
        }),
      );
    });
  });

  describe('getAllPreAssessments', () => {
    it('requires authentication', async () => {
      const req = {
        query: {},
        user: null,
      } as unknown as Request;

      const res = createMockResponse();

      await getAllPreAssessments(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns paginated pre-assessments', async () => {
      const dataRows = [
        {
          id: 'pa-1',
          assessment_id: 'a-1',
          building_id: 'b-1',
          status: 'draft',
          building_name: 'HQ',
          created_by_name: 'Tester',
        },
      ];

      mockPool.query
        .mockResolvedValueOnce({ rows: dataRows })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const req = {
        query: { page: '1', limit: '10' },
        user: { organization_id: 'org-1' },
      } as unknown as Request;

      const res = createMockResponse();

      await getAllPreAssessments(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            preAssessments: dataRows,
            pagination: expect.objectContaining({ total: 1, pages: 1 }),
          }),
        }),
      );
    });
  });

  describe('deletePreAssessment', () => {
    it('returns 404 when record does not exist', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const req = { params: { id: 'missing' } } as unknown as Request;
      const res = createMockResponse();

      await deletePreAssessment(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

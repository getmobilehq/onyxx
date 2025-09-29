import request from 'supertest';
import { Pool } from 'pg';

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('../src/middleware/auth.middleware', () => ({
  authenticate: jest.fn((req, _res, next) => {
    req.user = {
      id: 'test-user-id',
      role: 'admin',
      organization_id: 'org-1',
      name: 'Test User',
    };
    next();
  }),
}));

import express from 'express';
import reportsRouter from '../src/routes/reports';
import pool from '../src/config/database';

const mockPool = pool as unknown as jest.Mocked<Pool>;

const app = express();
app.use(express.json());
app.use('/api/reports', reportsRouter);

describe('Reports Endpoints - Multi-tenant safeguards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/reports', () => {
    it('creates a report when building and assessment belong to the user organization', async () => {
      const payload = {
        building_id: 'building-1',
        assessment_id: 'assessment-1',
        title: 'Test Report',
      };

      const insertedReport = {
        id: 'report-1',
        building_id: 'building-1',
        assessment_id: 'assessment-1',
        title: 'Test Report',
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'building-1' }] });
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: 'assessment-1' }] });
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [insertedReport] });

      const response = await request(app)
        .post('/api/reports')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.report).toMatchObject(insertedReport);
      expect((mockPool.query as jest.Mock)).toHaveBeenNthCalledWith(
        1,
        'SELECT id FROM buildings WHERE id = $1 AND organization_id = $2',
        ['building-1', 'org-1']
      );
      expect((mockPool.query as jest.Mock)).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('FROM assessments a'),
        ['assessment-1', 'org-1']
      );
    });

    it('returns 403 when building belongs to another organization', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'building-1' }] });

      const response = await request(app)
        .post('/api/reports')
        .send({
          building_id: 'building-1',
          title: 'Unauthorized Report',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });

  describe('GET /api/reports/:id', () => {
    it('returns a report when it belongs to the user organization', async () => {
      const reportId = 'report-1';
      const reportRow = {
        id: reportId,
        building_id: 'building-1',
        title: 'Accessible Report',
      };

      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [reportRow] });

      const response = await request(app)
        .get(`/api/reports/${reportId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.report).toMatchObject(reportRow);
      expect((mockPool.query as jest.Mock)).toHaveBeenCalledWith(
        expect.stringContaining('WHERE r.id = $1 AND b.organization_id = $2'),
        [reportId, 'org-1']
      );
    });

    it('returns 403 when report exists in another organization', async () => {
      const reportId = 'report-2';

      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: reportId, organization_id: 'org-2' }] });

      const response = await request(app)
        .get(`/api/reports/${reportId}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });
  });
});

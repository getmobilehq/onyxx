import { Request, Response, NextFunction } from 'express';
import pool from '../src/config/database';
import {
  getAllBuildings,
  getBuildingById,
  deleteBuilding,
} from '../src/controllers/buildings.controller';

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

describe('Buildings Controller', () => {
  const next = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBuildings', () => {
    it('returns empty list when user has no organization', async () => {
      const req = {
        query: {},
        user: { organization_id: null },
      } as unknown as Request;

      const res = createMockResponse();

      await getAllBuildings(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({ buildings: [], count: 0 }),
        }),
      );
    });

    it('returns buildings for organization', async () => {
      const buildings = [
        { id: 'b-1', name: 'Tower', type: 'Office', created_at: new Date() },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: buildings, rowCount: buildings.length });

      const req = {
        query: {},
        user: { organization_id: 'org-1' },
      } as unknown as Request;

      const res = createMockResponse();

      await getAllBuildings(req, res, next);

      expect(mockPool.query).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ buildings, count: buildings.length }),
        }),
      );
    });
  });

  describe('getBuildingById', () => {
    it('returns 404 when building is missing', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const req = {
        params: { id: 'missing' },
        user: { organization_id: 'org-1' },
      } as unknown as Request;

      const res = createMockResponse();

      await getBuildingById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteBuilding', () => {
    it('returns 404 when building is not found', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const req = {
        params: { id: 'missing' },
      } as unknown as Request;

      const res = createMockResponse();

      await deleteBuilding(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('prevents deletion when assessments exist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'b-1' }] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }] });

      const req = {
        params: { id: 'b-1' },
      } as unknown as Request;

      const res = createMockResponse();

      await deleteBuilding(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

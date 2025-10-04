import { Request, Response, NextFunction } from 'express';
import { createAssessment } from '../src/controllers/assessments.controller';
import pool from '../src/config/database';

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

describe('createAssessment controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a field assessment when payload is valid', async () => {
    const req = {
      body: {
        building_id: 'building-1',
        type: 'field_assessment',
        description: 'Verify systems',
        scheduled_date: '2025-01-15T09:00:00Z',
        assigned_to: 'assessor-2',
      },
      user: {
        id: 'assessor-1',
        organization_id: 'org-1',
      },
    } as unknown as Request;

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'building-1' }] }) // building check
      .mockResolvedValueOnce({
        rows: [{
          id: 'assessment-123',
          organization_id: 'org-1',
          building_id: 'building-1',
          type: 'field_assessment',
          status: 'pending',
          scheduled_date: '2025-01-15T09:00:00Z',
          assigned_to_user_id: 'assessor-2',
          created_by_user_id: 'assessor-1',
        }],
      });

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await createAssessment(req, res, next);

    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(mockPool.query).toHaveBeenNthCalledWith(1, 'SELECT id FROM buildings WHERE id = $1', ['building-1']);
    expect(mockPool.query.mock.calls[1][1]).toEqual([
      'org-1',
      'building-1',
      'field_assessment',
      'pending',
      '2025-01-15T09:00:00Z',
      'assessor-2',
      'assessor-1',
    ]);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        assessment: expect.objectContaining({ id: 'assessment-123', status: 'pending' }),
      }),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    const req = {
      body: {
        building_id: '',
        type: '',
      },
      user: {
        id: 'assessor-1',
        organization_id: 'org-1',
      },
    } as unknown as Request;

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await createAssessment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Building ID and assessment type'),
    }));
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('returns 404 when building does not exist', async () => {
    const req = {
      body: {
        building_id: 'missing-building',
        type: 'field_assessment',
      },
      user: {
        id: 'assessor-1',
        organization_id: 'org-1',
      },
    } as unknown as Request;

    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await createAssessment(req, res, next);

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Building not found'),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects unsupported assessment types', async () => {
    const req = {
      body: {
        building_id: 'building-1',
        type: 'maintenance_audit',
      },
      user: {
        id: 'assessor-1',
        organization_id: 'org-1',
      },
    } as unknown as Request;

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await createAssessment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Assessment type must'),
    }));
    expect(mockPool.query).not.toHaveBeenCalled();
  });
});

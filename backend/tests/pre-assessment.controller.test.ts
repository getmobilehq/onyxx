import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { savePreAssessment } from '../src/controllers/pre-assessments.controller';
import pool from '../src/config/database';

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const mockPool = pool as unknown as { query: jest.Mock };
const validationResultMock = validationResult as unknown as jest.Mock;

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('savePreAssessment controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResultMock.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  const basePayload = {
    assessment_id: 'assessment-1',
    building_id: 'building-1',
    assessment_type: 'Annual',
    assessment_date: '2025-02-01',
    assessment_scope: 'Full facility',
    building_size: 120000,
    building_type: 'Commercial',
    replacement_value: 48000000,
    selected_elements: [{ id: 'elem-1', name: 'Roofing' }],
    checklist: { permits: true },
    additional_notes: 'Check roof membrane',
    assessor_name: 'Jordan Smith',
    status: 'draft',
  };

  it('creates a new pre-assessment when none exists', async () => {
    const req = {
      body: basePayload,
      user: { id: 'assessor-1' },
    } as unknown as Request;

    mockPool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'pre-123', ...basePayload }] });

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await savePreAssessment(req, res, next);

    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(mockPool.query.mock.calls[0]).toEqual([
      'SELECT id FROM pre_assessments WHERE assessment_id = $1',
      ['assessment-1'],
    ]);
    expect(mockPool.query.mock.calls[1][1]).toEqual([
      'assessment-1',
      'building-1',
      'Annual',
      '2025-02-01',
      'Full facility',
      120000,
      'Commercial',
      48000000,
      JSON.stringify([{ id: 'elem-1', name: 'Roofing' }]),
      JSON.stringify({ permits: true }),
      'Check roof membrane',
      'Jordan Smith',
      'draft',
      null,
      'assessor-1',
    ]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining('created successfully'),
      data: expect.objectContaining({
        preAssessment: expect.objectContaining({ id: 'pre-123' }),
      }),
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('updates an existing pre-assessment', async () => {
    const req = {
      body: { ...basePayload, status: 'completed' },
      user: { id: 'assessor-1' },
    } as unknown as Request;

    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'pre-123' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'pre-123', ...basePayload, status: 'completed' }] });

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await savePreAssessment(req, res, next);

    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(mockPool.query.mock.calls[1][1]).toEqual([
      'Annual',
      '2025-02-01',
      'Full facility',
      120000,
      'Commercial',
      48000000,
      JSON.stringify([{ id: 'elem-1', name: 'Roofing' }]),
      JSON.stringify({ permits: true }),
      'Check roof membrane',
      'Jordan Smith',
      'completed',
      'assessment-1',
    ]);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining('updated successfully'),
    }));
  });

  it('returns 401 when user is missing', async () => {
    const req = {
      body: basePayload,
      user: undefined,
    } as unknown as Request;

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await savePreAssessment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Authentication required'),
    }));
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('returns validation errors when payload is invalid', async () => {
    validationResultMock.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ param: 'assessment_id', msg: 'Assessment ID is required' }],
    });

    const req = {
      body: {},
      user: { id: 'assessor-1' },
    } as unknown as Request;

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await savePreAssessment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errors: [{ param: 'assessment_id', msg: 'Assessment ID is required' }],
    });
    expect(mockPool.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

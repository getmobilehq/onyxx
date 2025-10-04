import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { createBuilding } from '../src/controllers/buildings.controller';
import pool from '../src/config/database';

// Mock dependencies used by the controller
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../src/services/cloudinary.service', () => ({
  cleanCloudinaryUrl: jest.fn((url?: string) => url),
  uploadImageToCloudinary: jest.fn(),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

const {
  cleanCloudinaryUrl: cleanCloudinaryUrlMock,
} = jest.requireMock('../src/services/cloudinary.service') as {
  cleanCloudinaryUrl: jest.Mock;
};

const mockPool = pool as unknown as { query: jest.Mock };
const validationResultMock = validationResult as unknown as jest.Mock;

const createMockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('createBuilding controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validationResultMock.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });
  });

  it('creates a building with computed replacement value when payload is valid', async () => {
    const req = {
      body: {
        name: 'West Campus HQ',
        type: 'Office',
        construction_type: 'Steel Frame',
        year_built: 2016,
        square_footage: 95000,
        state: 'CA',
        city: 'San Francisco',
        zip_code: '94105',
        street_address: '123 Market St',
        cost_per_sqft: 275,
        image_url: 'https://assets.example.com/encoded%20image.png',
      },
      user: {
        id: 'user-1',
        organization_id: 'org-1',
      },
    } as unknown as Request;

    const mockBuilding = {
      id: 'building-uuid',
      name: req.body.name,
      type: req.body.type,
      square_footage: req.body.square_footage,
      cost_per_sqft: req.body.cost_per_sqft,
      replacement_value: req.body.square_footage * req.body.cost_per_sqft,
    };

    mockPool.query.mockResolvedValueOnce({ rows: [mockBuilding] });

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await createBuilding(req, res, next);

    expect(validationResultMock).toHaveBeenCalledWith(req);
    expect(cleanCloudinaryUrlMock).toHaveBeenCalledWith(req.body.image_url);

    expect(mockPool.query).toHaveBeenCalledTimes(1);
    expect(mockPool.query.mock.calls[0][1]).toEqual([
      'org-1',
      'West Campus HQ',
      'Office',
      'Steel Frame',
      2016,
      95000,
      'CA',
      'San Francisco',
      '94105',
      '123 Market St',
      'https://assets.example.com/encoded%20image.png',
      'user-1',
      'active',
      275,
      26125000,
    ]);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        building: expect.objectContaining({
          id: mockBuilding.id,
          name: mockBuilding.name,
        }),
      }),
    }));

    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when authentication payload lacks organization context', async () => {
    const req = {
      body: {
        name: 'East Wing',
        type: 'Office',
      },
      user: {
        id: 'user-2',
        role: 'admin',
        organization_id: undefined,
      },
    } as unknown as Request;

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await createBuilding(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: expect.stringContaining('Authentication error'),
    }));
    expect(mockPool.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('returns validation errors when request body is invalid', async () => {
    validationResultMock.mockReturnValueOnce({
      isEmpty: () => false,
      array: () => [{ msg: 'Building name is required', param: 'name' }],
    });

    const req = {
      body: {
        name: '',
        type: '',
      },
      user: {
        id: 'user-3',
        organization_id: 'org-3',
      },
    } as unknown as Request;

    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    await createBuilding(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errors: [{ msg: 'Building name is required', param: 'name' }],
    });
    expect(mockPool.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

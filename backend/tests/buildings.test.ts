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
    req.user = { id: 'test-user-id', role: 'admin' };
    next();
  })
}));

import app from '../src/app';
import pool from '../src/config/database';

const mockPool = pool as jest.Mocked<Pool>;

describe('Buildings Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/buildings', () => {
    it('should create a new building successfully', async () => {
      const buildingData = {
        name: 'Test Building',
        type: 'Office',
        construction_type: 'Steel Frame',
        year_built: 2020,
        square_footage: 50000,
        state: 'California',
        city: 'San Francisco',
        zip_code: '94105',
        street_address: '123 Test Street',
        cost_per_sqft: 300.00
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'building-uuid',
          ...buildingData,
          status: 'pending',
          created_by_user_id: 'test-user-id',
          created_at: new Date()
        }]
      });

      const response = await request(app)
        .post('/api/buildings')
        .send(buildingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.building.name).toBe(buildingData.name);
      expect(response.body.data.building.type).toBe(buildingData.type);
      expect(response.body.data.building.square_footage).toBe(buildingData.square_footage);
    });

    it('should reject building with invalid data', async () => {
      const invalidData = {
        name: '', // Required field empty
        type: 'Office',
        year_built: 'invalid', // Should be number
        square_footage: -1000 // Should be positive
      };

      const response = await request(app)
        .post('/api/buildings')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/buildings', () => {
    it('should get all buildings with filters', async () => {
      const mockBuildings = [
        {
          id: 'building-1',
          name: 'Office Building A',
          type: 'Office',
          city: 'San Francisco',
          state: 'California',
          square_footage: 50000,
          status: 'active',
          created_at: new Date()
        },
        {
          id: 'building-2',
          name: 'Warehouse B',
          type: 'Warehouse',
          city: 'Oakland',
          state: 'California',
          square_footage: 100000,
          status: 'active',
          created_at: new Date()
        }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockBuildings
      });

      const response = await request(app)
        .get('/api/buildings');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.buildings).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
    });

    it('should filter buildings by type', async () => {
      const mockBuildings = [
        {
          id: 'building-1',
          name: 'Office Building A',
          type: 'Office',
          status: 'active'
        }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockBuildings
      });

      const response = await request(app)
        .get('/api/buildings?type=Office');

      expect(response.status).toBe(200);
      expect(response.body.data.buildings).toHaveLength(1);
      expect(response.body.data.buildings[0].type).toBe('Office');
    });

    it('should search buildings by name', async () => {
      const mockBuildings = [
        {
          id: 'building-1',
          name: 'Test Office Building',
          type: 'Office'
        }
      ];

      mockPool.query.mockResolvedValueOnce({
        rows: mockBuildings
      });

      const response = await request(app)
        .get('/api/buildings?search=Test');

      expect(response.status).toBe(200);
      expect(response.body.data.buildings).toHaveLength(1);
      expect(response.body.data.buildings[0].name).toContain('Test');
    });
  });

  describe('GET /api/buildings/:id', () => {
    it('should get building by ID', async () => {
      const buildingId = 'building-uuid';
      const mockBuilding = {
        id: buildingId,
        name: 'Test Building',
        type: 'Office',
        square_footage: 50000,
        city: 'San Francisco',
        state: 'California',
        created_at: new Date()
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [mockBuilding]
      });

      const response = await request(app)
        .get(`/api/buildings/${buildingId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.building.id).toBe(buildingId);
      expect(response.body.data.building.name).toBe('Test Building');
    });

    it('should return 404 for non-existent building', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/buildings/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PUT /api/buildings/:id', () => {
    it('should update building successfully', async () => {
      const buildingId = 'building-uuid';
      const updateData = {
        name: 'Updated Building Name',
        square_footage: 60000,
        status: 'active'
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: buildingId,
          ...updateData,
          updated_at: new Date()
        }]
      });

      const response = await request(app)
        .put(`/api/buildings/${buildingId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.building.name).toBe(updateData.name);
      expect(response.body.data.building.square_footage).toBe(updateData.square_footage);
    });

    it('should return 404 when updating non-existent building', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .put('/api/buildings/non-existent-id')
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/buildings/:id', () => {
    it('should delete building successfully when no dependencies exist', async () => {
      const buildingId = 'building-uuid';

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: buildingId }] }) // Building exists
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No assessments
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No reports
        .mockResolvedValueOnce({ rows: [] }); // Delete successful

      const response = await request(app)
        .delete(`/api/buildings/${buildingId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should prevent deletion when building has assessments', async () => {
      const buildingId = 'building-uuid';

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: buildingId }] }) // Building exists
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }); // Has assessments

      const response = await request(app)
        .delete(`/api/buildings/${buildingId}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existing assessments');
    });

    it('should prevent deletion when building has reports', async () => {
      const buildingId = 'building-uuid';

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: buildingId }] }) // Building exists
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // No assessments
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // Has reports

      const response = await request(app)
        .delete(`/api/buildings/${buildingId}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existing reports');
    });
  });
});
import { Request, Response } from 'express';
import pool from '../src/config/database';
import { login, register } from '../src/controllers/auth.controller';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  genSalt: jest.fn(() => Promise.resolve('salt')),
  hash: jest.fn(() => Promise.resolve('hashed-password')),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'jwt-token'),
}));

const mockPool = pool as unknown as { query: jest.Mock; connect: jest.Mock };
const validationResultMock = validationResult as unknown as jest.Mock;
const bcryptCompareMock = bcrypt.compare as unknown as jest.Mock;

const createResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_REFRESH_SECRET = 'refresh';
  });

  describe('login', () => {
    it('returns 400 when validation fails', async () => {
      validationResultMock.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Email is required' }],
      });

      const req = { body: {} } as Request;
      const res = createResponse();

      await login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 for unknown user', async () => {
      validationResultMock.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const req = {
        body: { email: 'missing@example.com', password: 'secret' },
      } as Request;
      const res = createResponse();

      await login(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns auth tokens on success', async () => {
      validationResultMock.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          name: 'Tester',
          email: 'tester@example.com',
          password_hash: 'hashed-password',
          role: 'admin',
          organization_id: 'org-1',
          is_platform_admin: false,
        }],
      });
      bcryptCompareMock.mockResolvedValueOnce(true);

      const req = {
        body: { email: 'tester@example.com', password: 'secret' },
      } as Request;
      const res = createResponse();

      await login(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            tokens: expect.objectContaining({
              accessToken: 'jwt-token',
              refreshToken: 'jwt-token',
            }),
          }),
        }),
      );
    });
  });

  describe('register', () => {
    it('returns validation errors', async () => {
      validationResultMock.mockReturnValue({
        isEmpty: () => false,
        array: () => [{ msg: 'Email is invalid' }],
      });

      const req = {
        body: { email: 'invalid' },
      } as Request;
      const res = createResponse();

      await register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects duplicate emails', async () => {
      validationResultMock.mockReturnValue({ isEmpty: () => true });
      mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'existing' }] });

      const req = {
        body: {
          name: 'User',
          email: 'existing@example.com',
          password: 'Password123!',
          organization_name: 'Org',
        },
      } as Request;
      const res = createResponse();

      await register(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });
});

// Global test setup
import { Pool } from 'pg';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/onyx_test';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock database pool globally
jest.mock('../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
}));

// Mock JWT functions
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mocked-jwt-token'),
  verify: jest.fn(() => ({ id: 'test-user-id', role: 'assessor' })),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
  genSalt: jest.fn(() => Promise.resolve('salt')),
}));

// Mock cloudinary service
jest.mock('../src/services/cloudinary.service', () => ({
  uploadImageToCloudinary: jest.fn(() => Promise.resolve({
    success: true,
    url: 'https://example.com/image.jpg',
    public_id: 'test-public-id'
  }))
}));

// Clean up after all tests
afterAll(async () => {
  // Close any database connections, clear timers, etc.
  jest.clearAllTimers();
  jest.restoreAllMocks();
});
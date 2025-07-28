# Onyx Backend Test Suite

This directory contains comprehensive tests for the Onyx Building Assessment Platform backend.

## Test Structure

```
tests/
├── setup.ts                          # Global test configuration
├── auth.test.ts                       # Authentication endpoint tests
├── buildings.test.ts                  # Buildings CRUD tests
├── assessments.test.ts               # Assessments workflow tests
├── pre-assessments.test.ts           # Pre-assessments API tests
├── integration/
│   └── assessment-workflow.test.ts   # End-to-end workflow tests
└── README.md                         # This file
```

## Test Categories

### Unit Tests
- **Authentication Tests** (`auth.test.ts`)
  - User registration and validation
  - Login with credentials
  - JWT token handling
  - Error scenarios

- **Buildings Tests** (`buildings.test.ts`)
  - CRUD operations
  - Data validation
  - Search and filtering
  - Deletion constraints

- **Assessments Tests** (`assessments.test.ts`)
  - Assessment lifecycle
  - Status management
  - Relationship integrity
  - Permission handling

- **Pre-Assessments Tests** (`pre-assessments.test.ts`)
  - Pre-assessment configuration
  - Element selection
  - Checklist validation
  - Draft/completion workflow

### Integration Tests
- **Assessment Workflow** (`integration/assessment-workflow.test.ts`)
  - Complete end-to-end assessment process
  - Data integrity across related entities
  - Error handling and rollback scenarios
  - Performance under realistic conditions

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests for CI/CD
```bash
npm run test:ci
```

## Test Configuration

### Database Setup
Tests use mocked database connections by default. For integration tests, you may want to set up a test database:

```bash
# Create test database
createdb onyx_test

# Set test environment variables
export NODE_ENV=test
export DATABASE_URL=postgresql://user:password@localhost:5432/onyx_test
```

### Environment Variables
The test suite uses these environment variables:
- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret`
- `JWT_REFRESH_SECRET=test-refresh-secret`
- `DATABASE_URL=postgresql://test:test@localhost:5432/onyx_test`

## Test Utilities

### Mocked Services
- Database connections (PostgreSQL)
- JWT token generation/verification
- Password hashing (bcrypt)
- File upload (Cloudinary)
- Email services

### Test Data
Each test creates its own mock data to ensure isolation. Common test fixtures include:
- Test users with different roles
- Sample buildings with various types
- Assessment configurations
- Pre-assessment checklists

## Coverage Goals

Target coverage levels:
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

### Key Areas Covered
- ✅ Authentication and authorization
- ✅ CRUD operations for all entities
- ✅ Data validation and error handling
- ✅ Business logic (FCI calculations)
- ✅ Workflow state management
- ✅ Database integrity constraints
- ✅ API endpoint security
- ✅ Integration between services

## Testing Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Mocking**: External dependencies are mocked for unit tests
3. **Realistic Data**: Test data represents real-world scenarios
4. **Error Cases**: Both success and failure paths are tested
5. **Performance**: Tests complete quickly for rapid feedback
6. **Maintainability**: Tests are readable and well-documented

## Common Test Patterns

### API Endpoint Testing
```typescript
it('should create resource successfully', async () => {
  const mockData = { /* test data */ };
  mockPool.query.mockResolvedValueOnce({ rows: [mockData] });
  
  const response = await request(app)
    .post('/api/resource')
    .send(mockData);
    
  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
});
```

### Validation Testing
```typescript
it('should reject invalid data', async () => {
  const invalidData = { /* invalid test data */ };
  
  const response = await request(app)
    .post('/api/resource')
    .send(invalidData);
    
  expect(response.status).toBe(400);
  expect(response.body.errors).toBeDefined();
});
```

### Authentication Testing
```typescript
it('should require authentication', async () => {
  const response = await request(app)
    .get('/api/protected-resource');
    
  expect(response.status).toBe(401);
});
```

## Continuous Integration

Tests are designed to run in CI/CD environments:
- No external dependencies required
- Deterministic results
- Proper cleanup after execution
- Detailed error reporting

## Troubleshooting

### Common Issues
1. **Database Connection Errors**: Ensure DATABASE_URL is set correctly for integration tests
2. **Timeout Issues**: Increase jest timeout for slow tests
3. **Mock Conflicts**: Clear mocks between tests using `jest.clearAllMocks()`
4. **Async Issues**: Use `await` and `waitFor` properly for async operations

### Debug Mode
Run tests with debug output:
```bash
DEBUG=test npm test
```

## Contributing

When adding new features:
1. Write tests before implementation (TDD)
2. Ensure all test categories are covered
3. Update this README if new test patterns are introduced
4. Maintain high coverage standards
5. Follow the existing test structure and naming conventions
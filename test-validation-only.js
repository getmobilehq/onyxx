// Test validation without making actual request
import { body, validationResult } from 'express-validator';

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('role')
    .isIn(['admin', 'manager', 'assessor'])
    .withMessage('Invalid role'),
];

const testData = {
  name: "joseph jones",
  email: "josephagunbiadehq@gmail.com", 
  password: "Acc355c0d3",
  role: "admin"
};

console.log('Testing validation for:', testData);

// Create mock request/response objects
const mockReq = {
  body: testData
};

const mockRes = {};

// Run validation
const runValidation = async () => {
  for (const validator of registerValidation) {
    await validator.run(mockReq);
  }
  
  const errors = validationResult(mockReq);
  
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors found:');
    errors.array().forEach(error => {
      console.log(`  ${error.path}: ${error.msg}`);
    });
  } else {
    console.log('✅ All validation passed!');
  }
};

runValidation().catch(console.error);
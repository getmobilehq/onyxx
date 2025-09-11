import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ApiResponse, ValidationError } from '../../../shared-types';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 */
export function validate<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body
      const validated = await schema.parseAsync(req.body);
      
      // Replace request body with validated data
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.code === 'invalid_type' ? undefined : req.body[err.path[0]]
        }));

        const response: ApiResponse<null> = {
          success: false,
          error: 'Validation failed',
          errors: validationErrors
        };

        return res.status(400).json(response);
      }

      // Non-validation error
      next(error);
    }
  };
}

/**
 * Query parameter validation middleware
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: `query.${err.path.join('.')}`,
          message: err.message
        }));

        const response: ApiResponse<null> = {
          success: false,
          error: 'Query validation failed',
          errors: validationErrors
        };

        return res.status(400).json(response);
      }

      next(error);
    }
  };
}

/**
 * Parameter validation middleware
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: `params.${err.path.join('.')}`,
          message: err.message
        }));

        const response: ApiResponse<null> = {
          success: false,
          error: 'Parameter validation failed',
          errors: validationErrors
        };

        return res.status(400).json(response);
      }

      next(error);
    }
  };
}

// ========== Common Validation Schemas ==========

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc').optional()
});

// Date range schema
export const dateRangeSchema = z.object({
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional()
}).refine(
  data => {
    if (data.date_from && data.date_to) {
      return new Date(data.date_from) <= new Date(data.date_to);
    }
    return true;
  },
  { message: 'date_from must be before date_to' }
);

// ========== Entity Validation Schemas ==========

// User schemas
export const userCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['admin', 'manager', 'assessor', 'viewer']),
  organization_id: uuidSchema.optional()
});

export const userUpdateSchema = userCreateSchema.partial().omit({ password: true });

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Building schemas
export const buildingCreateSchema = z.object({
  name: z.string().min(1).max(150),
  type: z.string().min(1).max(100),
  building_type: z.string().optional(),
  construction_type: z.string().optional(),
  year_built: z.number().min(1800).max(new Date().getFullYear()).optional(),
  square_footage: z.number().positive().optional(),
  size: z.number().positive().optional(), // Alias for square_footage
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  zip_code: z.string().max(20).optional(),
  street_address: z.string().optional(),
  cost_per_sqft: z.number().positive().optional(),
  replacement_value: z.number().positive().optional()
}).refine(
  data => data.square_footage || data.size,
  { message: 'Either square_footage or size must be provided' }
);

export const buildingUpdateSchema = buildingCreateSchema.partial();

// Assessment schemas
export const assessmentCreateSchema = z.object({
  building_id: uuidSchema,
  type: z.string().min(1).max(50),
  assessment_type: z.string().optional(),
  description: z.string().optional(),
  scheduled_date: z.string().datetime().optional(),
  assigned_to_user_id: uuidSchema.optional(),
  assessor_name: z.string().max(100).optional(),
  notes: z.string().optional()
});

export const assessmentUpdateSchema = z.object({
  type: z.string().min(1).max(50).optional(),
  assessment_type: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  scheduled_date: z.string().datetime().optional(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  completion_date: z.string().datetime().optional(),
  assigned_to_user_id: uuidSchema.optional(),
  assessor_name: z.string().max(100).optional(),
  notes: z.string().optional(),
  total_repair_cost: z.number().min(0).optional(),
  fci_score: z.number().min(0).max(1).optional(),
  replacement_value: z.number().positive().optional(),
  immediate_repair_cost: z.number().min(0).optional(),
  short_term_repair_cost: z.number().min(0).optional(),
  long_term_repair_cost: z.number().min(0).optional()
});

// Assessment Element schemas
export const assessmentElementUpdateSchema = z.object({
  condition_rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  photo_urls: z.array(z.string().url()).optional(),
  deficiencies: z.array(z.object({
    description: z.string().min(1),
    cost: z.number().min(0).optional(),
    category: z.enum([
      'life_safety',
      'critical_systems',
      'energy_efficiency',
      'asset_life_cycle',
      'user_experience',
      'equity_accessibility'
    ]),
    photos: z.array(z.string().url()).optional()
  })).optional()
});

// Report schemas
export const reportCreateSchema = z.object({
  assessment_id: uuidSchema.optional(),
  building_id: uuidSchema,
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  report_type: z.enum(['facility_condition', 'energy_audit', 'maintenance', 'capital_planning']).optional(),
  assessment_date: z.string().datetime().optional(),
  assessor_name: z.string().max(100).optional()
});

// Pre-assessment schemas
export const preAssessmentCreateSchema = z.object({
  assessment_id: uuidSchema,
  building_id: uuidSchema,
  assessment_type: z.string().min(1).max(50),
  assessment_date: z.string().datetime(),
  assessment_scope: z.string().min(1).max(100),
  building_size: z.number().positive(),
  building_type: z.string().optional(),
  replacement_value: z.number().positive().optional(),
  selected_elements: z.array(z.string()),
  checklist: z.object({
    buildingPlans: z.boolean().optional(),
    keyStakeholders: z.boolean().optional(),
    previousReports: z.boolean().optional(),
    safetyEquipment: z.boolean().optional(),
    accessPermissions: z.boolean().optional(),
    weatherConditions: z.boolean().optional(),
    emergencyProcedures: z.boolean().optional(),
    equipmentCalibration: z.boolean().optional()
  }),
  additional_notes: z.string().optional(),
  assessor_name: z.string().max(100).optional()
});

// ========== Custom Validation Functions ==========

/**
 * Validates that at least one field in a group is provided
 */
export function requireAtLeastOne(fields: string[]) {
  return (data: any) => {
    const hasAtLeastOne = fields.some(field => data[field] !== undefined);
    if (!hasAtLeastOne) {
      throw new Error(`At least one of ${fields.join(', ')} is required`);
    }
    return data;
  };
}

/**
 * Validates conditional requirements
 */
export function conditionalRequire(field: string, condition: (data: any) => boolean) {
  return (data: any) => {
    if (condition(data) && !data[field]) {
      throw new Error(`${field} is required when ${condition.toString()}`);
    }
    return data;
  };
}

/**
 * Sanitizes input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and sanitizes an entire object
 */
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

// Export a combined validation middleware that includes sanitization
export function validateAndSanitize<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize input first
      req.body = sanitizeObject(req.body);
      
      // Then validate
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.code === 'invalid_type' ? undefined : req.body[err.path[0]]
        }));

        const response: ApiResponse<null> = {
          success: false,
          error: 'Validation failed',
          errors: validationErrors
        };

        return res.status(400).json(response);
      }

      next(error);
    }
  };
}
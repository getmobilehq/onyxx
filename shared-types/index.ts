/**
 * Shared TypeScript interfaces for API contracts between frontend and backend
 * These interfaces ensure type safety across the entire application
 */

// ========== User & Auth ==========
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'assessor' | 'viewer';
  organization_id: string;
  is_organization_owner?: boolean;
  is_platform_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken?: string;
  user: User;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organization_name?: string;
  token?: string;
}

// ========== Organization ==========
export interface Organization {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  subscription_plan?: 'free' | 'basic' | 'pro' | 'enterprise';
  subscription_status?: 'active' | 'inactive' | 'suspended';
  subscription_expires_at?: string;
  settings?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

// ========== Building ==========
export interface Building {
  id: string;
  name: string;
  type: string;
  building_type?: string;
  construction_type?: string;
  year_built?: number;
  square_footage?: number;
  size?: number; // Alias for square_footage
  state?: string;
  city?: string;
  zip_code?: string;
  street_address?: string;
  cost_per_sqft?: number;
  replacement_value?: number;
  image_url?: string;
  created_by_user_id?: string;
  organization_id: string;
  status?: 'pending' | 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface BuildingCreateRequest {
  name: string;
  type: string;
  building_type?: string;
  construction_type?: string;
  year_built?: number;
  square_footage?: number;
  size?: number; // Accept either field
  state?: string;
  city?: string;
  zip_code?: string;
  street_address?: string;
  cost_per_sqft?: number;
  replacement_value?: number;
  image?: File; // For image upload
}

export interface BuildingUpdateRequest extends Partial<BuildingCreateRequest> {}

// ========== Element ==========
export interface Element {
  id: string;
  major_group?: string;
  group_element?: string;
  individual_element?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

// ========== Assessment ==========
export interface Assessment {
  id: string;
  building_id: string;
  type: string;
  assessment_type?: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date?: string;
  started_at?: string;
  completed_at?: string;
  completion_date?: string;
  assigned_to_user_id?: string;
  assigned_to?: string;
  created_by_user_id?: string;
  created_by?: string;
  notes?: string;
  total_repair_cost?: number;
  fci_score?: number;
  replacement_value?: number;
  immediate_repair_cost?: number;
  short_term_repair_cost?: number;
  long_term_repair_cost?: number;
  assessor_name?: string;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  building?: Building;
  assessor?: User;
  creator?: User;
}

export interface AssessmentCreateRequest {
  building_id: string;
  type: string;
  assessment_type?: string;
  description?: string;
  scheduled_date?: string;
  assigned_to_user_id?: string;
  assessor_name?: string;
  notes?: string;
}

export interface AssessmentUpdateRequest extends Partial<AssessmentCreateRequest> {
  status?: Assessment['status'];
  started_at?: string;
  completed_at?: string;
  completion_date?: string;
  total_repair_cost?: number;
  fci_score?: number;
  replacement_value?: number;
  immediate_repair_cost?: number;
  short_term_repair_cost?: number;
  long_term_repair_cost?: number;
}

// ========== Assessment Element ==========
export interface AssessmentElement {
  id: string;
  assessment_id: string;
  element_id: string;
  condition_rating?: number;
  notes?: string;
  photo_urls?: string[];
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  element?: Element;
  deficiencies?: AssessmentDeficiency[];
}

export interface AssessmentElementUpdateRequest {
  condition_rating?: number;
  notes?: string;
  photo_urls?: string[];
  deficiencies?: AssessmentDeficiencyCreateRequest[];
}

// ========== Assessment Deficiency ==========
export interface AssessmentDeficiency {
  id: string;
  assessment_element_id: string;
  description: string;
  cost?: number;
  category: 'life_safety' | 'critical_systems' | 'energy_efficiency' | 
           'asset_life_cycle' | 'user_experience' | 'equity_accessibility';
  photos?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AssessmentDeficiencyCreateRequest {
  description: string;
  cost?: number;
  category: AssessmentDeficiency['category'];
  photos?: string[];
}

// ========== Pre-Assessment ==========
export interface PreAssessment {
  id: string;
  assessment_id: string;
  building_id: string;
  assessment_type: string;
  assessment_date: string;
  assessment_scope: string;
  building_size: number;
  building_type?: string;
  replacement_value?: number;
  selected_elements: string[];
  checklist: {
    buildingPlans?: boolean;
    keyStakeholders?: boolean;
    previousReports?: boolean;
    safetyEquipment?: boolean;
    accessPermissions?: boolean;
    weatherConditions?: boolean;
    emergencyProcedures?: boolean;
    equipmentCalibration?: boolean;
  };
  additional_notes?: string;
  assessor_name?: string;
  status?: 'draft' | 'completed';
  completed_at?: string;
  created_by_user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// ========== Report ==========
export interface Report {
  id: string;
  assessment_id?: string;
  building_id: string;
  title: string;
  description?: string;
  report_type?: 'facility_condition' | 'energy_audit' | 'maintenance' | 'capital_planning';
  status?: 'draft' | 'final' | 'published';
  assessment_date?: string;
  report_date?: string;
  created_by_user_id: string;
  assessor_name?: string;
  fci_score?: number;
  total_repair_cost?: number;
  replacement_value?: number;
  replacement_cost?: number;
  immediate_repair_cost?: number;
  short_term_repair_cost?: number;
  long_term_repair_cost?: number;
  element_count?: number;
  deficiency_count?: number;
  executive_summary?: string;
  recommendations?: any;
  systems_data?: any;
  pdf_url?: string;
  excel_url?: string;
  generated_by?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  assessment?: Assessment;
  building?: Building;
  creator?: User;
}

export interface ReportCreateRequest {
  assessment_id?: string;
  building_id: string;
  title: string;
  description?: string;
  report_type?: Report['report_type'];
  assessment_date?: string;
  assessor_name?: string;
}

// ========== API Response Wrappers ==========
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========== Query Parameters ==========
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface BuildingQuery extends PaginationQuery {
  type?: string;
  status?: Building['status'];
  search?: string;
}

export interface AssessmentQuery extends PaginationQuery {
  building_id?: string;
  status?: Assessment['status'];
  assessor_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface ReportQuery extends PaginationQuery {
  building_id?: string;
  assessment_id?: string;
  report_type?: Report['report_type'];
  status?: Report['status'];
}

// ========== Statistics & Analytics ==========
export interface DashboardStats {
  totalBuildings: number;
  totalAssessments: number;
  completedAssessments: number;
  averageFCI: number;
  totalRepairCost: number;
  criticalIssues: number;
}

export interface BuildingAnalytics {
  building_id: string;
  building_name: string;
  fci_trend: Array<{ date: string; fci: number }>;
  cost_breakdown: {
    immediate: number;
    short_term: number;
    long_term: number;
  };
  deficiency_categories: Array<{
    category: string;
    count: number;
    total_cost: number;
  }>;
}

// ========== Error Types ==========
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// ========== Type Guards ==========
export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

export function isBuilding(obj: any): obj is Building {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

export function isAssessment(obj: any): obj is Assessment {
  return obj && typeof obj.id === 'string' && typeof obj.building_id === 'string';
}

export function isApiError(obj: any): obj is ApiError {
  return obj && typeof obj.code === 'string' && typeof obj.message === 'string';
}

// ========== Utility Types ==========
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
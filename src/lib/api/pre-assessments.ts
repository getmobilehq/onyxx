import api from '@/services/api';

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
  selected_elements: any[];
  checklist: {
    buildingPlans: boolean;
    accessPermissions: boolean;
    safetyEquipment: boolean;
    previousReports: boolean;
    keyStakeholders: boolean;
    weatherConditions: boolean;
    emergencyProcedures: boolean;
    equipmentCalibration: boolean;
  };
  additional_notes?: string;
  assessor_name?: string;
  status: 'draft' | 'completed';
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by_user_id?: string;
}

export interface CreatePreAssessmentData {
  assessment_id: string;
  building_id: string;
  assessment_type: string;
  assessment_date: string;
  assessment_scope: string;
  building_size: number;
  building_type?: string;
  replacement_value?: number;
  selected_elements: any[];
  checklist: Record<string, boolean>;
  additional_notes?: string;
  assessor_name?: string;
  status?: 'draft' | 'completed';
}

export const preAssessmentsApi = {
  // Get pre-assessment by assessment ID
  getByAssessmentId: async (assessmentId: string): Promise<PreAssessment> => {
    const response = await api.get(`/pre-assessments/assessment/${assessmentId}`);
    return response.data.data.preAssessment;
  },

  // Get pre-assessment by building ID (latest)
  getByBuildingId: async (buildingId: string): Promise<PreAssessment> => {
    const response = await api.get(`/pre-assessments/building/${buildingId}`);
    return response.data.data.preAssessment;
  },

  // Create or update pre-assessment
  save: async (data: CreatePreAssessmentData): Promise<PreAssessment> => {
    const response = await api.post('/pre-assessments', data);
    return response.data.data.preAssessment;
  },

  // Update pre-assessment
  update: async (data: CreatePreAssessmentData): Promise<PreAssessment> => {
    const response = await api.put('/pre-assessments', data);
    return response.data.data.preAssessment;
  },

  // Delete pre-assessment
  delete: async (id: string): Promise<void> => {
    await api.delete(`/pre-assessments/${id}`);
  },

  // Get all pre-assessments with pagination and filters
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    building_id?: string;
  }): Promise<{
    preAssessments: PreAssessment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> => {
    const response = await api.get('/pre-assessments', { params });
    return response.data.data;
  },
};
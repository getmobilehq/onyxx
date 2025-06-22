import { useState, useEffect } from 'react';
import { assessmentsAPI, elementsAPI } from '@/services/api';
import { toast } from 'sonner';

export function useAssessments() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = async (params?: {
    building_id?: string;
    type?: string;
    status?: string;
    assigned_to?: string;
    limit?: number;
    offset?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await assessmentsAPI.getAll(params);
      if (response.data.success) {
        setAssessments(response.data.data.assessments);
      } else {
        throw new Error('Failed to fetch assessments');
      }
    } catch (err: any) {
      console.error('Failed to fetch assessments:', err);
      setError(err.response?.data?.message || 'Failed to fetch assessments');
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const getAssessment = async (id: string) => {
    try {
      const response = await assessmentsAPI.getById(id);
      if (response.data.success && response.data.data.assessment) {
        return response.data.data.assessment;
      } else {
        throw new Error('Assessment not found');
      }
    } catch (err: any) {
      toast.error('Failed to load assessment details');
      throw err;
    }
  };

  const createAssessment = async (data: {
    building_id: string;
    type: 'pre_assessment' | 'field_assessment';
    description?: string;
    scheduled_date?: string;
    assigned_to_user_id?: string;
  }) => {
    try {
      console.log('🔄 Creating assessment via API...');
      const response = await assessmentsAPI.create(data);
      console.log('📊 API response:', response.data);
      
      if (response.data.success) {
        console.log('✅ Assessment created, skipping fetchAssessments for now...');
        // Skip fetchAssessments to avoid hanging - we'll refresh when user returns to assessments list
        // await fetchAssessments();
        toast.success('Assessment created successfully');
        return response.data.data.assessment;
      } else {
        throw new Error('Failed to create assessment');
      }
    } catch (err: any) {
      console.error('❌ Create assessment error:', err);
      toast.error('Failed to create assessment');
      throw err;
    }
  };

  const updateAssessment = async (id: string, data: any) => {
    try {
      const response = await assessmentsAPI.update(id, data);
      if (response.data.success) {
        await fetchAssessments();
        toast.success('Assessment updated successfully');
        return response.data.data.assessment;
      } else {
        throw new Error('Failed to update assessment');
      }
    } catch (err: any) {
      toast.error('Failed to update assessment');
      throw err;
    }
  };

  const deleteAssessment = async (id: string) => {
    try {
      const response = await assessmentsAPI.delete(id);
      if (response.data.success) {
        await fetchAssessments();
        toast.success('Assessment deleted successfully');
      } else {
        throw new Error('Failed to delete assessment');
      }
    } catch (err: any) {
      toast.error('Failed to delete assessment');
      throw err;
    }
  };

  const getAssessmentElements = async (assessmentId: string, majorGroup?: string) => {
    try {
      const response = await assessmentsAPI.getElements(assessmentId, majorGroup);
      if (response.data.success) {
        return response.data.data.elements;
      } else {
        throw new Error('Failed to fetch assessment elements');
      }
    } catch (err: any) {
      toast.error('Failed to load assessment elements');
      throw err;
    }
  };

  const updateAssessmentElement = async (
    assessmentId: string, 
    elementId: string, 
    data: {
      condition_rating?: number;
      notes?: string;
      photo_urls?: string[];
    }
  ) => {
    try {
      const response = await assessmentsAPI.updateElement(assessmentId, elementId, data);
      if (response.data.success) {
        toast.success('Element assessment updated');
        return response.data.data.assessment_element;
      } else {
        throw new Error('Failed to update element assessment');
      }
    } catch (err: any) {
      toast.error('Failed to update element assessment');
      throw err;
    }
  };

  return {
    assessments,
    loading,
    error,
    fetchAssessments,
    getAssessment,
    createAssessment,
    updateAssessment,
    deleteAssessment,
    getAssessmentElements,
    updateAssessmentElement,
  };
}

export function useElements() {
  const [elements, setElements] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchElements = async (params?: { major_group?: string; search?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await elementsAPI.getAll(params);
      if (response.data.success) {
        setElements(response.data.data.elements);
      } else {
        throw new Error('Failed to fetch elements');
      }
    } catch (err: any) {
      console.error('Failed to fetch elements:', err);
      setError(err.response?.data?.message || 'Failed to fetch elements');
      setElements([]);
    } finally {
      setLoading(false);
    }
  };

  const getElement = async (id: string) => {
    try {
      const response = await elementsAPI.getById(id);
      if (response.data.success && response.data.data.element) {
        return response.data.data.element;
      } else {
        throw new Error('Element not found');
      }
    } catch (err: any) {
      toast.error('Failed to load element details');
      throw err;
    }
  };

  const seedElements = async () => {
    try {
      const response = await elementsAPI.seed();
      if (response.data.success) {
        toast.success('Elements seeded successfully');
        await fetchElements();
        return response.data;
      } else {
        throw new Error('Failed to seed elements');
      }
    } catch (err: any) {
      toast.error('Failed to seed elements');
      throw err;
    }
  };

  useEffect(() => {
    fetchElements();
  }, []);

  return {
    elements,
    loading,
    error,
    fetchElements,
    getElement,
    seedElements,
  };
}
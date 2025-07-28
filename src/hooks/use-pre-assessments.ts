import { useState, useCallback } from 'react';
import { preAssessmentsApi, PreAssessment, CreatePreAssessmentData } from '@/lib/api/pre-assessments';
import { toast } from 'sonner';

export function usePreAssessments() {
  const [preAssessments, setPreAssessments] = useState<PreAssessment[]>([]);
  const [currentPreAssessment, setCurrentPreAssessment] = useState<PreAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get pre-assessment by assessment ID
  const getByAssessmentId = useCallback(async (assessmentId: string): Promise<PreAssessment | null> => {
    try {
      setLoading(true);
      setError(null);
      const preAssessment = await preAssessmentsApi.getByAssessmentId(assessmentId);
      setCurrentPreAssessment(preAssessment);
      return preAssessment;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch pre-assessment';
      setError(errorMessage);
      if (error.response?.status !== 404) {
        toast.error(errorMessage);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get pre-assessment by building ID
  const getByBuildingId = useCallback(async (buildingId: string): Promise<PreAssessment | null> => {
    try {
      setLoading(true);
      setError(null);
      const preAssessment = await preAssessmentsApi.getByBuildingId(buildingId);
      setCurrentPreAssessment(preAssessment);
      return preAssessment;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch pre-assessment';
      setError(errorMessage);
      if (error.response?.status !== 404) {
        toast.error(errorMessage);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save pre-assessment (create or update)
  const savePreAssessment = useCallback(async (data: CreatePreAssessmentData): Promise<PreAssessment | null> => {
    try {
      setLoading(true);
      setError(null);
      const preAssessment = await preAssessmentsApi.save(data);
      setCurrentPreAssessment(preAssessment);
      
      // Update the list if we have it loaded
      setPreAssessments(prev => {
        const existingIndex = prev.findIndex(pa => pa.assessment_id === preAssessment.assessment_id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = preAssessment;
          return updated;
        } else {
          return [preAssessment, ...prev];
        }
      });

      toast.success('Pre-assessment saved successfully');
      return preAssessment;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save pre-assessment';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save draft pre-assessment
  const saveDraft = useCallback(async (data: CreatePreAssessmentData): Promise<PreAssessment | null> => {
    const draftData = { ...data, status: 'draft' as const };
    return savePreAssessment(draftData);
  }, [savePreAssessment]);

  // Complete pre-assessment
  const completePreAssessment = useCallback(async (data: CreatePreAssessmentData): Promise<PreAssessment | null> => {
    const completedData = { ...data, status: 'completed' as const };
    return savePreAssessment(completedData);
  }, [savePreAssessment]);

  // Delete pre-assessment
  const deletePreAssessment = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await preAssessmentsApi.delete(id);
      
      // Remove from list
      setPreAssessments(prev => prev.filter(pa => pa.id !== id));
      
      // Clear current if it was deleted
      if (currentPreAssessment?.id === id) {
        setCurrentPreAssessment(null);
      }

      toast.success('Pre-assessment deleted successfully');
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete pre-assessment';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentPreAssessment]);

  // Fetch all pre-assessments
  const fetchPreAssessments = useCallback(async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    building_id?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await preAssessmentsApi.getAll(params);
      setPreAssessments(data.preAssessments);
      return data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch pre-assessments';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear current pre-assessment
  const clearCurrent = useCallback(() => {
    setCurrentPreAssessment(null);
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    preAssessments,
    currentPreAssessment,
    loading,
    error,
    getByAssessmentId,
    getByBuildingId,
    savePreAssessment,
    saveDraft,
    completePreAssessment,
    deletePreAssessment,
    fetchPreAssessments,
    clearCurrent,
    clearError,
  };
}
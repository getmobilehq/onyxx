import { useState } from 'react';
import { reportsAPI } from '@/services/api';
import { toast } from 'sonner';

export function useReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async (params?: {
    building_id?: string;
    status?: string;
    report_type?: string;
    assessor?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await reportsAPI.getAll(params);
      if (response.data.success) {
        setReports(response.data.data.reports);
      } else {
        throw new Error('Failed to fetch reports');
      }
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      setError(err.response?.data?.message || 'Failed to fetch reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const getReport = async (id: string) => {
    try {
      const response = await reportsAPI.getById(id);
      if (response.data.success && response.data.data.report) {
        return response.data.data.report;
      } else {
        throw new Error('Report not found');
      }
    } catch (err: any) {
      toast.error('Failed to load report details');
      throw err;
    }
  };

  const createReport = async (data: {
    assessment_id?: string;
    building_id: string;
    title: string;
    description?: string;
    report_type?: 'facility_condition' | 'maintenance_plan' | 'capital_assessment';
    status?: 'draft' | 'published' | 'archived';
    assessment_date?: string;
    assessor_name?: string;
    fci_score?: number;
    total_repair_cost?: number;
    replacement_value?: number;
    immediate_repair_cost?: number;
    short_term_repair_cost?: number;
    long_term_repair_cost?: number;
    element_count?: number;
    deficiency_count?: number;
    executive_summary?: string;
    recommendations?: any[];
    systems_data?: any;
  }) => {
    try {
      const response = await reportsAPI.create(data);
      if (response.data.success) {
        await fetchReports();
        toast.success('Report created successfully');
        return response.data.data.report;
      } else {
        throw new Error('Failed to create report');
      }
    } catch (err: any) {
      toast.error('Failed to create report');
      throw err;
    }
  };

  const updateReport = async (id: string, data: any) => {
    try {
      const response = await reportsAPI.update(id, data);
      if (response.data.success) {
        await fetchReports();
        toast.success('Report updated successfully');
        return response.data.data.report;
      } else {
        throw new Error('Failed to update report');
      }
    } catch (err: any) {
      toast.error('Failed to update report');
      throw err;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const response = await reportsAPI.delete(id);
      if (response.data.success) {
        await fetchReports();
        toast.success('Report deleted successfully');
      } else {
        throw new Error('Failed to delete report');
      }
    } catch (err: any) {
      toast.error('Failed to delete report');
      throw err;
    }
  };

  const generateReportFromAssessment = async (assessmentId: string) => {
    try {
      const response = await reportsAPI.generateFromAssessment(assessmentId);
      if (response.data.success) {
        await fetchReports();
        toast.success('Report generated successfully from assessment');
        return response.data.data.report;
      } else {
        throw new Error('Failed to generate report from assessment');
      }
    } catch (err: any) {
      toast.error('Failed to generate report from assessment');
      throw err;
    }
  };

  const downloadReport = async (id: string) => {
    try {
      const response = await reportsAPI.download(id);
      // Handle blob download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch (err: any) {
      toast.error('Failed to download report');
      throw err;
    }
  };

  return {
    reports,
    loading,
    error,
    fetchReports,
    getReport,
    createReport,
    updateReport,
    deleteReport,
    generateReportFromAssessment,
    downloadReport,
  };
}
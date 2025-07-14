import { useState, useEffect } from 'react';
import { reportsAPI } from '@/services/api';
import { toast } from 'sonner';

export function useReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await reportsAPI.getAll();
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

  const getReportsByBuilding = async (buildingId: string) => {
    try {
      const response = await reportsAPI.getByBuildingId(buildingId);
      if (response.data.success) {
        return response.data.data.reports;
      } else {
        throw new Error('Failed to fetch building reports');
      }
    } catch (err: any) {
      toast.error('Failed to load building reports');
      throw err;
    }
  };

  const generateReport = async (assessmentId: string) => {
    try {
      const response = await reportsAPI.generate(assessmentId);
      if (response.data.success) {
        await fetchReports();
        toast.success('Report generated successfully');
        return response.data.data.report;
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (err: any) {
      toast.error('Failed to generate report');
      throw err;
    }
  };

  const downloadReport = async (id: string) => {
    try {
      const response = await reportsAPI.download(id);
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report downloaded successfully');
    } catch (err: any) {
      toast.error('Failed to download report');
      throw err;
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    error,
    fetchReports,
    getReport,
    getReportsByBuilding,
    generateReport,
    downloadReport,
  };
}
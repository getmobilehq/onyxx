import { useState, useEffect } from 'react';
import { buildingsAPI, assessmentsAPI, reportsAPI } from '@/services/api';

interface DashboardMetrics {
  totalBuildings: number;
  assessmentsYTD: number;
  averageFCI: number;
  estimatedRepairs: number;
}

interface BuildingAtRisk {
  id: string;
  name: string;
  fci: number;
  status: string;
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalBuildings: 0,
    assessmentsYTD: 0,
    averageFCI: 0,
    estimatedRepairs: 0,
  });
  const [buildingsAtRisk, setBuildingsAtRisk] = useState<BuildingAtRisk[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState<any[]>([]);
  const [fciDistribution, setFciDistribution] = useState<any[]>([]);
  const [fciTrend, setFciTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [buildingsRes, assessmentsRes, reportsRes] = await Promise.all([
        buildingsAPI.getAll(),
        assessmentsAPI.getAll({ limit: 10 }),
        reportsAPI.getAll(),
      ]);

      // Process buildings data
      if (buildingsRes.data.success) {
        const buildings = buildingsRes.data.data.buildings;
        setMetrics(prev => ({ ...prev, totalBuildings: buildings.length }));

        // Calculate buildings at risk (FCI > 0.10)
        const atRisk = buildings
          .filter((b: any) => b.fci_score && b.fci_score > 0.10)
          .map((b: any) => ({
            id: b.id,
            name: b.name,
            fci: b.fci_score || 0,
            status: b.fci_score > 0.30 ? 'critical' : b.fci_score > 0.20 ? 'warning' : 'attention',
          }))
          .sort((a: BuildingAtRisk, b: BuildingAtRisk) => b.fci - a.fci)
          .slice(0, 5);
        setBuildingsAtRisk(atRisk);

        // Calculate FCI distribution
        const distribution = [
          { condition: 'Good', value: buildings.filter((b: any) => b.fci_score && b.fci_score <= 0.05).length },
          { condition: 'Fair', value: buildings.filter((b: any) => b.fci_score && b.fci_score > 0.05 && b.fci_score <= 0.10).length },
          { condition: 'Poor', value: buildings.filter((b: any) => b.fci_score && b.fci_score > 0.10 && b.fci_score <= 0.30).length },
          { condition: 'Critical', value: buildings.filter((b: any) => b.fci_score && b.fci_score > 0.30).length },
        ];
        setFciDistribution(distribution);
      }

      // Process assessments data
      if (assessmentsRes.data.success) {
        const assessments = assessmentsRes.data.data.assessments;
        
        // Count assessments this year
        const currentYear = new Date().getFullYear();
        const assessmentsThisYear = assessments.filter((a: any) => 
          new Date(a.created_at).getFullYear() === currentYear
        ).length;
        setMetrics(prev => ({ ...prev, assessmentsYTD: assessmentsThisYear }));

        // Separate recent and upcoming
        const now = new Date();
        const recent = assessments
          .filter((a: any) => a.status === 'completed' || new Date(a.scheduled_date) < now)
          .slice(0, 5);
        const upcoming = assessments
          .filter((a: any) => a.status !== 'completed' && new Date(a.scheduled_date) >= now)
          .slice(0, 5);
        
        setRecentAssessments(recent);
        setUpcomingAssessments(upcoming);
      }

      // Process reports data
      if (reportsRes.data.success) {
        const reports = reportsRes.data.data.reports;
        
        // Calculate average FCI and total repair costs
        if (reports.length > 0) {
          const totalFCI = reports.reduce((sum: number, r: any) => sum + (r.fci_score || 0), 0);
          const avgFCI = totalFCI / reports.length;
          const totalRepairs = reports.reduce((sum: number, r: any) => sum + (r.total_repair_cost || 0), 0);
          
          setMetrics(prev => ({
            ...prev,
            averageFCI: avgFCI,
            estimatedRepairs: totalRepairs,
          }));

          // Calculate FCI trend (last 6 months)
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          
          const trendData = [];
          for (let i = 0; i < 6; i++) {
            const month = new Date(sixMonthsAgo);
            month.setMonth(month.getMonth() + i);
            const monthReports = reports.filter((r: any) => {
              const reportDate = new Date(r.created_at);
              return reportDate.getMonth() === month.getMonth() && 
                     reportDate.getFullYear() === month.getFullYear();
            });
            
            const monthAvgFCI = monthReports.length > 0
              ? monthReports.reduce((sum: number, r: any) => sum + (r.fci_score || 0), 0) / monthReports.length
              : 0;
            
            trendData.push({
              month: month.toLocaleDateString('en-US', { month: 'short' }),
              fci: Number((monthAvgFCI * 100).toFixed(1)),
            });
          }
          setFciTrend(trendData);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      
      // Set default values on error
      setMetrics({
        totalBuildings: 0,
        assessmentsYTD: 0,
        averageFCI: 0,
        estimatedRepairs: 0,
      });
      setBuildingsAtRisk([]);
      setRecentAssessments([]);
      setUpcomingAssessments([]);
      setFciDistribution([]);
      setFciTrend([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    metrics,
    buildingsAtRisk,
    recentAssessments,
    upcomingAssessments,
    fciDistribution,
    fciTrend,
    loading,
    error,
    refreshDashboard: fetchDashboardData,
  };
}
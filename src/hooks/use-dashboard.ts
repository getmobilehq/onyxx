import { useState, useEffect } from 'react';
import { buildingsAPI, assessmentsAPI } from '@/services/api';

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
      const [buildingsRes, assessmentsRes] = await Promise.all([
        buildingsAPI.getAll(),
        assessmentsAPI.getAll({ limit: 10 }),
      ]);

      // Process buildings data
      if (buildingsRes.data.success) {
        const buildings = buildingsRes.data.data.buildings || [];
        setMetrics(prev => ({ ...prev, totalBuildings: buildings.length }));

        // Calculate buildings at risk (FCI > 0.10)
        const atRisk = buildings
          .filter((b: any) => b.fci_score && parseFloat(b.fci_score) > 0.10)
          .map((b: any) => ({
            id: b.id,
            name: b.name,
            fci: parseFloat(b.fci_score) || 0,
            status: parseFloat(b.fci_score) > 0.30 ? 'critical' : parseFloat(b.fci_score) > 0.20 ? 'warning' : 'attention',
          }))
          .sort((a: BuildingAtRisk, b: BuildingAtRisk) => b.fci - a.fci)
          .slice(0, 5);
        setBuildingsAtRisk(atRisk);

        // Calculate FCI distribution
        const distribution = [
          { name: 'Excellent', value: buildings.filter((b: any) => b.fci_score && parseFloat(b.fci_score) <= 0.05).length },
          { name: 'Good', value: buildings.filter((b: any) => b.fci_score && parseFloat(b.fci_score) > 0.05 && parseFloat(b.fci_score) <= 0.10).length },
          { name: 'Fair', value: buildings.filter((b: any) => b.fci_score && parseFloat(b.fci_score) > 0.10 && parseFloat(b.fci_score) <= 0.30).length },
          { name: 'Critical', value: buildings.filter((b: any) => b.fci_score && parseFloat(b.fci_score) > 0.30).length },
        ];
        setFciDistribution(distribution);
      }

      // Process assessments data
      if (assessmentsRes.data.success) {
        const assessments = assessmentsRes.data.data.assessments || [];
        
        // Count assessments this year
        const currentYear = new Date().getFullYear();
        const assessmentsThisYear = assessments.filter((a: any) => 
          new Date(a.created_at).getFullYear() === currentYear
        ).length;
        setMetrics(prev => ({ ...prev, assessmentsYTD: assessmentsThisYear }));

        // Separate recent and upcoming
        const now = new Date();
        const recent = assessments
          .filter((a: any) => a.status === 'completed' || (a.scheduled_date && new Date(a.scheduled_date) < now))
          .slice(0, 5);
        const upcoming = assessments
          .filter((a: any) => a.status !== 'completed' && a.scheduled_date && new Date(a.scheduled_date) >= now)
          .slice(0, 5);
        
        setRecentAssessments(recent);
        setUpcomingAssessments(upcoming);

        // Calculate average FCI from buildings with FCI scores
        const buildingsWithFCI = buildings.filter((b: any) => b.fci_score && parseFloat(b.fci_score) > 0);
        let avgFCI = 0;
        if (buildingsWithFCI.length > 0) {
          const totalFCI = buildingsWithFCI.reduce((sum: number, b: any) => sum + parseFloat(b.fci_score), 0);
          avgFCI = totalFCI / buildingsWithFCI.length;
          
          // Calculate estimated repairs using actual building replacement values
          const buildings = buildingsRes.data.data.buildings || [];
          const totalReplacementValue = buildings.reduce((sum: number, building: any) => {
            // Use actual replacement value from building data, fallback to reasonable estimates based on square footage
            if (building.replacement_value) {
              return sum + parseFloat(building.replacement_value);
            } else if (building.square_footage) {
              // Fallback: estimate $200 per sq ft for replacement value
              return sum + (building.square_footage * 200);
            } else {
              // Last resort fallback for buildings without size data
              return sum + 1500000; // $1.5M average
            }
          }, 0);
          
          // Calculate estimated repairs based on individual building FCIs and replacement values
          const estimatedRepairs = buildings.reduce((sum: number, building: any) => {
            const fci = building.fci_score ? parseFloat(building.fci_score) : 0;
            let replacementValue = 0;
            
            if (building.replacement_value) {
              replacementValue = parseFloat(building.replacement_value);
            } else if (building.square_footage) {
              replacementValue = building.square_footage * 200; // $200/sqft estimate
            } else {
              replacementValue = 1500000; // Default $1.5M
            }
            
            return sum + (fci * replacementValue);
          }, 0);
          
          setMetrics(prev => ({
            ...prev,
            averageFCI: avgFCI,
            estimatedRepairs: estimatedRepairs,
          }));
        }

        // Calculate FCI trend from assessments (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const trendData = [];
        for (let i = 0; i < 6; i++) {
          const month = new Date(sixMonthsAgo);
          month.setMonth(month.getMonth() + i);
          const monthAssessments = assessments.filter((a: any) => {
            const assessmentDate = new Date(a.created_at);
            return assessmentDate.getMonth() === month.getMonth() && 
                   assessmentDate.getFullYear() === month.getFullYear() &&
                   a.status === 'completed' && a.fci_score;
          });
          
          const monthAvgFCI = monthAssessments.length > 0
            ? monthAssessments.reduce((sum: number, a: any) => sum + (a.fci_score || 0), 0) / monthAssessments.length
            : null; // Use null for no data instead of 0
          
          if (monthAvgFCI !== null) {
            trendData.push({
              month: month.toLocaleDateString('en-US', { month: 'short' }),
              fci: Number((monthAvgFCI * 100).toFixed(1)),
            });
          }
        }
        setFciTrend(trendData);
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
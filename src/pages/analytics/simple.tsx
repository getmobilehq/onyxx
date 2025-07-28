import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Calendar, Target, DollarSign } from 'lucide-react';
import { analyticsAPI } from '@/services/api';

interface AnalyticsData {
  summary: {
    total_buildings: number;
    avg_age: number;
    avg_fci: number | null;
    avg_cost_per_sqft: number;
    avg_repair_cost_per_sqft: number;
  };
}

export function SimpleAnalyticsPage() {
  console.log('SimpleAnalyticsPage rendering...');
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      console.log('Fetching analytics data...');
      setLoading(true);
      setError(null);
      
      const response = await analyticsAPI.getSummary({});
      console.log('API response:', response);
      
      if (response.data.success) {
        console.log('Setting analytics data:', response.data.data);
        setAnalyticsData(response.data.data);
      } else {
        throw new Error('Failed to load analytics data');
      }
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      setError(error.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect running...');
    fetchAnalyticsData();
  }, []);

  console.log('Current state:', { loading, error, analyticsData });

  if (loading) {
    console.log('Rendering loading state...');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 space-y-4">
            <p className="text-red-500">Error loading analytics: {error}</p>
            <Button onClick={() => fetchAnalyticsData()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    console.log('Rendering no data state...');
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Rendering main content with data:', analyticsData);

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics (Simple Version)</h2>
          <p className="text-muted-foreground">
            Basic analytics dashboard to test functionality
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buildings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.total_buildings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Age</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.avg_age} years</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average FCI</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary.avg_fci !== null ? analyticsData.summary.avg_fci.toFixed(3) : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/SqFt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.summary.avg_cost_per_sqft}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Simple analytics page loaded successfully! This confirms the basic functionality works.
            The issue is likely in the charts or complex components.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
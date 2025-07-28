import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  Activity,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { analyticsAPI } from '@/services/api';

interface AnalyticsData {
  summary: {
    total_buildings: number;
    avg_age: number;
    avg_fci: number;
    avg_cost_per_sqft: number;
    avg_repair_cost_per_sqft: number;
  };
  building_analytics: any[];
  fci_age_correlation: any[];
  cost_efficiency: any[];
  cost_trends: any[];
}

export function DebugAnalyticsPage() {
  console.log('DebugAnalyticsPage rendering...');
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('12');

  useEffect(() => {
    console.log('Analytics page mounted, fetching data...');
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsAPI.getSummary({ timeRange });
      
      if (response.data.success) {
        console.log('Analytics data received:', response.data.data);
        setAnalyticsData(response.data.data);
      } else {
        throw new Error('Failed to load analytics data');
      }
    } catch (error: any) {
      console.error('Failed to fetch analytics:', error);
      setError(error.response?.data?.message || 'Failed to load analytics data');
      toast.error('Failed to load analytics data');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 75) return 'text-blue-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getEfficiencyLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
          <p className="text-xs text-muted-foreground mt-2">Check browser console for debug info</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  console.log('Rendering main analytics content...');

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics (Debug)</h2>
          <p className="text-muted-foreground">
            Detailed insights into building performance, costs, and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalyticsData} variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-5">
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
            <div className="text-2xl font-bold">{analyticsData.summary.avg_fci !== null ? analyticsData.summary.avg_fci.toFixed(3) : 'N/A'}</div>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repair Cost/SqFt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analyticsData.summary.avg_repair_cost_per_sqft}</div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs - Test Phase 1: Just the tab structure */}
      <Tabs defaultValue="efficiency" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="efficiency">Cost Efficiency</TabsTrigger>
          <TabsTrigger value="test">Test Section</TabsTrigger>
        </TabsList>

        {/* Cost Efficiency Analysis - This should work since it's just plain components */}
        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Building Efficiency Rankings</CardTitle>
              <CardDescription>
                Buildings ranked by cost efficiency and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.cost_efficiency.length > 0 ? analyticsData.cost_efficiency.slice(0, 10).map((building, index) => (
                  <div key={building.building_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{building.building_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Age: {building.age} years • FCI: {building.fci?.toFixed ? building.fci.toFixed(3) : building.fci || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">${building.cost_per_sqft}/sqft</div>
                        <div className="text-xs text-muted-foreground">Base Cost</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${building.repair_cost_per_sqft || '0'}/sqft</div>
                        <div className="text-xs text-muted-foreground">Repair Cost</div>
                      </div>
                      <Badge variant="outline" className={getEfficiencyColor(building.efficiency_score)}>
                        {building.efficiency_score}% {getEfficiencyLabel(building.efficiency_score)}
                      </Badge>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground py-8">
                    No cost efficiency data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Debug version loaded successfully without charts! 
                This confirms the basic structure works. 
                The crash is likely in the Recharts components.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm"><strong>Data Available:</strong></p>
                <p className="text-xs">• FCI Age Correlation: {analyticsData.fci_age_correlation.length} items</p>
                <p className="text-xs">• Cost Efficiency: {analyticsData.cost_efficiency.length} items</p>
                <p className="text-xs">• Cost Trends: {analyticsData.cost_trends.length} items</p>
                <p className="text-xs">• Building Analytics: {analyticsData.building_analytics.length} items</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
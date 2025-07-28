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
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function FixedAnalyticsPage() {
  console.log('FixedAnalyticsPage rendering...');
  
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
          <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics</h2>
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

      {/* Analytics Tabs */}
      <Tabs defaultValue="cost-efficiency" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cost-efficiency">Cost Efficiency</TabsTrigger>
          <TabsTrigger value="trends">Cost Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="age-fci">Age vs FCI</TabsTrigger>
        </TabsList>

        {/* Cost Efficiency Analysis */}
        <TabsContent value="cost-efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Building Efficiency Rankings</CardTitle>
              <CardDescription>
                Buildings ranked by cost efficiency and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.cost_efficiency && analyticsData.cost_efficiency.length > 0 ? 
                  analyticsData.cost_efficiency.slice(0, 10).map((building, index) => (
                    <div key={building.building_id || index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{building.building_name || 'Unknown Building'}</div>
                          <div className="text-sm text-muted-foreground">
                            Age: {building.age || 'N/A'} years • FCI: {building.fci ? parseFloat(building.fci).toFixed(3) : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">${building.cost_per_sqft || '0'}/sqft</div>
                          <div className="text-xs text-muted-foreground">Base Cost</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">${building.repair_cost_per_sqft || '0'}/sqft</div>
                          <div className="text-xs text-muted-foreground">Repair Cost</div>
                        </div>
                        <Badge variant="outline" className={getEfficiencyColor(building.efficiency_score || 0)}>
                          {building.efficiency_score || 0}% {getEfficiencyLabel(building.efficiency_score || 0)}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-muted-foreground py-8">
                      No cost efficiency data available
                    </div>
                  )
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Trends - FIXED Chart */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Cost Trends</CardTitle>
              <CardDescription>
                Monthly trends in assessment counts and repair costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {analyticsData.cost_trends && analyticsData.cost_trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analyticsData.cost_trends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toFixed(2) : value, 
                          name
                        ]}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="assessment_count" 
                        fill="#8884d8" 
                        name="Assessments" 
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="avg_repair_cost" 
                        stroke="#ff7300" 
                        name="Avg Repair Cost"
                        strokeWidth={2}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No cost trend data available</p>
                      <p className="text-xs">Complete more assessments to see trends</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Overview */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Efficiency Distribution</CardTitle>
              <CardDescription>
                Buildings grouped by efficiency rating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['excellent', 'good', 'fair', 'poor'].map((rating) => {
                  const count = analyticsData.building_analytics ? analyticsData.building_analytics.filter(
                    b => b.efficiency_rating === rating
                  ).length : 0;
                  const percentage = analyticsData.summary.total_buildings > 0 ? (count / analyticsData.summary.total_buildings) * 100 : 0;
                  
                  return (
                    <div key={rating} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="capitalize font-medium">{rating}</span>
                        <span className="text-sm text-muted-foreground">
                          {count} buildings ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            rating === 'excellent' ? 'bg-green-500' :
                            rating === 'good' ? 'bg-blue-500' :
                            rating === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Age vs FCI Analysis - Simple Bar Chart */}
        <TabsContent value="age-fci" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Age vs FCI Analysis</CardTitle>
              <CardDescription>
                Building condition analysis by age groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {analyticsData.fci_age_correlation && analyticsData.fci_age_correlation.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.fci_age_correlation}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age_range" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value, name) => [
                          typeof value === 'number' ? value.toFixed(3) : value, 
                          name
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="avg_fci" fill="#8884d8" name="Average FCI" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No FCI correlation data available</p>
                      <p className="text-xs">Complete more assessments to see trends</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
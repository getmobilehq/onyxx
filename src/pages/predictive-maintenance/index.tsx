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
  LineChart,
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
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  Activity,
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  Gauge,
  Loader2,
  Settings,
  TrendingUp,
  Wrench,
  Zap,
  Target,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { predictiveMaintenanceAPI } from '@/services/api';
import { MobileResponsiveWrapper } from '@/components/mobile-responsive-wrapper';

interface MaintenancePrediction {
  building_id: string;
  building_name: string;
  prediction_type: 'component_failure' | 'major_repair' | 'system_replacement';
  predicted_date: string;
  confidence_score: number;
  estimated_cost: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
  current_fci: number;
  predicted_fci: number;
  recommendations: string[];
}

interface FailureRiskAnalysis {
  building_id: string;
  building_name: string;
  component: string;
  risk_score: number;
  time_to_failure_months: number;
  failure_probability: number;
  impact_score: number;
  maintenance_history: any[];
}

interface OptimizationSuggestion {
  building_id: string;
  building_name: string;
  suggestion_type: 'preventive' | 'corrective' | 'replacement';
  component: string;
  cost_savings: number;
  timeline: string;
  description: string;
  roi: number;
}

interface PredictiveDashboardData {
  predictions: MaintenancePrediction[];
  risk_analysis: FailureRiskAnalysis[];
  optimization_suggestions: OptimizationSuggestion[];
  summary: {
    total_predictions: number;
    high_risk_buildings: number;
    potential_savings: number;
    avg_confidence: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
const PRIORITY_COLORS = {
  high: '#FF4444',
  medium: '#FFA500', 
  low: '#00C49F'
};
const RISK_COLORS = {
  critical: '#FF4444',
  high: '#FF8042',
  medium: '#FFBB28',
  low: '#00C49F'
};

export function PredictiveMaintenancePage() {
  const [data, setData] = useState<PredictiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('12');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPredictiveData();
  }, [timeRange]);

  const fetchPredictiveData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await predictiveMaintenanceAPI.getDashboard();
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error('Failed to load predictive maintenance data');
      }
    } catch (error: any) {
      console.error('Failed to fetch predictive data:', error);
      setError(error.response?.data?.message || 'Failed to load predictive maintenance data');
      toast.error('Failed to load predictive maintenance data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || '#666';
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return RISK_COLORS.critical;
    if (riskScore >= 60) return RISK_COLORS.high;
    if (riskScore >= 40) return RISK_COLORS.medium;
    return RISK_COLORS.low;
  };

  const getRiskLevel = (riskScore: number) => {
    if (riskScore >= 80) return 'Critical';
    if (riskScore >= 60) return 'High';
    if (riskScore >= 40) return 'Medium';
    return 'Low';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <MobileResponsiveWrapper>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading predictive maintenance data...</p>
          </div>
        </div>
      </MobileResponsiveWrapper>
    );
  }

  if (error) {
    return (
      <MobileResponsiveWrapper>
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchPredictiveData}>
            Retry
          </Button>
        </div>
      </MobileResponsiveWrapper>
    );
  }

  if (!data) {
    return (
      <MobileResponsiveWrapper>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No predictive maintenance data available</p>
        </div>
      </MobileResponsiveWrapper>
    );
  }

  return (
    <MobileResponsiveWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Predictive Maintenance</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered insights for proactive facility management
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Next 3 Months</SelectItem>
                <SelectItem value="6">Next 6 Months</SelectItem>
                <SelectItem value="12">Next 12 Months</SelectItem>
                <SelectItem value="24">Next 24 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchPredictiveData} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Predictions</p>
                  <p className="text-2xl font-bold">{data.summary.total_predictions}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Risk Buildings</p>
                  <p className="text-2xl font-bold">{data.summary.high_risk_buildings}</p>
                </div>
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Potential Savings</p>
                  <p className="text-2xl font-bold">{formatCurrency(data.summary.potential_savings)}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Confidence</p>
                  <p className="text-2xl font-bold">{Math.round(data.summary.avg_confidence)}%</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Gauge className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Priority Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Priority Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'High', value: data.predictions.filter(p => p.priority === 'high').length, color: PRIORITY_COLORS.high },
                          { name: 'Medium', value: data.predictions.filter(p => p.priority === 'medium').length, color: PRIORITY_COLORS.medium },
                          { name: 'Low', value: data.predictions.filter(p => p.priority === 'low').length, color: PRIORITY_COLORS.low }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.predictions.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Risk Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Risk Score Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.risk_analysis.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="building_name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Risk Score']}
                        labelFormatter={(label) => `Building: ${label}`}
                      />
                      <Bar dataKey="risk_score" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Maintenance Predictions
                </CardTitle>
                <CardDescription>
                  AI-generated predictions for upcoming maintenance needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.predictions.map((prediction, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{prediction.building_name}</h4>
                          <p className="text-sm text-muted-foreground">{prediction.description}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: getPriorityColor(prediction.priority), color: getPriorityColor(prediction.priority) }}
                        >
                          {prediction.priority.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Due: {formatDate(prediction.predicted_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>Cost: {formatCurrency(prediction.estimated_cost)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span>Confidence: {Math.round(prediction.confidence_score)}%</span>
                        </div>
                      </div>

                      {prediction.recommendations.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium mb-2">Recommendations:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {prediction.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk-analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Component Risk Analysis
                </CardTitle>
                <CardDescription>
                  Detailed risk assessment for building components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.risk_analysis.map((risk, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{risk.building_name}</h4>
                          <p className="text-sm text-muted-foreground">{risk.component}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: getRiskColor(risk.risk_score), 
                            color: getRiskColor(risk.risk_score) 
                          }}
                        >
                          {getRiskLevel(risk.risk_score)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Risk Score</p>
                          <p className="text-lg font-semibold" style={{ color: getRiskColor(risk.risk_score) }}>
                            {Math.round(risk.risk_score)}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Failure Probability</p>
                          <p className="text-lg font-semibold">{Math.round(risk.failure_probability * 100)}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Time to Failure</p>
                          <p className="text-lg font-semibold">{risk.time_to_failure_months} months</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Impact Score</p>
                          <p className="text-lg font-semibold">{Math.round(risk.impact_score)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cost Optimization Suggestions
                </CardTitle>
                <CardDescription>
                  Smart recommendations to reduce maintenance costs and improve efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.optimization_suggestions.map((suggestion, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{suggestion.building_name}</h4>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        </div>
                        <Badge variant="secondary">
                          {suggestion.suggestion_type.toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground">Component</p>
                          <p className="font-medium">{suggestion.component}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Cost Savings</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(suggestion.cost_savings)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Timeline</p>
                          <p className="font-medium">{suggestion.timeline}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">ROI</p>
                          <p className="font-semibold text-blue-600">{Math.round(suggestion.roi)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileResponsiveWrapper>
  );
}
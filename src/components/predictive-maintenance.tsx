import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  Zap,
  Clock,
  Target,
  Loader2,
  Lightbulb,
  Activity,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface PredictiveMaintenanceData {
  summary: {
    high_priority_predictions: number;
    total_estimated_cost: number;
    avg_confidence_score: number;
    potential_savings: number;
    total_predictions: number;
  };
  predictions: any[];
  risk_analysis: any[];
  optimizations: any[];
}

export function PredictiveMaintenance() {
  const [data, setData] = useState<PredictiveMaintenanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictiveData();
  }, []);

  const fetchPredictiveData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/predictive-dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        toast.error('Failed to load predictive maintenance data');
      }
    } catch (error) {
      console.error('Failed to fetch predictive data:', error);
      toast.error('Failed to load predictive maintenance data');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPredictionTypeIcon = (type: string) => {
    switch (type) {
      case 'component_failure': return <AlertTriangle className="h-4 w-4" />;
      case 'major_repair': return <Activity className="h-4 w-4" />;
      case 'system_replacement': return <Zap className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.8) return 'bg-red-500';
    if (riskScore >= 0.6) return 'bg-orange-500';
    if (riskScore >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No predictive maintenance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.high_priority_predictions}</div>
            <p className="text-xs text-muted-foreground">Critical predictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.summary.total_estimated_cost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total predicted costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.summary.avg_confidence_score * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Average accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.summary.potential_savings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Through optimization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_predictions}</div>
            <p className="text-xs text-muted-foreground">Active forecasts</p>
          </CardContent>
        </Card>
      </div>

      {/* Predictive Maintenance Tabs */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="risk-analysis">Risk Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Predictions</CardTitle>
              <CardDescription>
                AI-powered predictions for upcoming maintenance needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.predictions.map((prediction, index) => (
                  <div key={prediction.building_id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getPredictionTypeIcon(prediction.prediction_type)}
                        <div>
                          <h4 className="font-medium">{prediction.building_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {prediction.prediction_type.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(prediction.priority)}>
                          {prediction.priority.toUpperCase()}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ${prediction.estimated_cost.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(prediction.predicted_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{prediction.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-xs">
                          <span className="text-muted-foreground">Current FCI: </span>
                          <span className="font-medium">{prediction.current_fci.toFixed(3)}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-muted-foreground">Predicted FCI: </span>
                          <span className="font-medium">{prediction.predicted_fci.toFixed(3)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <Progress 
                          value={prediction.confidence_score * 100} 
                          className="w-16 h-2" 
                        />
                        <span className="text-xs font-medium">
                          {(prediction.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {prediction.recommendations && prediction.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium mb-2">Recommendations:</p>
                        <ul className="space-y-1">
                          {prediction.recommendations.slice(0, 3).map((rec: string, i: number) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                              <span className="mt-1">•</span>
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

        {/* Risk Analysis Tab */}
        <TabsContent value="risk-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Component Risk Analysis</CardTitle>
              <CardDescription>
                Risk assessment for critical building components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.risk_analysis.slice(0, 10).map((risk, index) => (
                  <div key={`${risk.building_id}-${risk.component}`} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="font-medium">{risk.building_name}</span>
                        <span className="text-sm text-muted-foreground">{risk.component}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm font-medium">{Math.round(risk.time_to_failure_months)} months</div>
                        <div className="text-xs text-muted-foreground">Time to failure</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-medium">{risk.impact_score}/10</div>
                        <div className="text-xs text-muted-foreground">Impact score</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getRiskColor(risk.risk_score)}`} />
                        <span className="text-sm font-medium">
                          {(risk.risk_score * 100).toFixed(0)}%
                        </span>
                        <span className="text-xs text-muted-foreground">Risk</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>
                Cost-saving opportunities and maintenance optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.optimizations.map((opt, index) => (
                  <div key={`${opt.building_id}-${opt.component}`} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        <div>
                          <h4 className="font-medium">{opt.building_name}</h4>
                          <p className="text-sm text-muted-foreground">{opt.component}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          ${opt.cost_savings.toLocaleString()} savings
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ROI: {opt.roi.toFixed(1)}x
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{opt.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {opt.suggestion_type}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{opt.timeline}</span>
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
  );
}
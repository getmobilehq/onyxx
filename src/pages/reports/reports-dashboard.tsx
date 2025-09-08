import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowDown,
  ArrowUp,
  Building2, 
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Info,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';

import { cn } from '@/lib/utils';
import { useReports } from '@/hooks/use-reports';
import { useBuildings } from '@/hooks/use-buildings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { EmailSubscriptions } from '@/components/email-subscriptions';

// FCI Rating Colors
const FCI_COLORS = {
  good: '#22c55e',
  fair: '#3b82f6',
  poor: '#f59e0b',
  critical: '#ef4444'
};

// Helper functions
const getFciStatusColor = (fci: number) => {
  if (fci <= 0.05) return 'text-green-500';
  if (fci <= 0.10) return 'text-blue-500';
  if (fci <= 0.30) return 'text-yellow-500';
  return 'text-red-500';
};

const getFciLabel = (fci: number) => {
  if (fci <= 0.05) return 'Good';
  if (fci <= 0.10) return 'Fair';
  if (fci <= 0.30) return 'Poor';
  return 'Critical';
};

const getFciColor = (fci: number) => {
  if (fci <= 0.05) return FCI_COLORS.good;
  if (fci <= 0.10) return FCI_COLORS.fair;
  if (fci <= 0.30) return FCI_COLORS.poor;
  return FCI_COLORS.critical;
};

export function ReportsDashboard() {
  const { reports, fetchReports, loading } = useReports();
  const { buildings } = useBuildings();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedBuildingType, setSelectedBuildingType] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchReports({ status: 'published' });
      } catch (error) {
        console.error('Failed to load reports:', error);
        toast.error('Failed to load reports data');
      }
    };
    loadData();
  }, []);

  // Process reports data - reports already contain structured FCI and cost data
  const validReports = reports.filter(report => 
    report.fci_score !== null && 
    report.fci_score !== undefined &&
    report.status === 'published'
  );
  
  const reportsWithProcessedData = validReports.map(report => {
    // Build cost structure from report fields
    const costs = {
      immediate: report.immediate_repair_cost || 0,
      shortTerm: report.short_term_repair_cost || 0,
      longTerm: report.long_term_repair_cost || 0,
      total: report.total_repair_cost || 0,
    };
    
    return {
      ...report,
      fci: report.fci_score,
      costs,
      buildingName: report.building_name || 'Unknown Building',
      buildingType: report.building_type || 'unknown',
    };
  });

  // Filter by building type
  const filteredReports = selectedBuildingType === 'all' 
    ? reportsWithProcessedData 
    : reportsWithProcessedData.filter(r => r.buildingType === selectedBuildingType);

  // Calculate statistics
  const totalBuildings = new Set(filteredReports.map(r => r.building_id)).size;
  const averageFCI = filteredReports.length > 0
    ? filteredReports.reduce((sum, r) => sum + (r.fci || 0), 0) / filteredReports.length
    : 0;
  
  const totalRepairCost = filteredReports.reduce((sum, r) => sum + r.costs.total, 0);
  const totalImmediateCost = filteredReports.reduce((sum, r) => sum + r.costs.immediate, 0);

  // FCI distribution data
  const fciDistribution = [
    { 
      name: 'Good', 
      value: filteredReports.filter(r => r.fci! <= 0.05).length,
      color: FCI_COLORS.good 
    },
    { 
      name: 'Fair', 
      value: filteredReports.filter(r => r.fci! > 0.05 && r.fci! <= 0.10).length,
      color: FCI_COLORS.fair 
    },
    { 
      name: 'Poor', 
      value: filteredReports.filter(r => r.fci! > 0.10 && r.fci! <= 0.30).length,
      color: FCI_COLORS.poor 
    },
    { 
      name: 'Critical', 
      value: filteredReports.filter(r => r.fci! > 0.30).length,
      color: FCI_COLORS.critical 
    },
  ];

  // Cost breakdown by time period
  const costBreakdown = [
    {
      name: 'Immediate',
      value: filteredReports.reduce((sum, r) => sum + r.costs.immediate, 0),
      percentage: totalRepairCost > 0 ? (totalImmediateCost / totalRepairCost) * 100 : 0,
    },
    {
      name: 'Short-term',
      value: filteredReports.reduce((sum, r) => sum + r.costs.shortTerm, 0),
      percentage: totalRepairCost > 0 
        ? (filteredReports.reduce((sum, r) => sum + r.costs.shortTerm, 0) / totalRepairCost) * 100 
        : 0,
    },
    {
      name: 'Long-term',
      value: filteredReports.reduce((sum, r) => sum + r.costs.longTerm, 0),
      percentage: totalRepairCost > 0 
        ? (filteredReports.reduce((sum, r) => sum + r.costs.longTerm, 0) / totalRepairCost) * 100 
        : 0,
    },
  ];

  // Recent reports
  const recentReports = [...filteredReports]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Building types
  const buildingTypes = [...new Set(buildings.map(b => b.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive overview of facility condition assessments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedBuildingType} onValueChange={setSelectedBuildingType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Buildings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Building Types</SelectItem>
              {buildingTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average FCI</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getFciStatusColor(averageFCI)}`}>
              {averageFCI.toFixed(3)}
            </div>
            <p className={`text-xs ${getFciStatusColor(averageFCI)}`}>
              {getFciLabel(averageFCI)} Condition
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredReports.length}</div>
            <p className="text-xs text-muted-foreground">
              Across {totalBuildings} buildings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repair Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRepairCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All identified repairs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Immediate Needs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${totalImmediateCost.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Urgent repairs required
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-7">
        {/* FCI Distribution Chart */}
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle>FCI Distribution</CardTitle>
            <CardDescription>
              Building condition distribution across portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={fciDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => 
                      value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ''
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {fciDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {fciDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value} buildings</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Breakdown Chart */}
        <Card className="col-span-1 md:col-span-4">
          <CardHeader>
            <CardTitle>Cost Breakdown by Timeline</CardTitle>
            <CardDescription>
              Repair costs categorized by urgency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#3b82f6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              {costBreakdown.map((item, index) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-medium">${item.value.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={item.percentage} 
                    className="h-2"
                    indicatorClassName={
                      index === 0 ? "bg-red-500" : 
                      index === 1 ? "bg-yellow-500" : 
                      "bg-blue-500"
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assessments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>
                Latest published facility condition reports
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/assessments">
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>FCI Score</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No published reports found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                recentReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Link 
                        to={`/buildings/${report.building_id}`}
                        className="font-medium hover:underline"
                      >
                        {report.buildingName}
                      </Link>
                    </TableCell>
                    <TableCell>{report.buildingType}</TableCell>
                    <TableCell>
                      {new Date(report.assessment_date || report.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getFciStatusColor(report.fci!)}`}>
                          {report.fci!.toFixed(3)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            report.fci! <= 0.05 && "border-green-500 text-green-500",
                            report.fci! > 0.05 && report.fci! <= 0.10 && "border-blue-500 text-blue-500",
                            report.fci! > 0.10 && report.fci! <= 0.30 && "border-yellow-500 text-yellow-500",
                            report.fci! > 0.30 && "border-red-500 text-red-500"
                          )}
                        >
                          {getFciLabel(report.fci!)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${report.costs.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/reports/${report.id}`}>
                          View Report
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Critical Buildings Alert */}
      {fciDistribution.find(d => d.name === 'Critical')?.value > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Critical Condition Buildings
            </CardTitle>
            <CardDescription className="text-red-600">
              These buildings require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredReports
                .filter(r => r.fci! > 0.30)
                .sort((a, b) => b.fci! - a.fci!)
                .map(report => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                    <div>
                      <Link 
                        to={`/buildings/${report.building_id}`}
                        className="font-medium hover:underline"
                      >
                        {report.buildingName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        FCI: {report.fci!.toFixed(3)} • Immediate repairs: ${report.costs.immediate.toLocaleString()}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="destructive">
                      <Link to={`/reports/${report.id}`}>
                        View Report
                      </Link>
                    </Button>
                  </div>
                ))
            }</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
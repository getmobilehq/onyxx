import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReports } from '@/hooks/use-reports';
import { toast } from 'sonner';
import { generateReportPDF } from '@/services/pdf-generator';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Mock data for a specific report
const reportsData = [
  {
    id: '1',
    buildingName: 'Oak Tower Office Complex',
    location: 'New York, NY',
    assessmentDate: '2024-04-10',
    fci: 0.12,
    assessor: 'Alex Johnson',
    status: 'published',
    buildingType: 'Commercial',
    buildingSize: 450000,
    yearBuilt: 1998,
    systems: [
      { name: 'Structural', condition: 'Good', fci: 0.15 },
      { name: 'HVAC', condition: 'Fair', fci: 0.28 },
      { name: 'Electrical', condition: 'Good', fci: 0.18 },
      { name: 'Plumbing', condition: 'Good', fci: 0.12 },
      { name: 'Exterior', condition: 'Excellent', fci: 0.06 },
      { name: 'Interior', condition: 'Good', fci: 0.14 },
      { name: 'Elevators', condition: 'Fair', fci: 0.25 },
      { name: 'Fire Protection', condition: 'Excellent', fci: 0.05 },
    ],
    repairCosts: {
      immediate: 1250000,
      shortTerm: 3450000,
      longTerm: 4800000,
      total: 9500000,
      replacementValue: 79000000,
    },
    recommendations: [
      {
        system: 'HVAC',
        priority: 'High',
        description: 'Replace aging cooling towers and upgrade building automation system',
        estimatedCost: 2800000,
        timeline: '1-2 years',
      },
      {
        system: 'Elevators',
        priority: 'Medium',
        description: 'Modernize elevator control systems and upgrade cab interiors',
        estimatedCost: 1500000,
        timeline: '2-3 years',
      },
      {
        system: 'Electrical',
        priority: 'Low',
        description: 'Upgrade lighting to LED throughout the building',
        estimatedCost: 750000,
        timeline: '3-4 years',
      },
    ],
    notes: [
      {
        date: '2024-04-10',
        author: 'Alex Johnson',
        content: 'Completed comprehensive assessment of all major building systems.',
      },
      {
        date: '2024-04-09',
        author: 'Alex Johnson',
        content: 'Identified significant wear in HVAC cooling towers.',
      },
      {
        date: '2024-04-08',
        author: 'Alex Johnson',
        content: 'Started detailed inspection of mechanical systems.',
      },
    ],
  },
];

// Helper function to determine FCI status color
const getFciStatusColor = (fci: number) => {
  if (fci <= 0.1) return 'text-green-500';
  if (fci <= 0.2) return 'text-blue-500';
  if (fci <= 0.3) return 'text-yellow-500';
  return 'text-red-500';
};

// Helper function to determine FCI label
const getFciLabel = (fci: number) => {
  if (fci <= 0.1) return 'Excellent';
  if (fci <= 0.2) return 'Good';
  if (fci <= 0.3) return 'Fair';
  return 'Poor';
};

// Helper function to determine priority color
const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'border-red-500 text-red-500';
    case 'medium':
      return 'border-yellow-500 text-yellow-500';
    case 'low':
      return 'border-blue-500 text-blue-500';
    default:
      return '';
  }
};

export function ReportDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { getReport, downloadReport } = useReports();

  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;

      try {
        const reportData = await getReport(id);
        setReport(reportData);
      } catch (error) {
        console.error('Failed to load report:', error);
        toast.error('Failed to load report details');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id, getReport]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Report Not Found</CardTitle>
            <CardDescription>
              The report you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/reports">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Reports
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Map backend data to frontend format
  const mappedReport = {
    ...report,
    buildingName: report.building_name || report.title?.replace('Facility Condition Assessment - ', ''),
    location: `${report.city || ''}, ${report.state || ''}`.replace(', ', ''),
    assessmentDate: report.assessment_date || report.report_date,
    fci: report.fci_score || 0,
    assessor: report.assessor_name || report.created_by_name,
    buildingType: report.building_type || 'Unknown',
    buildingSize: report.square_footage || 0,
    yearBuilt: report.year_built || 'Unknown',
    repairCosts: {
      immediate: report.immediate_repair_cost || 0,
      shortTerm: report.short_term_repair_cost || 0,
      longTerm: report.long_term_repair_cost || 0,
      total: report.total_repair_cost || 0,
      replacementValue: report.replacement_value || 0,
    },
    systems: report.systems_data?.elements?.map((el: any) => ({
      name: el.individual_element || el.group_element || 'Unknown',
      condition: getConditionLabel(el.condition_rating),
      fci: 0.1 // Calculate based on element costs if needed
    })) || [],
    recommendations: report.recommendations || [],
    notes: report.notes || []
  };

  // Calculate repair cost percentages for the chart
  const repairCostData = [
    { name: 'Immediate', value: mappedReport.repairCosts.immediate, fill: '#ef4444' },
    { name: 'Short Term', value: mappedReport.repairCosts.shortTerm, fill: '#f59e0b' },
    { name: 'Long Term', value: mappedReport.repairCosts.longTerm, fill: '#3b82f6' },
  ];

  // Helper function to convert condition rating to label
  function getConditionLabel(rating: number): string {
    if (rating >= 5) return 'Excellent';
    if (rating >= 4) return 'Good';
    if (rating >= 3) return 'Fair';
    if (rating >= 2) return 'Poor';
    return 'Critical';
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/reports">Reports</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{mappedReport.buildingName}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{mappedReport.buildingName}</h2>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4" />
            Assessment Date: {new Date(mappedReport.assessmentDate).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share Report
          </Button>
          <Button onClick={() => {
            try {
              // Convert report data to PDF format
              const pdfData = {
                id: mappedReport.id,
                title: `Facility Condition Assessment - ${mappedReport.buildingName}`,
                building_name: mappedReport.buildingName,
                assessor_name: mappedReport.assessor,
                assessment_date: mappedReport.assessmentDate,
                report_date: new Date().toISOString(),
                fci_score: mappedReport.fci,
                total_repair_cost: mappedReport.repairCosts.total,
                replacement_value: mappedReport.repairCosts.replacementValue,
                immediate_repair_cost: mappedReport.repairCosts.immediate,
                short_term_repair_cost: mappedReport.repairCosts.shortTerm,
                long_term_repair_cost: mappedReport.repairCosts.longTerm,
                element_count: mappedReport.systems?.length || 0,
                deficiency_count: mappedReport.systems?.reduce((count: number, system: any) => 
                  count + (system.deficiencies?.length || 0), 0) || 0,
                executive_summary: `This facility condition assessment of ${mappedReport.buildingName} reveals an FCI score of ${mappedReport.fci.toFixed(4)}, indicating ${getFciLabel(mappedReport.fci).toLowerCase()} condition.`,
                building_type: mappedReport.buildingType,
                square_footage: mappedReport.buildingSize,
                year_built: mappedReport.yearBuilt,
                city: mappedReport.location.split(',')[1]?.trim() || '',
                state: mappedReport.location.split(',')[0]?.trim() || '',
                systems_data: {
                  elements: mappedReport.systems?.map((system: any) => ({
                    individual_element: system.name,
                    condition_rating: system.condition === 'Excellent' ? 5 : 
                                    system.condition === 'Good' ? 4 :
                                    system.condition === 'Fair' ? 3 :
                                    system.condition === 'Poor' ? 2 : 1,
                    notes: system.notes || '',
                    deficiencies: system.deficiencies || []
                  })) || []
                },
                recommendations: mappedReport.recommendations || []
              };

              generateReportPDF(pdfData);
              toast.success('PDF report downloaded successfully');
            } catch (error) {
              console.error('Failed to generate PDF:', error);
              toast.error('Failed to generate PDF report');
            }
          }}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Report Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Building Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold">Location</h3>
              <p>{mappedReport.location}</p>
            </div>
            <div>
              <h3 className="font-semibold">Building Type</h3>
              <p>{mappedReport.buildingType}</p>
            </div>
            <div>
              <h3 className="font-semibold">Size</h3>
              <p>{mappedReport.buildingSize.toLocaleString()} sq ft</p>
            </div>
            <div>
              <h3 className="font-semibold">Year Built</h3>
              <p>{mappedReport.yearBuilt}</p>
            </div>
            <div>
              <h3 className="font-semibold">Assessor</h3>
              <p>{mappedReport.assessor}</p>
            </div>
            <div>
              <h3 className="font-semibold">Status</h3>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  mappedReport.status === 'published' && "border-green-500 text-green-500",
                  mappedReport.status === 'draft' && "border-yellow-500 text-yellow-500",
                  mappedReport.status === 'archived' && "border-blue-500 text-blue-500"
                )}
              >
                {mappedReport.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facility Condition Index</CardTitle>
            <CardDescription>
              Current FCI score and status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-6">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-muted">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold">{mappedReport.fci.toFixed(2)}</span>
                <span
                  className={cn(
                    "text-lg font-medium",
                    getFciStatusColor(mappedReport.fci)
                  )}
                >
                  {getFciLabel(mappedReport.fci)}
                </span>
              </div>
              <svg
                className="absolute -rotate-90"
                width="160"
                height="160"
                viewBox="0 0 160 160"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="439.6"
                  strokeDashoffset={439.6 - (439.6 * mappedReport.fci)}
                  className={cn(
                    mappedReport.fci <= 0.1 ? "text-green-500" :
                    mappedReport.fci <= 0.2 ? "text-blue-500" :
                    mappedReport.fci <= 0.3 ? "text-yellow-500" :
                    "text-red-500"
                  )}
                />
              </svg>
            </div>
            <div className="w-full space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Repair Cost</span>
                <span className="font-medium">
                  ${mappedReport.repairCosts.total.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Replacement Value</span>
                <span className="font-medium">
                  ${mappedReport.repairCosts.replacementValue.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Sections */}
      <Tabs defaultValue="systems" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="systems">Building Systems</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>
        
        {/* Building Systems Tab */}
        <TabsContent value="systems">
          <Card>
            <CardHeader>
              <CardTitle>System Conditions</CardTitle>
              <CardDescription>
                Detailed assessment of major building systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mappedReport.systems.map((system) => (
                  <div
                    key={system.name}
                    className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                  >
                    <div>
                      <h3 className="font-medium">{system.name}</h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "mt-1",
                          system.condition === 'Excellent' ? "border-green-500 text-green-500" :
                          system.condition === 'Good' ? "border-blue-500 text-blue-500" :
                          system.condition === 'Fair' ? "border-yellow-500 text-yellow-500" :
                          "border-red-500 text-red-500"
                        )}
                      >
                        {system.condition}
                      </Badge>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn(
                        "text-sm font-medium",
                        getFciStatusColor(system.fci)
                      )}>
                        FCI: {system.fci.toFixed(2)}
                      </span>
                      <Progress
                        value={system.fci * 100}
                        className="h-2 w-24"
                        indicatorClassName={cn(
                          system.fci <= 0.1 ? "bg-green-500" :
                          system.fci <= 0.2 ? "bg-blue-500" :
                          system.fci <= 0.3 ? "bg-yellow-500" :
                          "bg-red-500"
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Improvement Recommendations</CardTitle>
              <CardDescription>
                Prioritized list of recommended improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mappedReport.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="space-y-2 rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(getPriorityColor(rec.priority))}
                        >
                          {rec.priority} Priority
                        </Badge>
                        <span className="font-medium">{rec.system}</span>
                      </div>
                      <span className="font-medium">
                        ${rec.estimatedCost.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      {rec.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Timeline: {rec.timeline}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Cost Analysis Tab */}
        <TabsContent value="costs">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <CardDescription>
                Breakdown of repair costs and financial metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-medium">Repair Cost Distribution</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={repairCostData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Cost']}
                          contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-4">Cost Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Immediate Repairs</span>
                        <span className="font-medium">
                          ${mappedReport.repairCosts.immediate.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Short-Term (1-3 years)</span>
                        <span className="font-medium">
                          ${mappedReport.repairCosts.shortTerm.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Long-Term (3-5 years)</span>
                        <span className="font-medium">
                          ${mappedReport.repairCosts.longTerm.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-medium">
                          <span>Total Repair Costs</span>
                          <span>${mappedReport.repairCosts.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-4">Financial Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Current Replacement Value</span>
                        <span className="font-medium">
                          ${mappedReport.repairCosts.replacementValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Facility Condition Index</span>
                        <span className={cn(
                          "font-medium",
                          getFciStatusColor(mappedReport.fci)
                        )}>
                          {mappedReport.fci.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost per Square Foot</span>
                        <span className="font-medium">
                          ${(mappedReport.repairCosts.total / mappedReport.buildingSize).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assessment Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Notes</CardTitle>
          <CardDescription>
            Detailed notes from the assessment process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mappedReport.notes.map((note, index) => (
              <div
                key={index}
                className="flex gap-4 border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="rounded-full bg-primary/10 p-2 h-fit">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{note.author}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(note.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {note.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
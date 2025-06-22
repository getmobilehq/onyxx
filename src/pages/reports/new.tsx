import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Building2, CheckCircle2, AlertTriangle, Calendar, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { AssessmentWorkflow } from '@/components/assessment-workflow';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Chart colors
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

// Helper functions
const getFciStatusColor = (fci: number) => {
  if (fci <= 0.1) return 'text-green-500';
  if (fci <= 0.2) return 'text-blue-500';
  if (fci <= 0.3) return 'text-yellow-500';
  return 'text-red-500';
};

const getFciLabel = (fci: number) => {
  if (fci <= 0.1) return 'Excellent';
  if (fci <= 0.2) return 'Good';
  if (fci <= 0.3) return 'Fair';
  return 'Poor';
};

const getFciRecommendation = (fci: number) => {
  if (fci <= 0.1) return 'Building is in excellent condition. Continue with routine maintenance.';
  if (fci <= 0.2) return 'Building is in good condition. Plan for preventive maintenance.';
  if (fci <= 0.3) return 'Building requires attention. Schedule repairs and improvements.';
  return 'Building requires immediate attention. Prioritize major repairs and consider replacement.';
};

export function NewReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('assessmentId');
  
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [buildingData, setBuildingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load assessment data from localStorage
    const completeAssessment = localStorage.getItem(`assessment-${assessmentId}`);
    
    if (!completeAssessment) {
      toast.error('Assessment data not found');
      navigate('/assessments');
      return;
    }

    try {
      const data = JSON.parse(completeAssessment);
      setAssessmentData(data);

      // Mock building data (in real app, fetch from API)
      const buildings = [
        { id: '1', name: 'Oak Tower Office Complex', location: 'New York, NY', type: 'Commercial', size: 450000 },
        { id: '2', name: 'Riverside Apartments', location: 'Chicago, IL', type: 'Residential', size: 325000 },
        { id: '3', name: 'Sunset Mall', location: 'Miami, FL', type: 'Retail', size: 580000 },
        { id: '4', name: 'Central Hospital', location: 'Boston, MA', type: 'Healthcare', size: 720000 },
        { id: '5', name: 'Green Hills School', location: 'Seattle, WA', type: 'Education', size: 275000 },
        { id: '6', name: 'Waterfront Hotel', location: 'San Francisco, CA', type: 'Hospitality', size: 390000 },
        { id: '7', name: 'Metro Logistics Center', location: 'Dallas, TX', type: 'Industrial', size: 850000 },
        { id: '8', name: 'Highland Park Condos', location: 'Denver, CO', type: 'Residential', size: 210000 },
      ];
      
      const building = buildings.find(b => b.id === assessmentId);
      setBuildingData(building);
      setLoading(false);
    } catch (error) {
      toast.error('Error loading assessment data');
      navigate('/assessments');
    }
  }, [assessmentId, navigate]);

  const handleSaveReport = () => {
    if (!assessmentData) return;

    // Create report data
    const reportData = {
      id: `report-${Date.now()}`,
      assessmentId,
      buildingId: assessmentId,
      buildingName: buildingData?.name,
      reportDate: new Date().toISOString(),
      assessmentDate: assessmentData.preAssessmentData?.assessmentDate,
      assessor: 'Current User', // In real app, get from auth context
      fci: assessmentData.fieldAssessmentData?.fci || 0,
      totalRepairCost: assessmentData.fieldAssessmentData?.totalRepairCost || 0,
      replacementValue: assessmentData.preAssessmentData?.replacementValue || 0,
      elementCount: assessmentData.preAssessmentData?.selectedElements?.length || 0,
      deficiencyCount: assessmentData.fieldAssessmentData?.elementAssessments?.reduce((count: number, el: any) => 
        count + (el.deficiencies?.length || 0), 0) || 0,
      status: 'final',
      type: assessmentData.preAssessmentData?.assessmentType || 'Annual',
    };

    // Save report to localStorage (in real app, save to database)
    localStorage.setItem(`report-${reportData.id}`, JSON.stringify(reportData));
    
    // Update assessment status
    const updatedAssessment = {
      ...assessmentData,
      status: 'completed',
      reportId: reportData.id,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(`assessment-${assessmentId}`, JSON.stringify(updatedAssessment));

    toast.success('Report saved successfully!');
    
    // Navigate to reports list
    setTimeout(() => {
      navigate('/reports');
    }, 1000);
  };

  const handleExportPDF = () => {
    toast.success('PDF export functionality will be implemented next');
    // TODO: Implement PDF export
  };

  if (loading || !assessmentData || !buildingData) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const fieldData = assessmentData.fieldAssessmentData;
  const preData = assessmentData.preAssessmentData;
  const fci = fieldData?.fci || 0;
  
  // Calculate condition distribution
  const conditionCounts = fieldData?.elementAssessments?.reduce((acc: any, assessment: any) => {
    const condition = assessment.condition;
    if (condition === 'new' || condition === 'good') acc.good = (acc.good || 0) + 1;
    else if (condition === 'fair') acc.fair = (acc.fair || 0) + 1;
    else if (condition === 'poor' || condition === 'critical') acc.poor = (acc.poor || 0) + 1;
    return acc;
  }, {}) || {};

  const conditionData = [
    { name: 'Good', value: conditionCounts.good || 0, color: '#22c55e' },
    { name: 'Fair', value: conditionCounts.fair || 0, color: '#f59e0b' },
    { name: 'Poor', value: conditionCounts.poor || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Cost breakdown data
  const costData = [
    { name: 'Immediate', amount: fieldData?.totalImmediateCost || 0, color: '#ef4444' },
    { name: 'Short-term', amount: fieldData?.totalShortTermCost || 0, color: '#f59e0b' },
    { name: 'Long-term', amount: fieldData?.totalLongTermCost || 0, color: '#3b82f6' },
  ].filter(item => item.amount > 0);

  return (
    <div className="space-y-6 p-6 pb-16">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/reports">Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Assessment Report</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assessment Report</h2>
          <p className="text-muted-foreground">
            Complete building condition assessment results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={handleSaveReport}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Save Report
          </Button>
        </div>
      </div>

      {/* Assessment Workflow */}
      <AssessmentWorkflow currentStep={3} />

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Building Info */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{buildingData.name}</h3>
                <p className="text-muted-foreground">{buildingData.location}</p>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Building Type:</span>
                  <span>{buildingData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{buildingData.size.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assessment Date:</span>
                  <span>{new Date(preData?.assessmentDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assessment Type:</span>
                  <span>{preData?.assessmentType}</span>
                </div>
              </div>
            </div>

            {/* FCI Summary */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{fci.toFixed(3)}</div>
                <Badge 
                  variant="outline" 
                  className={`text-lg px-4 py-2 ${getFciStatusColor(fci)}`}
                >
                  {getFciLabel(fci)} Condition
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Repair Cost:</span>
                  <span className="font-medium">${(fieldData?.totalRepairCost || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Replacement Value:</span>
                  <span className="font-medium">${(preData?.replacementValue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Elements Assessed:</span>
                  <span className="font-medium">{preData?.selectedElements?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deficiencies Found:</span>
                  <span className="font-medium">
                    {fieldData?.elementAssessments?.reduce((count: number, el: any) => 
                      count + (el.deficiencies?.length || 0), 0) || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Recommendation */}
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Recommendation
            </h4>
            <p className="text-sm text-muted-foreground">
              {getFciRecommendation(fci)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Element Condition Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Element Condition Distribution</CardTitle>
            <CardDescription>
              Breakdown of element conditions assessed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conditionData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={conditionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {conditionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} elements`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No condition data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Repair Cost Breakdown</CardTitle>
            <CardDescription>
              Distribution of repair costs by priority
            </CardDescription>
          </CardHeader>
          <CardContent>
            {costData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Cost']} />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {costData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No cost data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Findings */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Assessment Findings</CardTitle>
          <CardDescription>
            Element-by-element assessment results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fieldData?.elementAssessments?.length > 0 ? (
            <div className="space-y-4">
              {fieldData.elementAssessments.map((assessment: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{assessment.elementName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {assessment.quantity} | Unit Cost: ${assessment.unitCost}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        assessment.condition === 'new' || assessment.condition === 'good' 
                          ? 'border-green-500 text-green-500'
                          : assessment.condition === 'fair'
                          ? 'border-yellow-500 text-yellow-500'
                          : 'border-red-500 text-red-500'
                      }
                    >
                      {assessment.condition?.charAt(0).toUpperCase() + assessment.condition?.slice(1)}
                    </Badge>
                  </div>
                  
                  {assessment.deficiencies?.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium mb-2">Deficiencies:</h5>
                      <div className="space-y-1">
                        {assessment.deficiencies.map((deficiency: any, defIndex: number) => (
                          <div key={defIndex} className="text-sm p-2 bg-muted rounded flex justify-between">
                            <span>{deficiency.description}</span>
                            <div className="flex items-center gap-2">
                              <Badge size="sm" variant={
                                deficiency.severity === 'high' ? 'destructive' :
                                deficiency.severity === 'medium' ? 'default' : 'secondary'
                              }>
                                {deficiency.severity}
                              </Badge>
                              <span className="font-medium">${deficiency.cost?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {assessment.notes && (
                    <div className="mt-3">
                      <h5 className="text-sm font-medium mb-1">Notes:</h5>
                      <p className="text-sm text-muted-foreground">{assessment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No assessment findings available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link to="/assessments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Link>
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={handleSaveReport}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Save Report
          </Button>
        </div>
      </div>
    </div>
  );
}
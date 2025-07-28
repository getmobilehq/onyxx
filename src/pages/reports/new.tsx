import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useReports } from '@/hooks/use-reports';
import { useBuildings } from '@/hooks/use-buildings';

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

import { toast } from 'sonner';
import { AssessmentWorkflow } from '@/components/assessment-workflow';
import { generateReportPDF } from '@/services/pdf-generator';
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
} from 'recharts';

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

  const { createReport, generateReportFromAssessment } = useReports();
  const { getBuilding } = useBuildings();

  useEffect(() => {
    const loadData = async () => {
      if (!assessmentId) {
        toast.error('Assessment ID not found');
        navigate('/assessments');
        return;
      }

      try {
        // Load assessment data from localStorage (fallback)
        const completeAssessment = localStorage.getItem(`assessment-${assessmentId}`);
        
        if (completeAssessment) {
          const data = JSON.parse(completeAssessment);
          setAssessmentData(data);

          // Get building data from the assessment or fetch from API
          if (data.buildingId) {
            try {
              const building = await getBuilding(data.buildingId);
              setBuildingData(building);
            } catch (error) {
              console.error('Failed to load building data:', error);
              // Use building data from assessment if available
              setBuildingData(data.buildingData || { name: 'Unknown Building' });
            }
          }
        } else {
          // If no localStorage data, this might be a direct assessment completion
          // In this case, we should try to generate the report directly
          toast.info('Generating report from assessment...');
          try {
            await generateReportFromAssessment(assessmentId);
            navigate('/reports');
            return;
          } catch (error) {
            toast.error('Failed to generate report from assessment');
            navigate('/assessments');
            return;
          }
        }
      } catch (error) {
        console.error('Error loading assessment data:', error);
        toast.error('Error loading assessment data');
        navigate('/assessments');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [assessmentId, navigate, getBuilding, generateReportFromAssessment]);

  const handleSaveReport = async () => {
    if (!assessmentData || !buildingData) return;

    try {
      // Create report data
      const reportData = {
        assessment_id: assessmentId!,
        building_id: buildingData.id || assessmentData.buildingId,
        title: `Facility Condition Assessment - ${buildingData.name}`,
        description: `Comprehensive assessment report for ${buildingData.name}`,
        report_type: 'facility_condition' as const,
        status: 'published' as const,
        assessment_date: assessmentData.preAssessmentData?.assessmentDate,
        fci_score: assessmentData.fieldAssessmentData?.fci || 0,
        total_repair_cost: assessmentData.fieldAssessmentData?.totalRepairCost || 0,
        replacement_value: assessmentData.preAssessmentData?.replacementValue || 0,
        element_count: assessmentData.preAssessmentData?.selectedElements?.length || 0,
        deficiency_count: assessmentData.fieldAssessmentData?.elementAssessments?.reduce((count: number, el: any) => 
          count + (el.deficiencies?.length || 0), 0) || 0,
        systems_data: {
          elements: assessmentData.fieldAssessmentData?.elementAssessments || [],
          assessment_summary: {
            total_elements: assessmentData.preAssessmentData?.selectedElements?.length || 0,
            total_deficiencies: assessmentData.fieldAssessmentData?.elementAssessments?.reduce((count: number, el: any) => 
              count + (el.deficiencies?.length || 0), 0) || 0,
            assessment_type: assessmentData.preAssessmentData?.assessmentType || 'Annual'
          }
        },
        executive_summary: `This facility condition assessment of ${buildingData.name} reveals an FCI score of ${(assessmentData.fieldAssessmentData?.fci || 0).toFixed(4)}, indicating ${getFciLabel(assessmentData.fieldAssessmentData?.fci || 0).toLowerCase()} condition. ${getFciRecommendation(assessmentData.fieldAssessmentData?.fci || 0)}`
      };

      // Save report to backend
      await createReport(reportData);
      
      toast.success('Report saved successfully!');
      
      // Navigate to reports list
      setTimeout(() => {
        navigate('/reports');
      }, 1000);
    } catch (error) {
      console.error('Failed to save report:', error);
      toast.error('Failed to save report. Please try again.');
    }
  };

  const handleExportPDF = () => {
    if (!assessmentData || !buildingData) {
      toast.error('No assessment data available for PDF export');
      return;
    }

    try {
      const fieldData = assessmentData.fieldAssessmentData;
      const preData = assessmentData.preAssessmentData;
      const fci = fieldData?.fci || 0;

      // Convert assessment data to PDF format
      const pdfData = {
        id: assessmentId || 'draft',
        title: `Facility Condition Assessment - ${buildingData.name}`,
        building_name: buildingData.name,
        assessor_name: preData?.assessorName || 'Unknown Assessor',
        assessment_date: preData?.assessmentDate || new Date().toISOString(),
        report_date: new Date().toISOString(),
        fci_score: fci,
        total_repair_cost: fieldData?.totalRepairCost || 0,
        replacement_value: preData?.replacementValue || 0,
        immediate_repair_cost: fieldData?.totalImmediateCost || 0,
        short_term_repair_cost: fieldData?.totalShortTermCost || 0,
        long_term_repair_cost: fieldData?.totalLongTermCost || 0,
        element_count: preData?.selectedElements?.length || 0,
        deficiency_count: fieldData?.elementAssessments?.reduce((count: number, el: any) => 
          count + (el.deficiencies?.length || 0), 0) || 0,
        executive_summary: `This facility condition assessment of ${buildingData.name} reveals an FCI score of ${fci.toFixed(4)}, indicating ${getFciLabel(fci).toLowerCase()} condition. ${getFciRecommendation(fci)}`,
        building_type: buildingData.type || 'Unknown',
        square_footage: buildingData.size || 0,
        year_built: buildingData.yearBuilt || 'Unknown',
        city: buildingData.city || '',
        state: buildingData.state || '',
        systems_data: {
          elements: fieldData?.elementAssessments?.map((assessment: any) => ({
            individual_element: assessment.elementName || 'Unknown Element',
            condition_rating: assessment.condition === 'new' || assessment.condition === 'good' ? 5 :
                            assessment.condition === 'fair' ? 3 :
                            assessment.condition === 'poor' || assessment.condition === 'critical' ? 1 : 3,
            notes: assessment.notes || '',
            deficiencies: assessment.deficiencies?.map((def: any) => ({
              description: def.description,
              cost: def.cost || 0,
              category: def.severity || 'medium'
            })) || []
          })) || []
        },
        recommendations: [] // Could be generated based on deficiencies if needed
      };

      generateReportPDF(pdfData, `${buildingData.name.replace(/\s+/g, '-').toLowerCase()}-assessment-${new Date().getFullYear()}.pdf`);
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF report');
    }
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
            <BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/reports">Reports</Link></BreadcrumbLink>
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
                    <Tooltip formatter={(value: number) => [`${value} elements`, 'Count']} />
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
                    <YAxis tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => [`$${Number(value).toLocaleString()}`, 'Cost']} />
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
                              <Badge variant={
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
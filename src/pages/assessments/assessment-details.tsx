import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  ClipboardList, 
  Download, 
  Edit3, 
  FileText, 
  Info, 
  Loader2, 
  MapPin, 
  User,
  AlertTriangle,
  TrendingUp,
  BarChart3
} from 'lucide-react';

import { useAssessments } from '@/hooks/use-assessments';
import { useBuildings } from '@/hooks/use-buildings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

// Helper function to get FCI status color
const getFciStatusColor = (fci: number) => {
  if (fci <= 0.05) return 'text-green-500';
  if (fci <= 0.10) return 'text-blue-500';
  if (fci <= 0.30) return 'text-yellow-500';
  return 'text-red-500';
};

// Helper function to get FCI label
const getFciLabel = (fci: number) => {
  if (fci <= 0.05) return 'Good';
  if (fci <= 0.10) return 'Fair';
  if (fci <= 0.30) return 'Poor';
  return 'Critical';
};

// Helper function to get status badge variant
const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'scheduled':
      return 'outline';
    default:
      return 'outline';
  }
};

export function AssessmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAssessment, calculateFCI, completeAssessment } = useAssessments();
  const { getBuilding } = useBuildings();

  const [assessment, setAssessment] = useState<any>(null);
  const [building, setBuilding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Extract FCI from assessment notes
  const extractFCIFromNotes = (notes: string): number | null => {
    if (!notes) return null;
    const fciMatch = notes.match(/FCI of (\\d+\\.?\\d*)/);
    if (fciMatch && fciMatch[1]) {
      return parseFloat(fciMatch[1]);
    }
    return null;
  };

  // Calculate costs from notes
  const extractCostsFromNotes = (notes: string) => {
    const costs = {
      immediate: 0,
      shortTerm: 0,
      longTerm: 0,
      total: 0,
    };

    if (!notes) return costs;

    const immediateMatch = notes.match(/Immediate.*?\\$(\\d+(?:,\\d+)*)/);
    const shortTermMatch = notes.match(/Short-term.*?\\$(\\d+(?:,\\d+)*)/);
    const longTermMatch = notes.match(/Long-term.*?\\$(\\d+(?:,\\d+)*)/);
    const totalMatch = notes.match(/Total.*?\\$(\\d+(?:,\\d+)*)/);

    if (immediateMatch) costs.immediate = parseInt(immediateMatch[1].replace(/,/g, ''));
    if (shortTermMatch) costs.shortTerm = parseInt(shortTermMatch[1].replace(/,/g, ''));
    if (longTermMatch) costs.longTerm = parseInt(longTermMatch[1].replace(/,/g, ''));
    if (totalMatch) costs.total = parseInt(totalMatch[1].replace(/,/g, ''));

    return costs;
  };

  useEffect(() => {
    const fetchAssessmentDetails = async () => {
      if (!id) {
        setError('Assessment ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch assessment data
        const assessmentData = await getAssessment(id);
        setAssessment(assessmentData);

        // Fetch building data if building_id exists
        if (assessmentData.building_id) {
          try {
            const buildingData = await getBuilding(assessmentData.building_id);
            setBuilding(buildingData);
          } catch (buildingError) {
            console.warn('Failed to fetch building data:', buildingError);
          }
        }

      } catch (err) {
        console.error('Failed to fetch assessment details:', err);
        setError('Failed to load assessment details');
        toast.error('Failed to load assessment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentDetails();
  }, [id]);

  const handleCalculateFCI = async () => {
    if (!id) return;
    
    try {
      setCalculating(true);
      const fciResults = await calculateFCI(id);
      toast.success('FCI calculated successfully');
      console.log('FCI Results:', fciResults);
      
      // Refresh assessment data to show updated notes
      const updatedAssessment = await getAssessment(id);
      setAssessment(updatedAssessment);
    } catch (error) {
      console.error('FCI calculation failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleCompleteAssessment = async () => {
    if (!id) return;
    
    try {
      setCompleting(true);
      const result = await completeAssessment(id);
      toast.success('Assessment completed with FCI calculation');
      console.log('Completion Result:', result);
      
      // Update local state with completed assessment
      setAssessment(result.assessment);
    } catch (error) {
      console.error('Assessment completion failed:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!id) return;
    
    try {
      setDownloading(true);
      
      // Import the reports API
      const { reportsAPI } = await import('@/services/api');
      
      // Download the PDF using the API client
      const response = await reportsAPI.downloadAssessmentPDF(id);
      
      // Create a download link
      const url = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-report-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF report downloaded successfully');
    } catch (error) {
      console.error('PDF download failed:', error);
      toast.error('Failed to download PDF report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Assessment Not Found</CardTitle>
            <CardDescription>
              {error || "The assessment you're looking for doesn't exist or has been removed."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/assessments">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Assessments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate FCI and costs
  const fci = extractFCIFromNotes(assessment.notes);
  const costs = extractCostsFromNotes(assessment.notes);
  const replacementValue = building ? (building.square_footage || 0) * (building.cost_per_sqft || 200) : 0;

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/assessments">Assessments</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Assessment Details</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assessment Details</h2>
          <p className="text-muted-foreground">
            {assessment.type} assessment for {building?.name || 'Unknown Building'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/assessments/${id}/edit`}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit Assessment
            </Link>
          </Button>
          
          {assessment.status !== 'completed' && (
            <>
              <Button 
                onClick={handleCalculateFCI}
                disabled={calculating}
                variant="secondary"
              >
                {calculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Calculate FCI
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleCompleteAssessment}
                disabled={completing}
              >
                {completing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Complete Assessment
                  </>
                )}
              </Button>
            </>
          )}
          
          <Button 
            onClick={handleDownloadPDF}
            disabled={downloading}
            variant="outline"
          >
            {downloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Assessment Overview Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={getStatusVariant(assessment.status)}>
              {assessment.status.replace('_', ' ').toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FCI Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {fci !== null ? (
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${getFciStatusColor(fci)}`}>
                  {fci.toFixed(3)}
                </div>
                <p className={`text-xs ${getFciStatusColor(fci)}`}>
                  {getFciLabel(fci)}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Not calculated</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repair Cost</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costs.total.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replacement Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${replacementValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="building">Building Info</TabsTrigger>
          <TabsTrigger value="costs">Cost Breakdown</TabsTrigger>
          <TabsTrigger value="notes">Assessment Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Assessment Type</h4>
                  <p className="text-muted-foreground">{assessment.type}</p>
                </div>
                <div>
                  <h4 className="font-medium">Assigned To</h4>
                  <p className="text-muted-foreground">{assessment.assigned_to_name || 'Not assigned'}</p>
                </div>
                <div>
                  <h4 className="font-medium">Created Date</h4>
                  <p className="text-muted-foreground">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Scheduled Date</h4>
                  <p className="text-muted-foreground">
                    {assessment.scheduled_at 
                      ? new Date(assessment.scheduled_at).toLocaleDateString()
                      : 'Not scheduled'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Completed Date</h4>
                  <p className="text-muted-foreground">
                    {assessment.completed_at 
                      ? new Date(assessment.completed_at).toLocaleDateString()
                      : 'Not completed'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-muted-foreground">
                    {assessment.description || 'No description provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {fci !== null && (
            <Card>
              <CardHeader>
                <CardTitle>FCI Analysis</CardTitle>
                <CardDescription>
                  Facility Condition Index assessment results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-muted">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getFciStatusColor(fci)}`}>
                          {fci.toFixed(3)}
                        </div>
                        <div className={`text-sm font-medium ${getFciStatusColor(fci)}`}>
                          {getFciLabel(fci)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">
                        ${costs.immediate.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Immediate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">
                        ${costs.shortTerm.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Short-term</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        ${costs.longTerm.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Long-term</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="building" className="space-y-6">
          {building ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {building.name}
                </CardTitle>
                <CardDescription>Building information</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Type</h4>
                    <p className="text-muted-foreground">{building.type}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Year Built</h4>
                    <p className="text-muted-foreground">{building.year_built}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Square Footage</h4>
                    <p className="text-muted-foreground">{building.square_footage?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Construction Type</h4>
                    <p className="text-muted-foreground">{building.construction_type}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Cost per Sq Ft</h4>
                    <p className="text-muted-foreground">${building.cost_per_sqft}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Address</h4>
                    <p className="text-muted-foreground">
                      {building.street_address}, {building.city}, {building.state} {building.zip_code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Building Information Unavailable</h3>
                  <p className="text-muted-foreground">
                    Unable to load building details for this assessment.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>
                Detailed breakdown of repair and replacement costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Immediate Repairs</span>
                    <span className="font-bold text-red-500">${costs.immediate.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={costs.total > 0 ? (costs.immediate / costs.total) * 100 : 0} 
                    className="h-2" 
                    indicatorClassName="bg-red-500" 
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Short-term Repairs (1-3 years)</span>
                    <span className="font-bold text-yellow-500">${costs.shortTerm.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={costs.total > 0 ? (costs.shortTerm / costs.total) * 100 : 0} 
                    className="h-2" 
                    indicatorClassName="bg-yellow-500" 
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Long-term Repairs (3-5 years)</span>
                    <span className="font-bold text-blue-500">${costs.longTerm.toLocaleString()}</span>
                  </div>
                  <Progress 
                    value={costs.total > 0 ? (costs.longTerm / costs.total) * 100 : 0} 
                    className="h-2" 
                    indicatorClassName="bg-blue-500" 
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total Repair Costs</span>
                  <span>${costs.total.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between text-lg">
                  <span>Replacement Value</span>
                  <span className="font-medium">${replacementValue.toLocaleString()}</span>
                </div>
                
                {fci !== null && (
                  <div className="rounded-lg border border-dashed p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">FCI Calculation</span>
                      <span className={`font-bold ${getFciStatusColor(fci)}`}>
                        {fci.toFixed(3)} ({getFciLabel(fci)})
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total Repair Cost ÷ Replacement Value = {costs.total.toLocaleString()} ÷ {replacementValue.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Notes</CardTitle>
              <CardDescription>
                Detailed notes and findings from the assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessment.notes ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{assessment.notes}</pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Notes Available</h3>
                  <p className="text-muted-foreground">
                    No detailed notes have been added to this assessment yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
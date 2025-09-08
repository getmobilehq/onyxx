import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Building2, FileText, Edit3, Eye, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAssessments } from '@/hooks/use-assessments';
import { toast } from 'sonner';

interface AssessmentCelebrationProps {
  assessment: any;
  buildingData: any;
  elementAssessments: any[];
  onViewDetails?: () => void;
  onEditAssessment?: () => void;
}

export function AssessmentCelebration({ 
  assessment, 
  buildingData, 
  elementAssessments,
  onViewDetails,
  onEditAssessment 
}: AssessmentCelebrationProps) {
  const navigate = useNavigate();
  const { generateReport } = useAssessments();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Trigger confetti celebration on mount
  useEffect(() => {
    // Multiple confetti bursts for extra celebration
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      // Right side  
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Additional celebration burst
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const handleGenerateReport = async () => {
    if (!assessment?.id) {
      toast.error('Assessment ID is required to generate report');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const report = await generateReport(assessment.id);
      setGeneratedReport(report);
      
      // Small celebration for successful report generation
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const completedElements = elementAssessments?.filter(e => e.assessed) || [];
  const totalElements = elementAssessments?.length || 0;
  const completionRate = totalElements > 0 ? (completedElements.length / totalElements) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Celebration Header */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Assessment Completed Successfully!
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </CardTitle>
          <CardDescription className="text-lg text-green-700">
            Congratulations! Your building assessment has been completed and saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {completedElements.length}
              </div>
              <div className="text-sm text-muted-foreground">Elements Assessed</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(completionRate)}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {buildingData?.name || 'Building'}
              </div>
              <div className="text-sm text-muted-foreground">Building Assessed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            What would you like to do next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="text-center">
                <div className="font-medium">View Details</div>
                <div className="text-xs text-muted-foreground">See assessment data</div>
              </div>
            </Button>
            
            <Button 
              onClick={onEditAssessment}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Edit3 className="h-8 w-8 text-orange-600" />
              <div className="text-center">
                <div className="font-medium">Edit Assessment</div>
                <div className="text-xs text-muted-foreground">Make changes</div>
              </div>
            </Button>

            <Button 
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isGeneratingReport ? (
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              ) : (
                <FileText className="h-8 w-8 text-white" />
              )}
              <div className="text-center text-white">
                <div className="font-medium">
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </div>
                <div className="text-xs opacity-90">
                  {isGeneratingReport ? 'Please wait' : 'FCI calculation & report'}
                </div>
              </div>
            </Button>

            <Button 
              onClick={() => navigate('/assessments')}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              <Building2 className="h-8 w-8 text-gray-600" />
              <div className="text-center">
                <div className="font-medium">All Assessments</div>
                <div className="text-xs text-muted-foreground">Back to list</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Details (Expandable) */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Assessment Details
            </CardTitle>
            <CardDescription>
              Detailed view of your completed assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Building Information */}
            <div>
              <h4 className="font-medium mb-2">Building Information</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">{buildingData?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2 font-medium">{buildingData?.type || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Square Footage:</span>
                  <span className="ml-2 font-medium">{buildingData?.square_footage?.toLocaleString() || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Year Built:</span>
                  <span className="ml-2 font-medium">{buildingData?.year_built || 'N/A'}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Assessment Summary */}
            <div>
              <h4 className="font-medium mb-2">Assessment Summary</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalElements}</div>
                  <div className="text-muted-foreground">Total Elements</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{completedElements.length}</div>
                  <div className="text-muted-foreground">Assessed</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{totalElements - completedElements.length}</div>
                  <div className="text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Element Status List */}
            <div>
              <h4 className="font-medium mb-2">Element Status</h4>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {elementAssessments?.map((element, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="font-medium">
                      {element.name || `Element ${index + 1}`}
                    </div>
                    <Badge variant={element.assessed ? "default" : "secondary"}>
                      {element.assessed ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Report Display */}
      {generatedReport && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <FileText className="h-5 w-5" />
              FCI Assessment Report Generated!
            </CardTitle>
            <CardDescription>
              Your Facility Condition Index report is ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* FCI Summary */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {generatedReport.fci_results?.fci_score?.toFixed(3) || '0.000'}
                </div>
                <div className="text-sm text-muted-foreground">FCI Score</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  ${((generatedReport.fci_results?.total_repair_cost || 0) / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-muted-foreground">Total Repair Cost</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  ${((generatedReport.fci_results?.replacement_cost || 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-muted-foreground">Replacement Value</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <Badge 
                  variant={
                    generatedReport.fci_results?.condition_rating === 'Good' ? 'default' :
                    generatedReport.fci_results?.condition_rating === 'Fair' ? 'secondary' :
                    'destructive'
                  }
                  className="text-lg px-3 py-1"
                >
                  {generatedReport.fci_results?.condition_rating || 'Unknown'}
                </Badge>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={() => window.print()}>
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => navigate('/reports')}>
                View All Reports
              </Button>
              <Button variant="outline" onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(generatedReport, null, 2));
                toast.success('Report data copied to clipboard');
              }}>
                Copy Report Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
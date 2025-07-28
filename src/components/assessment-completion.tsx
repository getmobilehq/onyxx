import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Building2, AlertTriangle, TrendingUp, Download, FileText, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getFCIStatus, formatFCI, getFCIProgress, DEFICIENCY_CATEGORIES } from '@/lib/fci-utils';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface DeficiencyDetail {
  id: string;
  elementId: string;
  elementName: string;
  description: string;
  cost: number;
  category: string;
  photos?: File[];
}

interface AssessmentCompletionProps {
  assessmentData: any;
  buildingData: any;
  onGenerateReport?: () => void;
  onViewDetails?: () => void;
}

export function AssessmentCompletion({ assessmentData, buildingData, onGenerateReport, onViewDetails }: AssessmentCompletionProps) {
  const navigate = useNavigate();
  const [deficienciesByCategory, setDeficienciesByCategory] = useState<Record<string, DeficiencyDetail[]>>({});
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  
  const fci = assessmentData?.fieldAssessmentData?.fci || 0;
  const totalRepairCost = assessmentData?.fieldAssessmentData?.totalRepairCost || 0;
  const replacementValue = assessmentData?.preAssessmentData?.replacementValue || 0;
  const fciStatus = getFCIStatus(fci);
  const fciProgress = getFCIProgress(fci);

  // Process deficiencies by category
  useEffect(() => {
    if (assessmentData?.fieldAssessmentData?.elementAssessments) {
      const deficiencies: DeficiencyDetail[] = [];
      
      // Extract all deficiencies from all elements
      assessmentData.fieldAssessmentData.elementAssessments.forEach((element: any) => {
        if (element.deficiencies) {
          element.deficiencies.forEach((def: any) => {
            deficiencies.push({
              ...def,
              elementId: element.elementId,
              elementName: element.elementLabel || element.elementName,
            });
          });
        }
      });

      // Group by category
      const grouped = deficiencies.reduce((acc, def) => {
        const category = def.category || 'other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(def);
        return acc;
      }, {} as Record<string, DeficiencyDetail[]>);

      // Calculate totals by category
      const totals = Object.entries(grouped).reduce((acc, [category, defs]) => {
        acc[category] = defs.reduce((sum, def) => sum + def.cost, 0);
        return acc;
      }, {} as Record<string, number>);

      setDeficienciesByCategory(grouped);
      setCategoryTotals(totals);
    }
  }, [assessmentData]);

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs text-primary-foreground font-bold">✓</span>
            </div>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Assessment Complete!</h2>
          <p className="text-muted-foreground mt-1">
            {buildingData?.name} has been successfully assessed
          </p>
        </div>
      </div>

      {/* FCI Score Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Facility Condition Index (FCI)</CardTitle>
          <CardDescription>Overall building condition assessment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* FCI Score Display */}
          <div className="text-center space-y-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="text-5xl font-bold" style={{ color: fciStatus.color }}>
                {formatFCI(fci)}
              </div>
            </div>
            <div>
              <Badge 
                className="text-lg px-4 py-1"
                style={{ 
                  backgroundColor: fciStatus.color + '20',
                  color: fciStatus.color,
                  borderColor: fciStatus.color
                }}
              >
                {fciStatus.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {fciStatus.description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Condition Score</span>
              <span>{fciProgress.toFixed(0)}%</span>
            </div>
            <Progress value={fciProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Critical (0.7+)</span>
              <span>Excellent (0-0.1)</span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Recommendation</p>
                <p className="text-sm text-muted-foreground">{fciStatus.recommendation}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Summary</CardTitle>
          <CardDescription>Total repair and replacement costs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Repair Cost</p>
              <p className="text-2xl font-bold text-destructive">
                ${totalRepairCost.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Replacement Value</p>
              <p className="text-2xl font-bold">
                ${replacementValue.toLocaleString()}
              </p>
            </div>
          </div>
          
          <Separator />
          
          {/* Cost by Category */}
          <div className="space-y-3">
            <p className="font-medium">Deficiency Costs by Category</p>
            {Object.entries(categoryTotals).map(([category, total]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm">{DEFICIENCY_CATEGORIES[category as keyof typeof DEFICIENCY_CATEGORIES]}</span>
                <span className="font-medium">${total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deficiency Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deficiency Details</CardTitle>
          <CardDescription>
            {Object.values(deficienciesByCategory).flat().length} deficiencies identified across {assessmentData?.fieldAssessmentData?.elementAssessments?.length || 0} elements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {Object.entries(deficienciesByCategory).map(([category, deficiencies]) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{DEFICIENCY_CATEGORIES[category as keyof typeof DEFICIENCY_CATEGORIES]}</span>
                    <Badge variant="secondary">{deficiencies.length} items</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-3">
                    {deficiencies.map((def, index) => (
                      <div key={def.id || index} className="rounded-lg border p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{def.elementName}</p>
                            <p className="text-sm text-muted-foreground">{def.description}</p>
                          </div>
                          <span className="font-medium text-destructive">
                            ${def.cost.toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Photos */}
                        {def.photos && def.photos.length > 0 && (
                          <div className="flex items-center gap-2 pt-2">
                            <Camera className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {def.photos.length} photo{def.photos.length > 1 ? 's' : ''} attached
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Assessment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assessment Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Building</p>
                <p className="font-medium">{buildingData?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Building Type</p>
                <p className="font-medium">{buildingData?.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Square Footage</p>
                <p className="font-medium">{buildingData?.size?.toLocaleString()} sq ft</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Assessment Type</p>
                <p className="font-medium">{assessmentData?.preAssessmentData?.assessmentType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assessment Date</p>
                <p className="font-medium">
                  {new Date(assessmentData?.preAssessmentData?.assessmentDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Elements Assessed</p>
                <p className="font-medium">
                  {assessmentData?.fieldAssessmentData?.elementAssessments?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => navigate('/assessments')} variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          View All Assessments
        </Button>
        <Button onClick={onGenerateReport || (() => navigate('/reports/new'))}>
          <Download className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
        <Button onClick={() => navigate(`/buildings/${buildingData?.id}`)} variant="secondary">
          <Building2 className="mr-2 h-4 w-4" />
          View Building
        </Button>
      </div>
    </div>
  );
}
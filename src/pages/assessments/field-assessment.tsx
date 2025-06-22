import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, Info, Camera, Plus, X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useAssessments } from '@/hooks/use-assessments';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AssessmentWorkflow } from '@/components/assessment-workflow';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { buildingTypeCosts } from '@/data/building-costs';

// Condition ratings
const conditionRatings = [
  { value: 'new', label: 'New/Excellent', description: 'Like new condition, no visible defects', years: 0 },
  { value: 'good', label: 'Good', description: 'Minor wear, fully functional', years: 5 },
  { value: 'fair', label: 'Fair', description: 'Moderate wear, some maintenance needed', years: 10 },
  { value: 'poor', label: 'Poor', description: 'Significant wear, major repairs needed', years: 15 },
  { value: 'critical', label: 'Critical', description: 'End of life, replacement required', years: 20 },
];

// Form validation schema for element assessment
const elementAssessmentSchema = z.object({
  condition: z.string().min(1, 'Condition rating is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0.01, 'Unit cost is required and must be greater than $0.01'),
  notes: z.string().optional(),
  deficiencies: z.array(z.object({
    description: z.string().min(1, 'Deficiency description is required'),
    severity: z.enum(['low', 'medium', 'high']),
    cost: z.number().min(0, 'Cost must be positive'),
  })).optional(),
});

type ElementAssessmentForm = z.infer<typeof elementAssessmentSchema>;

export function FieldAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('buildingId');
  const assessmentId = searchParams.get('assessmentId');
  
  const { updateAssessment } = useAssessments();
  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [preAssessmentData, setPreAssessmentData] = useState<any>(null);
  const [elementAssessments, setElementAssessments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<{ [key: string]: File[] }>({});
  const [deficiencies, setDeficiencies] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load assessment data
  useEffect(() => {
    const currentAssessment = localStorage.getItem('currentAssessment');
    const preAssessment = localStorage.getItem(`pre-assessment-${buildingId}`);
    
    if (currentAssessment && preAssessment) {
      setAssessmentData(JSON.parse(currentAssessment));
      const preData = JSON.parse(preAssessment);
      setPreAssessmentData(preData);
      
      // Initialize element assessments array
      const initialAssessments = preData.selectedElements.map((element: any) => ({
        elementId: element.id,
        elementName: element.name,
        condition: '',
        quantity: element.quantity || 1,
        unitCost: 0,
        totalCost: 0,
        notes: '',
        photos: [],
        deficiencies: [],
        assessed: false,
      }));
      setElementAssessments(initialAssessments);
    } else {
      // Redirect if no pre-assessment data
      navigate('/assessments/new');
    }
  }, [buildingId, navigate]);

  const form = useForm<ElementAssessmentForm>({
    resolver: zodResolver(elementAssessmentSchema),
    defaultValues: {
      condition: '',
      quantity: 1,
      unitCost: 0,
      notes: '',
      deficiencies: [],
    },
  });

  // Update form when element changes
  useEffect(() => {
    if (elementAssessments[currentElementIndex]) {
      const element = elementAssessments[currentElementIndex];
      form.reset({
        condition: element.condition || '',
        quantity: element.quantity || 1,
        unitCost: element.unitCost || 0,
        notes: element.notes || '',
        deficiencies: element.deficiencies || [],
      });
      setDeficiencies(element.deficiencies || []);
    }
  }, [currentElementIndex, elementAssessments, form]);

  const currentElement = preAssessmentData?.selectedElements[currentElementIndex];
  const currentAssessment = elementAssessments[currentElementIndex];
  const progress = elementAssessments.length > 0 
    ? (elementAssessments.filter(e => e.assessed).length / elementAssessments.length) * 100 
    : 0;

  const handlePhotoUpload = (files: FileList | null) => {
    if (!files || !currentElement) return;

    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        toast.error(`${file.name} is not a valid image type`);
        return false;
      }
      
      if (file.size > maxSize) {
        toast.error(`${file.name} is larger than 10MB`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      setPhotos(prev => ({
        ...prev,
        [currentElement.id]: [...(prev[currentElement.id] || []), ...validFiles]
      }));
      
      // Update element assessment
      const updatedAssessments = [...elementAssessments];
      updatedAssessments[currentElementIndex] = {
        ...updatedAssessments[currentElementIndex],
        photos: [...(updatedAssessments[currentElementIndex].photos || []), ...validFiles]
      };
      setElementAssessments(updatedAssessments);
      
      toast.success(`${validFiles.length} photo(s) uploaded`);
    }
  };

  const removePhoto = (elementId: string, index: number) => {
    setPhotos(prev => ({
      ...prev,
      [elementId]: prev[elementId].filter((_, i) => i !== index)
    }));
    
    // Update element assessment
    const updatedAssessments = [...elementAssessments];
    updatedAssessments[currentElementIndex] = {
      ...updatedAssessments[currentElementIndex],
      photos: updatedAssessments[currentElementIndex].photos.filter((_: any, i: number) => i !== index)
    };
    setElementAssessments(updatedAssessments);
  };

  const addDeficiency = () => {
    const newDeficiency = {
      id: Date.now().toString(),
      description: '',
      severity: 'medium',
      cost: 0,
    };
    setDeficiencies([...deficiencies, newDeficiency]);
  };

  const updateDeficiency = (id: string, field: string, value: any) => {
    setDeficiencies(prev => 
      prev.map(d => d.id === id ? { ...d, [field]: value } : d)
    );
  };

  const removeDeficiency = (id: string) => {
    setDeficiencies(prev => prev.filter(d => d.id !== id));
  };

  const saveCurrentElement = (data: ElementAssessmentForm) => {
    if (!currentElement) return;

    // Calculate total cost
    const totalCost = data.quantity * data.unitCost;
    
    // Calculate repair costs from deficiencies
    const immediateCost = deficiencies
      .filter(d => d.severity === 'high')
      .reduce((sum, d) => sum + (d.cost || 0), 0);
    
    const shortTermCost = deficiencies
      .filter(d => d.severity === 'medium')
      .reduce((sum, d) => sum + (d.cost || 0), 0);
    
    const longTermCost = deficiencies
      .filter(d => d.severity === 'low')
      .reduce((sum, d) => sum + (d.cost || 0), 0);

    // Update element assessment
    const updatedAssessments = [...elementAssessments];
    updatedAssessments[currentElementIndex] = {
      ...updatedAssessments[currentElementIndex],
      ...data,
      totalCost,
      deficiencies,
      immediateCost,
      shortTermCost,
      longTermCost,
      assessed: true,
    };
    setElementAssessments(updatedAssessments);

    // Save to localStorage
    localStorage.setItem(`field-assessment-${buildingId}`, JSON.stringify({
      buildingId,
      assessments: updatedAssessments,
      lastUpdated: new Date().toISOString(),
    }));

    toast.success(`Assessment saved for ${currentElement.name}`);
  };

  const handleNext = async () => {
    try {
      const data = form.getValues();
      
      // Validate the current element data
      await elementAssessmentSchema.parseAsync(data);
      
      saveCurrentElement(data);

      if (currentElementIndex < preAssessmentData.selectedElements.length - 1) {
        setCurrentElementIndex(currentElementIndex + 1);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          toast.error(err.message);
        });
      }
    }
  };

  const handlePrevious = () => {
    const data = form.getValues();
    saveCurrentElement(data);

    if (currentElementIndex > 0) {
      setCurrentElementIndex(currentElementIndex - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const data = form.getValues();
      
      // Validate the current element data
      await elementAssessmentSchema.parseAsync(data);
      
      saveCurrentElement(data);

    // Check if all elements are assessed
    const allAssessed = elementAssessments.every(e => e.assessed);
    if (!allAssessed) {
      toast.error('Please assess all elements before completing');
      return;
    }

    // Calculate total costs
    const totalImmediateCost = elementAssessments.reduce((sum, e) => sum + (e.immediateCost || 0), 0);
    const totalShortTermCost = elementAssessments.reduce((sum, e) => sum + (e.shortTermCost || 0), 0);
    const totalLongTermCost = elementAssessments.reduce((sum, e) => sum + (e.longTermCost || 0), 0);
    const totalRepairCost = totalImmediateCost + totalShortTermCost + totalLongTermCost;
    
    // Calculate FCI
    const replacementValue = preAssessmentData.replacementValue || 0;
    const fci = replacementValue > 0 ? totalRepairCost / replacementValue : 0;

    // Save complete assessment
    const completeAssessment = {
      ...assessmentData,
      status: 'completed',
      currentStep: 3,
      fieldAssessmentData: {
        elementAssessments,
        totalImmediateCost,
        totalShortTermCost,
        totalLongTermCost,
        totalRepairCost,
        fci,
        completedAt: new Date().toISOString(),
      }
    };

    localStorage.setItem('currentAssessment', JSON.stringify(completeAssessment));
    localStorage.setItem(`assessment-${buildingId}`, JSON.stringify(completeAssessment));

    // Update assessment status in backend
    if (assessmentId) {
      try {
        await updateAssessment(assessmentId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: `Assessment completed with FCI of ${fci.toFixed(4)}. Total repair cost: $${totalRepairCost.toLocaleString()}`
        });
        
        toast.success('Field assessment completed and saved to database!');
      } catch (error) {
        console.error('Failed to update assessment in backend:', error);
        toast.warning('Assessment completed locally but failed to save to database');
      }
    } else {
      toast.success('Field assessment completed successfully!');
    }
    
    // Navigate back to assessments list
    setTimeout(() => {
      navigate('/assessments');
    }, 1500);
    
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          toast.error(err.message);
        });
      }
    }
  };

  const handleSaveDraft = () => {
    const data = form.getValues();
    saveCurrentElement(data);
    toast.success('Draft saved successfully');
  };

  if (!currentElement) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/assessments">Assessments</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Field Assessment</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Field Assessment</h2>
          <p className="text-muted-foreground">
            Assess each building element and document deficiencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <Button variant="outline" asChild>
            <Link to="/assessments">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
        </div>
      </div>

      {/* Assessment Workflow */}
      <AssessmentWorkflow currentStep={2} />

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assessment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{elementAssessments.filter(e => e.assessed).length} of {elementAssessments.length} elements assessed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Current Element */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Element {currentElementIndex + 1} of {preAssessmentData?.selectedElements.length}
              </CardTitle>
              <CardDescription className="mt-1">
                {currentElement.id} - {currentElement.name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentElement.majorGroup}</Badge>
              <Badge variant="outline">{currentElement.group}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              {/* Condition Rating */}
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition Rating</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3"
                      >
                        {conditionRatings.map((rating) => (
                          <Label
                            key={rating.value}
                            htmlFor={rating.value}
                            className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent"
                          >
                            <RadioGroupItem value={rating.value} id={rating.value} className="mt-1" />
                            <div className="space-y-1">
                              <p className="font-medium leading-none">{rating.label}</p>
                              <p className="text-sm text-muted-foreground">{rating.description}</p>
                            </div>
                          </Label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                {/* Quantity */}
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Unit Cost */}
                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Cost ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Replacement cost per unit</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Photos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Photos</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Add Photos
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e.target.files)}
                  />
                </div>
                
                {photos[currentElement.id]?.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {photos[currentElement.id].map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(currentElement.id, index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deficiencies */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Deficiencies</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDeficiency}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Deficiency
                  </Button>
                </div>
                
                {deficiencies.length > 0 && (
                  <div className="space-y-3">
                    {deficiencies.map((deficiency) => (
                      <Card key={deficiency.id}>
                        <CardContent className="p-4 space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                placeholder="Describe the deficiency..."
                                value={deficiency.description}
                                onChange={(e) => updateDeficiency(deficiency.id, 'description', e.target.value)}
                                className="min-h-[80px]"
                              />
                            </div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Severity</Label>
                                  <Select
                                    value={deficiency.severity}
                                    onValueChange={(value) => updateDeficiency(deficiency.id, 'severity', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Cost ($)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={deficiency.cost}
                                    onChange={(e) => updateDeficiency(deficiency.id, 'cost', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => removeDeficiency(deficiency.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional observations or notes..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentElementIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {currentAssessment?.assessed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Assessed
            </div>
          )}
        </div>

        {currentElementIndex === preAssessmentData.selectedElements.length - 1 ? (
          <Button onClick={handleComplete}>
            <FileText className="mr-2 h-4 w-4" />
            Complete Assessment
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
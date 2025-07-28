import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Building2, Info, Camera, Plus, X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { useAssessments } from '@/hooks/use-assessments';
import { useBuildings } from '@/hooks/use-buildings';
import { AssessmentCompletion } from '@/components/assessment-completion';

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
  notes: z.string().optional(),
  deficiencies: z.array(z.object({
    description: z.string().min(1, 'Deficiency description is required'),
    cost: z.number().min(0.01, 'Cost must be greater than 0'),
    category: z.string().min(1, 'Category is required'),
    photos: z.array(z.any()).optional(),
  })).optional(),
}).refine((data) => {
  // Require at least one deficiency for all conditions except new/excellent
  if (data.condition && data.condition !== 'new') {
    return data.deficiencies && data.deficiencies.length > 0 && 
           data.deficiencies.every(d => d.description && d.description.trim() !== '' && d.cost > 0);
  }
  return true;
}, {
  message: 'At least one deficiency is required for this condition rating',
  path: ['deficiencies'],
});

type ElementAssessmentForm = z.infer<typeof elementAssessmentSchema>;

export function FieldAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('buildingId');
  const assessmentId = searchParams.get('assessmentId');
  
  const { updateAssessment, saveAssessmentElements, updateAssessmentElement } = useAssessments();
  const { getBuilding } = useBuildings();
  const [currentElementIndex, setCurrentElementIndex] = useState(0);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [preAssessmentData, setPreAssessmentData] = useState<any>(null);
  const [elementAssessments, setElementAssessments] = useState<any[]>([]);
  const [photos, setPhotos] = useState<{ [key: string]: File[] }>({});
  const [deficiencies, setDeficiencies] = useState<any[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedAssessment, setCompletedAssessment] = useState<any>(null);
  const [buildingData, setBuildingData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load building data
  useEffect(() => {
    const loadBuildingData = async () => {
      if (buildingId) {
        try {
          const building = await getBuilding(buildingId);
          setBuildingData(building);
        } catch (error) {
          console.error('Failed to load building data:', error);
        }
      }
    };
    loadBuildingData();
  }, [buildingId, getBuilding]);

  // Load assessment data
  useEffect(() => {
    const currentAssessment = localStorage.getItem('currentAssessment');
    const preAssessment = localStorage.getItem(`pre-assessment-${buildingId}`);
    
    if (currentAssessment && preAssessment) {
      setAssessmentData(JSON.parse(currentAssessment));
      const preData = JSON.parse(preAssessment);
      setPreAssessmentData(preData);
      
      // Initialize element assessments array - create separate instances for quantity > 1
      const initialAssessments: any[] = [];
      preData.selectedElements.forEach((element: any) => {
        const quantity = element.quantity || 1;
        for (let i = 0; i < quantity; i++) {
          initialAssessments.push({
            elementId: element.id,
            elementName: element.label || element.name,
            elementLabel: quantity > 1 ? `${element.label || element.name} - Unit ${i + 1}` : (element.label || element.name),
            originalElement: element,
            instanceNumber: i + 1,
            totalQuantity: quantity,
            condition: '',
            quantity: 1, // Each instance represents 1 unit
            totalCost: 0,
            notes: '',
            photos: [],
            deficiencies: [],
            assessed: false,
          });
        }
      });
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
        notes: element.notes || '',
        deficiencies: element.deficiencies || [],
      });
      setDeficiencies(element.deficiencies || []);
    }
  }, [currentElementIndex, elementAssessments, form]);

  const currentAssessment = elementAssessments[currentElementIndex];
  const currentElement = currentAssessment?.originalElement;
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
      cost: 0,
      category: '',
      photos: [], // Add photos array for each deficiency
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

    // Pass deficiencies to the form data
    const formDataWithDeficiencies = {
      ...data,
      deficiencies: deficiencies.filter(d => d.description && d.description.trim() !== '')
    };

    // Calculate total cost as sum of all deficiency costs
    const totalCost = deficiencies.reduce((sum, d) => sum + (d.cost || 0), 0);
    
    // Total repair cost is now just the sum of deficiency costs
    const totalRepairCost = totalCost;

    // Update element assessment
    const updatedAssessments = [...elementAssessments];
    updatedAssessments[currentElementIndex] = {
      ...updatedAssessments[currentElementIndex],
      ...data,
      totalCost,
      totalRepairCost,
      deficiencies,
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
      
      // Include deficiencies in validation
      const dataWithDeficiencies = {
        ...data,
        deficiencies: deficiencies.filter(d => d.description && d.description.trim() !== '')
      };
      
      // Validate the current element data
      await elementAssessmentSchema.parseAsync(dataWithDeficiencies);
      
      saveCurrentElement(data);

      if (currentElementIndex < elementAssessments.length - 1) {
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
      
      // Include deficiencies in validation
      const dataWithDeficiencies = {
        ...data,
        deficiencies: deficiencies.filter(d => d.description && d.description.trim() !== '')
      };
      
      // Validate the current element data
      await elementAssessmentSchema.parseAsync(dataWithDeficiencies);
      
      saveCurrentElement(data);

    // Check if all elements are assessed
    const allAssessed = elementAssessments.every(e => e.assessed);
    if (!allAssessed) {
      toast.error('Please assess all elements before completing');
      return;
    }

    // Calculate total costs - sum of all element costs (which are sum of deficiency costs)
    const totalRepairCost = elementAssessments.reduce((sum, e) => sum + (e.totalCost || 0), 0);
    
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
        totalRepairCost,
        fci,
        completedAt: new Date().toISOString(),
      }
    };

    localStorage.setItem('currentAssessment', JSON.stringify(completeAssessment));
    localStorage.setItem(`assessment-${buildingId}`, JSON.stringify(completeAssessment));

    // Save assessment elements with deficiencies to backend
    if (assessmentId) {
      try {
        // Convert condition ratings to numeric values (1-5)
        const conditionToRating = {
          'new': 5,
          'good': 4,
          'fair': 3,
          'poor': 2,
          'critical': 1
        };

        // Prepare elements for backend with proper format
        const elementsForBackend = elementAssessments
          .filter(e => e.assessed)
          .map(e => ({
            element_id: e.id,
            condition_rating: conditionToRating[e.condition as keyof typeof conditionToRating] || 3,
            notes: e.notes || '',
            photo_urls: e.photos || [],
            deficiencies: (e.deficiencies || []).map((d: any) => ({
              description: d.description,
              cost: d.cost || 0,
              category: d.category || '',
              photos: d.photos || []
            }))
          }));

        // Save all assessment elements with deficiencies
        await saveAssessmentElements(assessmentId, elementsForBackend);

        // Update assessment status
        await updateAssessment(assessmentId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: `Assessment completed with FCI of ${fci.toFixed(4)}. Total repair cost: $${totalRepairCost.toLocaleString()}`
        });
        
        toast.success('Field assessment completed with all deficiency data saved!');
      } catch (error) {
        console.error('Failed to save assessment to backend:', error);
        toast.warning('Assessment completed locally but failed to save complete data to database');
      }
    } else {
      toast.success('Field assessment completed successfully!');
    }
    
    // Show completion screen
    setCompletedAssessment(completeAssessment);
    setIsCompleted(true);
    
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          toast.error(err.message);
        });
      }
    }
  };

  const handleSaveDraft = async () => {
    const data = form.getValues();
    saveCurrentElement(data);
    
    // Also save current element to backend if assessmentId exists
    if (assessmentId && currentElement) {
      try {
        const conditionToRating = {
          'new': 5,
          'good': 4,
          'fair': 3,
          'poor': 2,
          'critical': 1
        };

        const elementData = {
          condition_rating: conditionToRating[data.condition as keyof typeof conditionToRating] || 3,
          notes: data.notes || '',
          photo_urls: photos[currentElement.id] || [],
          deficiencies: deficiencies.filter(d => d.description && d.description.trim() !== '').map(d => ({
            description: d.description,
            cost: d.cost || 0,
            category: d.category || '',
            photos: d.photos || []
          }))
        };

        await updateAssessmentElement(assessmentId, currentElement.id, elementData);
        toast.success('Draft saved successfully');
      } catch (error) {
        console.error('Failed to save draft to backend:', error);
        toast.success('Draft saved locally');
      }
    } else {
      toast.success('Draft saved successfully');
    }
  };

  // Show completion screen if assessment is completed
  if (isCompleted && completedAssessment) {
    return (
      <div className="p-6 pb-16">
        <AssessmentCompletion 
          assessmentData={completedAssessment}
          buildingData={buildingData}
          onGenerateReport={() => navigate(`/reports/new?assessmentId=${assessmentId}`)}
          onViewDetails={() => navigate(`/assessments/${assessmentId}`)}
        />
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Assessment Progress</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // This would open a dialog to add new elements
                toast.info('Add element functionality - to be implemented');
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Element
            </Button>
          </div>
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
                Element {currentElementIndex + 1} of {elementAssessments.length}
              </CardTitle>
              <CardDescription className="mt-1">
                {currentElement?.id} - {currentAssessment?.elementLabel}
                {currentAssessment?.totalQuantity > 1 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Unit {currentAssessment?.instanceNumber} of {currentAssessment?.totalQuantity})
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentElement?.majorGroup}</Badge>
              <Badge variant="outline">{currentElement?.group}</Badge>
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

              {/* Photos section removed - photos now only available within deficiencies */}

              {/* Deficiencies */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Deficiencies</Label>
                  {/* Only show Add Deficiency button if condition is not New/Excellent */}
                  {form.watch('condition') && form.watch('condition') !== 'new' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDeficiency}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Deficiency
                    </Button>
                  )}
                </div>
                
                {/* Show message for New/Excellent condition */}
                {form.watch('condition') === 'new' && (
                  <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                    <p className="text-sm">✨ No deficiencies needed for New/Excellent condition</p>
                  </div>
                )}
                
                {/* Show message when no deficiencies but condition requires them */}
                {form.watch('condition') && form.watch('condition') !== 'new' && deficiencies.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground bg-orange-50/50 border border-orange-200 rounded-lg">
                    <p className="text-sm">⚠️ At least one deficiency is required for this condition rating</p>
                    <p className="text-xs mt-1">Click "Add Deficiency" to get started</p>
                  </div>
                )}
                
                {deficiencies.length > 0 && (
                  <div className="space-y-3">
                    {deficiencies.map((deficiency) => (
                      <Card key={deficiency.id}>
                        <CardContent className="p-4 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Description *</Label>
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
                                  <Label>Cost ($) *</Label>
                                  <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={deficiency.cost || ''}
                                    onChange={(e) => updateDeficiency(deficiency.id, 'cost', parseFloat(e.target.value) || 0)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Category *</Label>
                                  <Select
                                    value={deficiency.category || ''}
                                    onValueChange={(value) => updateDeficiency(deficiency.id, 'category', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="life-safety">Life Safety & Code Compliance</SelectItem>
                                      <SelectItem value="critical-systems">Critical Systems & Operational Continuity</SelectItem>
                                      <SelectItem value="energy-efficiency">Energy Efficiency & Sustainability</SelectItem>
                                      <SelectItem value="asset-lifecycle">Asset Life Cycle & Deferred Maintenance</SelectItem>
                                      <SelectItem value="user-experience">User Experience & Aesthetic Enhancement</SelectItem>
                                      <SelectItem value="equity-accessibility">Equity & Accessibility</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              {/* Deficiency Photos */}
                              <div className="space-y-2">
                                <Label>Photos</Label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.multiple = true;
                                    input.onchange = (e) => {
                                      const files = (e.target as HTMLInputElement).files;
                                      if (files) {
                                        const newPhotos = [...(deficiency.photos || []), ...Array.from(files)];
                                        updateDeficiency(deficiency.id, 'photos', newPhotos);
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  <Camera className="mr-2 h-4 w-4" />
                                  Add Photos
                                </Button>
                                
                                {deficiency.photos && deficiency.photos.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    {deficiency.photos.map((photo: File, photoIndex: number) => (
                                      <div key={photoIndex} className="relative group">
                                        <img
                                          src={URL.createObjectURL(photo)}
                                          alt={`Deficiency photo ${photoIndex + 1}`}
                                          className="w-full h-16 object-cover rounded"
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() => {
                                            const newPhotos = deficiency.photos.filter((_: any, i: number) => i !== photoIndex);
                                            updateDeficiency(deficiency.id, 'photos', newPhotos);
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => removeDeficiency(deficiency.id)}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Remove Deficiency
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

        {currentElementIndex === elementAssessments.length - 1 ? (
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
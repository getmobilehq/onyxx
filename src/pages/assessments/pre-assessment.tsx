import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Info, CheckCircle2, Circle, Plus, X } from 'lucide-react';
import { useBuildings } from '@/hooks/use-buildings';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AssessmentWorkflow } from '@/components/assessment-workflow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { uniformatData } from '@/data/uniformat-codes';
import { buildingTypeCosts, getBuildingTypesForDropdown } from '@/data/building-costs';

// Form validation schema
const preAssessmentSchema = z.object({
  assessmentType: z.string().min(1, 'Assessment type is required'),
  assessmentDate: z.string().min(1, 'Assessment date is required'),
  assessmentScope: z.string().min(1, 'Assessment scope is required'),
  buildingType: z.string().min(1, 'Building type is required'),
  buildingSize: z.number().min(1, 'Building size is required'),
  checklist: z.object({
    buildingPlans: z.boolean(),
    accessPermissions: z.boolean(),
    safetyEquipment: z.boolean(),
    previousReports: z.boolean(),
    keyStakeholders: z.boolean(),
    weatherConditions: z.boolean(),
    emergencyProcedures: z.boolean(),
    equipmentCalibration: z.boolean(),
  }),
  additionalNotes: z.string().optional(),
});

type PreAssessmentForm = z.infer<typeof preAssessmentSchema>;

// Pre-assessment checklist items
const checklistItems = [
  {
    id: 'buildingPlans',
    label: 'Building Plans and Drawings',
    description: 'Architectural, structural, and MEP drawings are available and reviewed'
  },
  {
    id: 'accessPermissions',
    label: 'Access Permissions',
    description: 'All necessary permissions and access arrangements are confirmed'
  },
  {
    id: 'safetyEquipment',
    label: 'Safety Equipment',
    description: 'Personal protective equipment and safety gear are ready'
  },
  {
    id: 'previousReports',
    label: 'Previous Assessment Reports',
    description: 'Historical assessment data and maintenance records are gathered'
  },
  {
    id: 'keyStakeholders',
    label: 'Key Stakeholders Identified',
    description: 'Building management and maintenance staff contacts are established'
  },
  {
    id: 'weatherConditions',
    label: 'Weather Conditions Checked',
    description: 'Weather forecast reviewed for assessment day planning'
  },
  {
    id: 'emergencyProcedures',
    label: 'Emergency Procedures',
    description: 'Emergency contacts and procedures are documented'
  },
  {
    id: 'equipmentCalibration',
    label: 'Equipment Calibration',
    description: 'All measurement and testing equipment is calibrated and functional'
  }
];

export function PreAssessmentPage() {
  console.log('🏁 PreAssessmentPage rendered');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('buildingId');
  const assessmentId = searchParams.get('assessmentId');
  
  console.log('📍 URL params:', { buildingId, assessmentId });
  
  const { getBuilding } = useBuildings();
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [showElementDialog, setShowElementDialog] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [buildingData, setBuildingData] = useState<any>(null);
  const [loadingBuilding, setLoadingBuilding] = useState(true);

  // Load assessment data from localStorage
  useEffect(() => {
    console.log('🔄 Loading assessment data...');
    const currentAssessment = localStorage.getItem('currentAssessment');
    if (currentAssessment) {
      const data = JSON.parse(currentAssessment);
      console.log('📋 Loaded assessment data:', data);
      setAssessmentData(data);
    } else if (!buildingId) {
      // If no assessment data and no building ID, redirect to new assessment
      navigate('/assessments/new');
    }
  }, [buildingId, navigate]);

  // Load building data from API
  useEffect(() => {
    const loadBuilding = async () => {
      if (!buildingId) return;
      
      console.log('🏢 Loading building data for ID:', buildingId);
      setLoadingBuilding(true);
      
      try {
        const building = await getBuilding(buildingId);
        console.log('✅ Building loaded:', building);
        
        // Transform to match expected format
        const transformedBuilding = {
          id: building.id,
          name: building.name,
          location: `${building.city}, ${building.state}`,
          type: building.type,
          size: building.square_footage || 0
        };
        
        setBuildingData(transformedBuilding);
      } catch (error) {
        console.error('❌ Failed to load building:', error);
        toast.error('Failed to load building data');
      } finally {
        setLoadingBuilding(false);
      }
    };

    loadBuilding();
  }, [buildingId, getBuilding]);
  
  const form = useForm<PreAssessmentForm>({
    resolver: zodResolver(preAssessmentSchema),
    defaultValues: {
      assessmentType: 'Annual',
      assessmentDate: new Date().toISOString().split('T')[0],
      assessmentScope: 'Full',
      buildingType: '',
      buildingSize: buildingData?.size || 0,
      checklist: {
        buildingPlans: false,
        accessPermissions: false,
        safetyEquipment: false,
        previousReports: false,
        keyStakeholders: false,
        weatherConditions: false,
        emergencyProcedures: false,
        equipmentCalibration: false,
      },
      additionalNotes: '',
    },
  });

  // Update form when building data is loaded
  useEffect(() => {
    if (buildingData) {
      form.setValue('buildingSize', buildingData.size);
    }
  }, [buildingData, form]);

  const onSubmit = (data: PreAssessmentForm) => {
    // Check if all checklist items are completed
    const checklistComplete = Object.values(data.checklist).every(Boolean);
    
    if (!checklistComplete) {
      toast.error('Please complete all checklist items before proceeding');
      return;
    }

    if (selectedElements.length === 0) {
      toast.error('Please add at least one building element');
      return;
    }

    // Calculate replacement value
    const replacementValue = data.buildingSize * (buildingTypeCosts[data.buildingType as keyof typeof buildingTypeCosts] || 300);

    // Save pre-assessment data
    const preAssessmentData = {
      ...data,
      buildingId: buildingId || assessmentData?.buildingId,
      buildingName: buildingData?.name,
      selectedElements,
      replacementValue,
      completedAt: new Date().toISOString(),
      status: 'completed'
    };

    // Update assessment status
    const updatedAssessment = {
      ...assessmentData,
      status: 'field-assessment',
      currentStep: 2,
      preAssessmentData
    };

    localStorage.setItem('currentAssessment', JSON.stringify(updatedAssessment));
    localStorage.setItem(`pre-assessment-${buildingId || assessmentData?.buildingId}`, JSON.stringify(preAssessmentData));
    
    toast.success('Pre-assessment completed! Proceeding to field assessment...');
    
    // Navigate to field assessment
    setTimeout(() => {
      const targetBuildingId = buildingId || assessmentData?.buildingId;
      const targetAssessmentId = assessmentId || assessmentData?.assessmentId;
      navigate(`/assessments/field-assessment?buildingId=${targetBuildingId}&assessmentId=${targetAssessmentId}`);
    }, 1000);
  };

  const handleSaveDraft = () => {
    const formData = form.getValues();
    
    // Save draft
    localStorage.setItem(`pre-assessment-draft-${buildingId || assessmentData?.buildingId}`, JSON.stringify({
      ...formData,
      selectedElements,
      savedAt: new Date().toISOString(),
      status: 'draft'
    }));
    
    toast.success('Draft saved successfully');
  };

  const addElement = (element: any, group: string, majorGroup: string) => {
    const newElement = {
      ...element,
      group,
      majorGroup,
      quantity: 1,
      unitCost: 0,
      notes: ''
    };
    
    setSelectedElements(prev => [...prev, newElement]);
    toast.success(`Added ${element.name}`);
  };

  const removeElement = (elementId: string) => {
    setSelectedElements(prev => prev.filter(el => el.id !== elementId));
  };

  const updateElementQuantity = (elementId: string, quantity: number) => {
    setSelectedElements(prev => 
      prev.map(el => el.id === elementId ? { ...el, quantity } : el)
    );
  };

  if (loadingBuilding) {
    return <div className="flex items-center justify-center h-full">Loading building data...</div>;
  }

  if (!buildingData) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-600 mb-4">Failed to load building data</p>
        <Button onClick={() => navigate('/assessments')}>Back to Assessments</Button>
      </div>
    );
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
            <BreadcrumbLink>Pre-Assessment</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pre-Assessment</h2>
          <p className="text-muted-foreground">
            Complete the checklist and add building elements before field assessment
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
      <AssessmentWorkflow currentStep={1} />

      {/* Building Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Building Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Building Name</p>
              <p className="text-lg font-medium">{buildingData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Location</p>
              <p className="text-lg">{buildingData.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="text-lg">{buildingData.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Size</p>
              <p className="text-lg">{buildingData.size.toLocaleString()} sq ft</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Assessment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
              <CardDescription>
                Configure the basic assessment parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="assessmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select assessment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Annual">Annual Assessment</SelectItem>
                        <SelectItem value="Initial">Initial Assessment</SelectItem>
                        <SelectItem value="Follow-up">Follow-up Assessment</SelectItem>
                        <SelectItem value="Partial">Partial Assessment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assessmentScope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Scope</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scope" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Full">Full Building Assessment</SelectItem>
                        <SelectItem value="Exterior">Exterior Only</SelectItem>
                        <SelectItem value="Interior">Interior Only</SelectItem>
                        <SelectItem value="Systems">Systems Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buildingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building Type (for costing)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select building type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getBuildingTypesForDropdown().map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pre-Assessment Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Pre-Assessment Checklist</CardTitle>
              <CardDescription>
                Ensure all items are completed before proceeding to field assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklistItems.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name={`checklist.${item.id}` as any}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>{item.label}</FormLabel>
                        <FormDescription>{item.description}</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>

          {/* Building Elements */}
          <Card>
            <CardHeader>
              <CardTitle>Building Elements</CardTitle>
              <CardDescription>
                Add the elements present in the building that will be assessed
              </CardDescription>
              <div className="flex justify-end">
                <Dialog open={showElementDialog} onOpenChange={setShowElementDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Elements
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Select Building Elements</DialogTitle>
                      <DialogDescription>
                        Choose the elements present in the building
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-6">
                        {uniformatData.map((major) => (
                          <div key={major.id}>
                            <h3 className="font-semibold text-lg mb-3">{major.name}</h3>
                            <div className="space-y-4">
                              {major.groups.map((group) => (
                                <div key={group.id}>
                                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                                    {group.name}
                                  </h4>
                                  <div className="grid gap-2">
                                    {group.elements.map((element) => {
                                      const isSelected = selectedElements.some(el => el.id === element.id);
                                      return (
                                        <div
                                          key={element.id}
                                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent ${
                                            isSelected ? 'bg-accent border-primary' : ''
                                          }`}
                                          onClick={() => !isSelected && addElement(element, group.name, major.name)}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div>
                                              <p className="font-medium">{element.id}</p>
                                              <p className="text-sm text-muted-foreground">{element.name}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                              {element.usefulLife} years
                                            </Badge>
                                            {isSelected && (
                                              <CheckCircle2 className="h-5 w-5 text-primary" />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <DialogFooter>
                      <Button onClick={() => setShowElementDialog(false)}>Done</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {selectedElements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No elements added yet. Click "Add Elements" to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedElements.map((element) => (
                    <div key={element.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium">{element.id} - {element.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {element.majorGroup} • {element.group}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`quantity-${element.id}`} className="text-sm">
                            Quantity:
                          </Label>
                          <Input
                            id={`quantity-${element.id}`}
                            type="number"
                            min="1"
                            value={element.quantity}
                            onChange={(e) => updateElementQuantity(element.id, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeElement(element.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 text-sm text-muted-foreground">
                    Total elements selected: {selectedElements.length}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Any other relevant information for the assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="additionalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes or observations..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="submit" size="lg">
              Complete Pre-Assessment
              <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
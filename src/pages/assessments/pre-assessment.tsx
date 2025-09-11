import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, CheckCircle2, Plus, X } from 'lucide-react';
import { useBuildings } from '@/hooks/use-buildings';
import { usePreAssessments } from '@/hooks/use-pre-assessments';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  buildingSize: z.number().min(1, 'Building size is required'),
  replacementValue: z.number().min(1, 'Replacement value is required'),
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
  const { 
    currentPreAssessment, 
    loading: preAssessmentLoading, 
    getByAssessmentId, 
    saveDraft, 
    completePreAssessment 
  } = usePreAssessments();
  
  const [selectedElements, setSelectedElements] = useState<any[]>([]);
  const [showElementDialog, setShowElementDialog] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const [buildingData, setBuildingData] = useState<any>(null);
  const [loadingBuilding, setLoadingBuilding] = useState(true);

  // Load assessment and pre-assessment data
  useEffect(() => {
    console.log('🔄 Loading assessment data...');
    
    // Try to load from localStorage first (for backward compatibility)
    const currentAssessment = localStorage.getItem('currentAssessment');
    if (currentAssessment) {
      const data = JSON.parse(currentAssessment);
      console.log('📋 Loaded assessment data from localStorage:', data);
      setAssessmentData(data);
    } else if (!buildingId) {
      // If no assessment data and no building ID, redirect to new assessment
      navigate('/assessments/new');
    }

    // Load existing pre-assessment from database if assessmentId exists
    // TODO: Pre-assessment API endpoints need to be implemented on backend
    // For now, pre-assessment data is stored locally and submitted directly
    if (assessmentId) {
      console.log('🔄 Pre-assessment will be stored locally for assessment:', assessmentId);
    }
  }, [buildingId, assessmentId, navigate]);

  // Load building data from API with useCallback to prevent re-renders
  const loadBuilding = useCallback(async () => {
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
  }, [buildingId, getBuilding]);
  
  useEffect(() => {
    loadBuilding();
  }, [loadBuilding]);
  
  const form = useForm<PreAssessmentForm>({
    resolver: zodResolver(preAssessmentSchema),
    defaultValues: {
      assessmentType: 'Annual',
      assessmentDate: new Date().toISOString().split('T')[0],
      assessmentScope: 'Full',
      buildingSize: 0,
      replacementValue: 0,
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
      // Use building's replacement value if available, otherwise calculate based on type
      const replacementValue = buildingData.replacement_value || 
        (buildingData.size * (buildingTypeCosts[buildingData.type] || 300));
      form.setValue('replacementValue', replacementValue);
    }
  }, [buildingData]); // Removed form from dependencies

  // Load existing pre-assessment data into form
  useEffect(() => {
    if (currentPreAssessment) {
      console.log('📋 Loading existing pre-assessment data:', currentPreAssessment);
      
      // Update form with existing data
      form.setValue('assessmentType', currentPreAssessment.assessment_type);
      // Convert ISO date to yyyy-MM-dd format for date input
      let assessmentDate = currentPreAssessment.assessment_date;
      if (assessmentDate) {
        // Handle different date formats
        if (typeof assessmentDate === 'string' && assessmentDate.includes('T')) {
          // ISO format - convert to yyyy-MM-dd
          assessmentDate = assessmentDate.split('T')[0];
        } else if (assessmentDate instanceof Date) {
          // Date object - convert to yyyy-MM-dd
          assessmentDate = assessmentDate.toISOString().split('T')[0];
        }
        // If it's already in yyyy-MM-dd format, use as-is
      } else {
        assessmentDate = new Date().toISOString().split('T')[0];
      }
      form.setValue('assessmentDate', assessmentDate);
      form.setValue('assessmentScope', currentPreAssessment.assessment_scope);
      form.setValue('buildingSize', currentPreAssessment.building_size);
      form.setValue('replacementValue', currentPreAssessment.replacement_value || 0);
      form.setValue('additionalNotes', currentPreAssessment.additional_notes || '');
      
      // Update checklist
      if (currentPreAssessment.checklist) {
        const checklist = typeof currentPreAssessment.checklist === 'string' 
          ? JSON.parse(currentPreAssessment.checklist) 
          : currentPreAssessment.checklist;
        
        Object.entries(checklist).forEach(([key, value]) => {
          form.setValue(`checklist.${key}` as any, value as boolean);
        });
      }
      
      // Update selected elements
      if (currentPreAssessment.selected_elements) {
        const elements = typeof currentPreAssessment.selected_elements === 'string'
          ? JSON.parse(currentPreAssessment.selected_elements)
          : currentPreAssessment.selected_elements;
        
        setSelectedElements(elements);
      }
    }
  }, [currentPreAssessment]); // Removed form from dependencies

  const onSubmit = async (data: PreAssessmentForm) => {
    if (selectedElements.length === 0) {
      toast.error('Please add at least one building element');
      return;
    }

    if (!assessmentId || !buildingId) {
      toast.error('Missing assessment or building ID');
      return;
    }

    // Use the replacement value from the form (user-entered or from building data)
    const buildingType = buildingData?.type || '';
    const replacementValue = data.replacementValue;

    // Prepare pre-assessment data for database
    const preAssessmentData = {
      assessment_id: assessmentId,
      building_id: buildingId,
      assessment_type: data.assessmentType,
      assessment_date: data.assessmentDate,
      assessment_scope: data.assessmentScope,
      building_size: data.buildingSize,
      building_type: buildingType,
      replacement_value: replacementValue,
      selected_elements: selectedElements,
      checklist: data.checklist,
      additional_notes: data.additionalNotes,
      assessor_name: assessmentData?.assessorName || 'Unknown Assessor'
    };

    // Save to database
    let savedPreAssessment = null;
    try {
      console.log('💾 Saving pre-assessment data to backend:', preAssessmentData);
      savedPreAssessment = await completePreAssessment(preAssessmentData);
      console.log('✅ Pre-assessment saved successfully:', savedPreAssessment);
    } catch (error: any) {
      console.error('❌ Failed to save pre-assessment to backend:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        assessmentId,
        buildingId
      });
      
      // Continue with local storage even if backend fails
      toast.warning('Pre-assessment saved locally, but failed to sync with server. You can still continue.');
    }
    
    // Always save to localStorage and continue, regardless of backend status
    if (savedPreAssessment || true) {
      // Also save to localStorage for backward compatibility
      const legacyData = {
        ...data,
        buildingType,
        buildingId,
        buildingName: buildingData?.name,
        selectedElements,
        replacementValue,
        completedAt: new Date().toISOString(),
        status: 'completed'
      };

      const updatedAssessment = {
        ...assessmentData,
        status: 'field-assessment',
        currentStep: 2,
        preAssessmentData: legacyData
      };

      localStorage.setItem('currentAssessment', JSON.stringify(updatedAssessment));
      localStorage.setItem(`pre-assessment-${buildingId}`, JSON.stringify(legacyData));
      
      toast.success('Pre-assessment completed! Proceeding to field assessment...');
      
      // Navigate to field assessment
      setTimeout(() => {
        navigate(`/assessments/field-assessment?buildingId=${buildingId}&assessmentId=${assessmentId}`);
      }, 1000);
    }
  };

  const handleSaveDraft = async () => {
    const formData = form.getValues();
    
    if (!assessmentId || !buildingId) {
      toast.error('Missing assessment or building ID');
      return;
    }

    // Calculate replacement value
    const buildingType = buildingData?.type || '';
    const replacementValue = formData.buildingSize * (buildingTypeCosts[buildingType as keyof typeof buildingTypeCosts] || 300);

    // Prepare draft data for database
    const draftData = {
      assessment_id: assessmentId,
      building_id: buildingId,
      assessment_type: formData.assessmentType,
      assessment_date: formData.assessmentDate,
      assessment_scope: formData.assessmentScope,
      building_size: formData.buildingSize,
      building_type: buildingType,
      replacement_value: replacementValue,
      selected_elements: selectedElements,
      checklist: formData.checklist,
      additional_notes: formData.additionalNotes,
      assessor_name: assessmentData?.assessorName || 'Unknown Assessor'
    };

    // Save draft to database
    await saveDraft(draftData);
    
    // Also save to localStorage for backward compatibility
    localStorage.setItem(`pre-assessment-draft-${buildingId}`, JSON.stringify({
      ...formData,
      selectedElements,
      savedAt: new Date().toISOString(),
      status: 'draft'
    }));
  };

  const addElement = (element: any, group: string, majorGroup: string) => {
    const newElement = {
      ...element,
      group,
      majorGroup,
      quantity: 1,
      unitCost: 0,
      notes: '',
      label: element.name // Default label to element name
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

  const updateElementLabel = (elementId: string, label: string) => {
    setSelectedElements(prev => 
      prev.map(el => el.id === elementId ? { ...el, label } : el)
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
            <BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/assessments">Assessments</Link></BreadcrumbLink>
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
                        <SelectItem value="Condition">Condition Assessment</SelectItem>
                        <SelectItem value="Compliance">Compliance Assessment</SelectItem>
                        <SelectItem value="Insurance">Insurance Assessment</SelectItem>
                        <SelectItem value="Due Diligence">Due Diligence Assessment</SelectItem>
                        <SelectItem value="Capital Planning">Capital Planning Assessment</SelectItem>
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

              {/* Building Type - Hidden, automatically used from building data */}
              
              <FormField
                control={form.control}
                name="buildingSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building Size (sq ft)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Total square footage of the building
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="replacementValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Replacement Value ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Current replacement value of the building
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Pre-Assessment Checklist - COMMENTED OUT PER USER REQUEST */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Pre-Assessment Checklist (Optional)</CardTitle>
              <CardDescription>
                Recommended items to review before field assessment
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
          </Card> */}

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
                      <Accordion type="multiple" className="w-full">
                        {uniformatData.map((major) => (
                          <AccordionItem key={major.id} value={major.id}>
                            <AccordionTrigger className="font-semibold text-lg">
                              {major.name}
                            </AccordionTrigger>
                            <AccordionContent>
                              <Accordion type="multiple" className="w-full pl-4">
                                {major.groups.map((group) => (
                                  <AccordionItem key={group.id} value={group.id}>
                                    <AccordionTrigger className="font-medium text-sm">
                                      {group.name}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="grid gap-2 pl-4">
                                        {group.elements
                                          .sort((a, b) => a.name.localeCompare(b.name))
                                          .map((element, index) => {
                                          const isSelected = selectedElements.some(el => el.id === element.id);
                                          const colors = [
                                            'border-l-blue-500 bg-blue-100 text-blue-900',
                                            'border-l-green-500 bg-green-100 text-green-900', 
                                            'border-l-purple-500 bg-purple-100 text-purple-900',
                                            'border-l-orange-500 bg-orange-100 text-orange-900',
                                            'border-l-pink-500 bg-pink-100 text-pink-900',
                                            'border-l-cyan-500 bg-cyan-100 text-cyan-900',
                                            'border-l-emerald-500 bg-emerald-100 text-emerald-900',
                                            'border-l-amber-500 bg-amber-100 text-amber-900'
                                          ];
                                          const colorClass = colors[index % colors.length];
                                          
                                          return (
                                            <div
                                              key={element.id}
                                              className={`flex items-center justify-between p-3 rounded-lg border-l-4 border-r border-t border-b cursor-pointer hover:bg-accent transition-colors ${
                                                isSelected ? 'bg-primary text-primary-foreground border-primary shadow-md' : colorClass
                                              }`}
                                              onClick={() => isSelected ? removeElement(element.id) : addElement(element, group.name, major.name)}
                                            >
                                              <div className="flex items-center gap-3">
                                                <div>
                                                  <p className="font-medium text-sm">{element.id}</p>
                                                  <p className="text-xs text-muted-foreground">{element.name}</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {isSelected && (
                                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
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
                    <div key={element.id} className="flex flex-col gap-3 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{element.id} - {element.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {element.majorGroup} • {element.group}
                          </p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`label-${element.id}`} className="text-sm">
                            Label:
                          </Label>
                          <Input
                            id={`label-${element.id}`}
                            type="text"
                            value={element.label || element.name}
                            onChange={(e) => updateElementLabel(element.id, e.target.value)}
                            className="flex-1"
                            placeholder="Enter custom label"
                          />
                        </div>
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
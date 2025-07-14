import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  ClipboardList, 
  Loader2, 
  Save,
  User
} from 'lucide-react';

import { useAssessments } from '@/hooks/use-assessments';
import { useBuildings } from '@/hooks/use-buildings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { toast } from 'sonner';

// Form validation schema
const editAssessmentSchema = z.object({
  type: z.string().min(1, 'Assessment type is required'),
  status: z.string().min(1, 'Status is required'),
  description: z.string().optional(),
  notes: z.string().optional(),
  scheduled_at: z.string().optional(),
  completed_at: z.string().optional(),
});

type EditAssessmentForm = z.infer<typeof editAssessmentSchema>;

export function EditAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAssessment, updateAssessment } = useAssessments();
  const { getBuilding } = useBuildings();

  const [assessment, setAssessment] = useState<any>(null);
  const [building, setBuilding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditAssessmentForm>({
    resolver: zodResolver(editAssessmentSchema),
    defaultValues: {
      type: '',
      status: '',
      description: '',
      notes: '',
      scheduled_at: '',
      completed_at: '',
    },
  });

  useEffect(() => {
    const fetchAssessmentData = async () => {
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

        // Format dates for input fields
        const formatDateForInput = (dateString: string | null) => {
          if (!dateString) return '';
          return new Date(dateString).toISOString().split('T')[0];
        };

        // Reset form with fetched data
        form.reset({
          type: assessmentData.type || '',
          status: assessmentData.status || '',
          description: assessmentData.description || '',
          notes: assessmentData.notes || '',
          scheduled_at: formatDateForInput(assessmentData.scheduled_at),
          completed_at: formatDateForInput(assessmentData.completed_at),
        });

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

    fetchAssessmentData();
  }, [id]);

  const onSubmit = async (data: EditAssessmentForm) => {
    if (!id) {
      toast.error('Assessment ID is required');
      return;
    }

    try {
      setSaving(true);
      
      // Transform form data to match API schema
      const updateData = {
        type: data.type,
        status: data.status,
        description: data.description,
        notes: data.notes,
        ...(data.scheduled_at && { scheduled_at: new Date(data.scheduled_at).toISOString() }),
        ...(data.completed_at && { completed_at: new Date(data.completed_at).toISOString() }),
      };
      
      console.log('Updating assessment with data:', updateData);
      
      // Call API to update assessment
      await updateAssessment(id, updateData);
      
      toast.success('Assessment updated successfully');
      
      // Navigate back to assessment details after a short delay
      setTimeout(() => {
        navigate(`/assessments/${id}`);
      }, 1000);
    } catch (err) {
      console.error('Failed to update assessment:', err);
      toast.error('Failed to update assessment');
    } finally {
      setSaving(false);
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
            <BreadcrumbLink asChild><Link to={`/assessments/${id}`}>Assessment Details</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Edit Assessment</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Assessment</h2>
          <p className="text-muted-foreground">
            Update assessment information and details for {building?.name || 'Unknown Building'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/assessments/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Details
            </Link>
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Information</CardTitle>
              <CardDescription>
                Basic assessment details and metadata.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
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
                          <SelectItem value="pre_assessment">Pre-Assessment</SelectItem>
                          <SelectItem value="field_assessment">Field Assessment</SelectItem>
                          <SelectItem value="full_assessment">Full Assessment</SelectItem>
                          <SelectItem value="condition_assessment">Condition Assessment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Assessment description..."
                        className="resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Schedule & Timeline</CardTitle>
              <CardDescription>
                Assessment scheduling and completion dates.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="scheduled_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="completed_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completed Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assessment Notes</CardTitle>
              <CardDescription>
                Detailed notes, findings, and FCI calculations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Assessment notes, findings, FCI calculations..."
                        className="resize-none"
                        rows={8}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {building && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Building Information
                </CardTitle>
                <CardDescription>
                  Associated building details (read-only).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="font-medium">Building Name</h4>
                  <p className="text-muted-foreground">{building.name}</p>
                </div>
                <div>
                  <h4 className="font-medium">Type</h4>
                  <p className="text-muted-foreground">{building.type}</p>
                </div>
                <div>
                  <h4 className="font-medium">Square Footage</h4>
                  <p className="text-muted-foreground">{building.square_footage?.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-medium">Year Built</h4>
                  <p className="text-muted-foreground">{building.year_built}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link to={`/assessments/${id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Assessment
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
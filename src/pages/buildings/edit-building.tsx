import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, X, Building2, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { useBuildings } from '@/hooks/use-buildings';
import { buildingsAPI } from '@/services/api';

// Form validation schema
const buildingSchema = z.object({
  name: z.string().min(1, 'Building name is required'),
  type: z.string().min(1, 'Building type is required'),
  constructionType: z.string().min(1, 'Construction type is required'),
  yearBuilt: z.number().min(1800, 'Year built must be valid').max(new Date().getFullYear(), 'Year built cannot be in the future'),
  squareFootage: z.number().min(1, 'Square footage must be greater than 0'),
  costPerSqft: z.number().min(0, 'Cost per sq ft must be positive'),
  streetAddress: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code must be at least 5 characters'),
  description: z.string().optional(),
});

type BuildingForm = z.infer<typeof buildingSchema>;

// Building types with associated costs
const buildingTypes = [
  { value: 'office-single', label: 'Single-story Office', cost: 297.50 },
  { value: 'office-midrise', label: 'Mid-rise Office', cost: 605.00 },
  { value: 'office-highrise', label: 'High-rise Office', cost: 737.50 },
  { value: 'warehouse-basic', label: 'Basic Warehouse', cost: 140.00 },
  { value: 'warehouse-industrial', label: 'Light Industrial Warehouse', cost: 280.00 },
  { value: 'manufacturing', label: 'Manufacturing Facility', cost: 545.00 },
  { value: 'medical-office', label: 'Medical Office Building', cost: 750.50 },
  { value: 'hospital', label: 'Acute Care Hospital', cost: 1086.50 },
  { value: 'school-primary', label: 'Primary/Secondary School', cost: 362.50 },
  { value: 'university', label: 'University Classroom/Lab', cost: 675.00 },
  { value: 'retail-strip', label: 'Neighborhood Strip Center', cost: 409.50 },
  { value: 'retail-mall', label: 'Shopping Mall', cost: 526.00 },
  { value: 'apartments', label: 'Standard Apartments', cost: 295.00 },
];

const constructionTypes = [
  'Steel Frame',
  'Concrete Block',
  'Wood Frame',
  'Reinforced Concrete',
  'Masonry',
  'Pre-engineered Metal',
  'Mixed Construction'
];

export function EditBuildingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBuilding, updateBuilding } = useBuildings();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buildingData, setBuildingData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [buildingPhotos, setBuildingPhotos] = useState<{ id: string; name: string; url: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BuildingForm>({
    resolver: zodResolver(buildingSchema),
    mode: "onSubmit",
    defaultValues: {
      name: '',
      type: '',
      constructionType: '',
      yearBuilt: new Date().getFullYear(),
      squareFootage: 0,
      costPerSqft: 0,
      streetAddress: '',
      city: '',
      state: '',
      zipCode: '',
      description: '',
    },
  });

  // Load existing building data from API
  useEffect(() => {
    const fetchBuilding = async () => {
      if (!id) {
        setError('Building ID is required');
        setLoading(false);
        return;
      }


      try {
        setLoading(true);
        const building = await getBuilding(id);
        setBuildingData(building);
        
        // Reset form with fetched data only once
        form.reset({
          name: building.name || '',
          type: building.type || '',
          constructionType: building.construction_type || '',
          yearBuilt: building.year_built || new Date().getFullYear(),
          squareFootage: building.square_footage || 0,
          costPerSqft: building.cost_per_sqft || 0,
          streetAddress: building.street_address || '',
          city: building.city || '',
          state: building.state || '',
          zipCode: building.zip_code || '',
          description: building.description || '',
        });
        
      } catch (err) {
        console.error('Failed to fetch building:', err);
        setError('Failed to load building data');
        toast.error('Failed to load building data');
      } finally {
        setLoading(false);
      }
    };

    fetchBuilding();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data: BuildingForm) => {
    if (!id) {
      toast.error('Building ID is required');
      return;
    }

    try {
      setSaving(true);
      
      // Transform form data to match API schema
      const updateData = {
        name: data.name,
        type: data.type,
        construction_type: data.constructionType,
        year_built: data.yearBuilt,
        square_footage: data.squareFootage,
        cost_per_sqft: data.costPerSqft,
        street_address: data.streetAddress,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        description: data.description,
        // Include image_url if we have valid photos (Cloudinary URLs)
        ...(buildingPhotos.length > 0 
          ? { image_url: buildingPhotos[0].url } 
          : {}),
      };
      
      console.log('Updating building with data:', updateData);
      
      // Call API to update building
      await updateBuilding(id, updateData);
      
      // Navigate back to building details after a short delay
      setTimeout(() => {
        navigate(`/buildings/${id}`);
      }, 1000);
    } catch (err) {
      console.error('Failed to update building:', err);
      // Error toast is already shown by the hook
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files) return;

    const maxFileSize = 10 * 1024 * 1024; // 10MB (same as backend)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    for (const file of Array.from(files)) {
      if (file.size > maxFileSize) {
        toast.error(`File ${file.name} is too large. Max size is 10MB.`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not a supported image format.`);
        continue;
      }

      try {
        toast.loading(`Uploading ${file.name}...`);

        // Upload to Cloudinary via API
        const response = await buildingsAPI.uploadImage(file);
        
        if (response.data.success) {
          const newPhoto = {
            id: crypto.randomUUID(),
            name: file.name,
            url: response.data.data.url, // Cloudinary URL
            size: file.size,
            public_id: response.data.data.public_id
          };

          setBuildingPhotos(prev => [...prev, newPhoto]);
          toast.success(`Photo ${file.name} uploaded successfully`);
        } else {
          toast.error(`Failed to upload ${file.name}`);
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const removePhoto = (photoId: string) => {
    const photoToRemove = buildingPhotos.find(photo => photo.id === photoId);
    if (photoToRemove?.url.startsWith('blob:')) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    
    setBuildingPhotos(prev => prev.filter(photo => photo.id !== photoId));
    toast.success('Photo removed');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    handlePhotoUpload(files);
  };

  const handleBuildingTypeChange = (value: string) => {
    const selectedType = buildingTypes.find(type => type.value === value);
    if (selectedType) {
      form.setValue('costPerSqft', selectedType.cost);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Loading building data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <Building2 className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-sm text-red-600">Error: {error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/buildings')}
          >
            Back to Buildings
          </Button>
        </div>
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
            <BreadcrumbLink asChild><Link to="/buildings">Buildings</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to={`/buildings/${id}`}>Building Details</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Edit Building</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Building</h2>
          <p className="text-muted-foreground">
            Update building information and specifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/buildings/${id}`}>
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
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Core building details and identification.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter building name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Type</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleBuildingTypeChange(value);
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select building type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {buildingTypes.map((type) => (
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

                <FormField
                  control={form.control}
                  name="constructionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Construction Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select construction type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {constructionTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="yearBuilt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Built</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="squareFootage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Square Footage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="costPerSqft"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost per Sq Ft</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Auto-populated based on building type
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                Building address and location details.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Main Street" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="State" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="12345" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Optional building description and notes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter building description, notable features, or additional information..."
                        className="resize-none"
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide any additional details about the building that might be relevant for assessments.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Building Photos</CardTitle>
              <CardDescription>
                Upload photos of the building for documentation and reference.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                  className="hidden"
                />
                
                {/* Upload area */}
                <div 
                  className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 hover:border-muted-foreground/50 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                >
                  <div className="text-center">
                    <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                    <div className="mt-4">
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerFileInput();
                        }}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Photos
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Click to upload or drag and drop<br />
                      PNG, JPG or WEBP (max. 5MB each)
                    </p>
                  </div>
                </div>

                {/* Photo previews */}
                {buildingPhotos.length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {buildingPhotos.map((photo) => (
                        <div key={photo.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={photo.url}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removePhoto(photo.id)}
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground truncate">
                              {photo.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(photo.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {buildingPhotos.length} photo{buildingPhotos.length !== 1 ? 's' : ''} uploaded
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link to={`/buildings/${id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Building'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
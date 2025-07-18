import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Loader2, MapPin, Upload, X, Camera } from 'lucide-react';
import { useBuildings } from '@/hooks/use-buildings';
import { buildingsAPI } from '@/services/api';

import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const buildingSchema = z.object({
  name: z.string().min(2, { message: 'Building name must be at least 2 characters' }),
  type: z.string().min(1, { message: 'Please select a building type' }),
  address: z.string().min(5, { message: 'Please enter a valid address' }),
  city: z.string().min(2, { message: 'City is required' }),
  state: z.string().length(2, { message: 'Please enter a valid state code' }),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, { message: 'Please enter a valid ZIP code' }),
  yearBuilt: z.string().regex(/^\d{4}$/, { message: 'Please enter a valid year' })
    .refine((year) => {
      const numYear = parseInt(year);
      const currentYear = new Date().getFullYear();
      return numYear >= 1800 && numYear <= currentYear;
    }, { message: 'Year must be between 1800 and current year' }),
  squareFootage: z.string()
    .regex(/^\d+$/, { message: 'Please enter a valid number' })
    .transform(Number)
    .refine((n) => n > 0, { message: 'Square footage must be greater than 0' }),
  description: z.string().optional(),
});

type BuildingFormValues = z.infer<typeof buildingSchema>;

// Building types from buildingtype.md with their costs per sq ft
const buildingTypes = [
  { value: 'Single-story Office', label: 'Single-story Office ($297.50/sq ft)', cost: 297.5 },
  { value: 'Mid-rise Office', label: 'Mid-rise Office ($605.00/sq ft)', cost: 605 },
  { value: 'High-rise Office', label: 'High-rise Office ($737.50/sq ft)', cost: 737.5 },
  { value: 'High-end Executive Office', label: 'High-end Executive Office ($300.00/sq ft)', cost: 300 },
  { value: 'Basic Warehouse', label: 'Basic Warehouse ($140.00/sq ft)', cost: 140 },
  { value: 'Light Industrial Warehouse', label: 'Light Industrial Warehouse ($280.00/sq ft)', cost: 280 },
  { value: 'Manufacturing Facility', label: 'Manufacturing Facility ($545.00/sq ft)', cost: 545 },
  { value: 'Laboratory Facility', label: 'Laboratory Facility ($800.00/sq ft)', cost: 800 },
  { value: 'Medical Office Building', label: 'Medical Office Building ($750.50/sq ft)', cost: 750.5 },
  { value: 'Specialty Clinic', label: 'Specialty Clinic ($704.50/sq ft)', cost: 704.5 },
  { value: 'Acute Care Hospital', label: 'Acute Care Hospital ($1,086.50/sq ft)', cost: 1086.5 },
  { value: 'Motel (2–3 stories)', label: 'Motel (2–3 stories) ($160.00/sq ft)', cost: 160 },
  { value: '3-star Hotel', label: '3-star Hotel ($559.00/sq ft)', cost: 559 },
  { value: '5-star Hotel', label: '5-star Hotel ($802.50/sq ft)', cost: 802.5 },
  { value: 'Primary/Secondary School', label: 'Primary/Secondary School ($362.50/sq ft)', cost: 362.5 },
  { value: 'University Classroom/Lab', label: 'University Classroom/Lab ($675.00/sq ft)', cost: 675 },
  { value: 'Dormitories', label: 'Dormitories ($353.50/sq ft)', cost: 353.5 },
  { value: 'Neighborhood Strip Center', label: 'Neighborhood Strip Center ($409.50/sq ft)', cost: 409.5 },
  { value: 'Shopping Mall', label: 'Shopping Mall ($526.00/sq ft)', cost: 526 },
  { value: 'Standalone Retail Store', label: 'Standalone Retail Store ($331.50/sq ft)', cost: 331.5 },
  { value: 'Standard Apartments', label: 'Standard Apartments ($295.00/sq ft)', cost: 295 },
  { value: 'Community Centers', label: 'Community Centers ($913.50/sq ft)', cost: 913.5 },
  { value: 'Museums/Performing Arts Centers', label: 'Museums/Performing Arts Centers ($1,010.00/sq ft)', cost: 1010 },
  { value: 'Police Stations', label: 'Police Stations ($580.00/sq ft)', cost: 580 },
  { value: 'Multi-level Garage (Basic)', label: 'Multi-level Garage (Basic) ($150.50/sq ft)', cost: 150.5 },
  { value: 'Low-grade Parking Garage', label: 'Low-grade Parking Garage ($143.00/sq ft)', cost: 143 },
];

export function NewBuildingPage() {
  const navigate = useNavigate();
  const { createBuilding } = useBuildings();
  const [isLoading, setIsLoading] = useState(false);
  const [buildingPhotos, setBuildingPhotos] = useState<{ id: string; name: string; url: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: '',
      type: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      yearBuilt: '',
      squareFootage: '',
      description: '',
    },
  });

  async function onSubmit(values: BuildingFormValues) {
    setIsLoading(true);
    try {
      // Find the cost per sqft for the selected building type
      const selectedBuildingType = buildingTypes.find(type => type.value === values.type);
      const costPerSqft = selectedBuildingType ? selectedBuildingType.cost : 300; // Default fallback
      
      // Transform data to match API expectations
      const buildingData = {
        name: values.name,
        type: values.type,
        street_address: values.address,
        city: values.city,
        state: values.state,
        zip_code: values.zipCode,
        year_built: parseInt(values.yearBuilt),
        square_footage: values.squareFootage,
        description: values.description,
        // Use first photo as main image or default
        image_url: buildingPhotos.length > 0 ? buildingPhotos[0].url : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
        // Cost per sqft based on selected building type
        cost_per_sqft: costPerSqft,
      };
      
      await createBuilding(buildingData);
      toast.success('Building added successfully');
      navigate('/buildings');
    } catch (error) {
      toast.error('Failed to add building');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

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
        const loadingToast = toast.loading(`Uploading ${file.name}...`);

        // Upload to Cloudinary via API
        const response = await buildingsAPI.uploadImage(file);
        
        // Dismiss the loading toast
        toast.dismiss(loadingToast);
        
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

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Add New Building</h2>
          <p className="text-muted-foreground">
            Enter the details of the building you want to assess.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Building Photos</h3>
            
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
                <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                <div className="mt-4">
                  <Button variant="secondary" onClick={(e) => e.stopPropagation()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Building Photos
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
                <div className="grid grid-cols-2 gap-4">
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
                  {buildingPhotos.length} photo{buildingPhotos.length !== 1 ? 's' : ''} added
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-2 font-medium">Location Preview</h3>
            <div className="flex items-center justify-center rounded-lg bg-muted/50 p-8">
              <div className="text-center">
                <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Map preview will appear here
                </p>
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter building name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter street address" {...field} />
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
                      <Input placeholder="City" {...field} />
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
                      <Input
                        placeholder="ST"
                        maxLength={2}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
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
                      <Input placeholder="12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="yearBuilt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Built</FormLabel>
                    <FormControl>
                      <Input placeholder="YYYY" maxLength={4} {...field} />
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
                        placeholder="Enter square footage"
                        {...field}
                      />
                    </FormControl>
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
                      placeholder="Enter building description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any additional details about the building.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/buildings')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Building
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
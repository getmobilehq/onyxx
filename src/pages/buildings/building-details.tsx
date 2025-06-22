import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  Info,
  MapPin,
  Pencil,
  Share2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBuildings } from '@/hooks/use-buildings';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Mock data for a specific building
const buildingsData = [
  { 
    id: '1', 
    name: 'Oak Tower Office Complex', 
    location: 'New York, NY', 
    address: '123 Broadway, New York, NY 10001',
    type: 'Commercial', 
    size: 450000, 
    yearBuilt: 1998, 
    fci: 0.12, 
    lastAssessment: '2024-04-10',
    constructionType: 'Steel frame',
    floors: 32,
    occupancy: 'Multi-tenant',
    ownershipType: 'Corporate',
    image: 'https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    images: [
      'https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    ],
    systems: [
      { name: 'Structural', condition: 'Good', fci: 0.15 },
      { name: 'HVAC', condition: 'Fair', fci: 0.28 },
      { name: 'Electrical', condition: 'Good', fci: 0.18 },
      { name: 'Plumbing', condition: 'Good', fci: 0.12 },
      { name: 'Exterior', condition: 'Excellent', fci: 0.06 },
      { name: 'Interior', condition: 'Good', fci: 0.14 },
      { name: 'Elevators', condition: 'Fair', fci: 0.25 },
      { name: 'Fire Protection', condition: 'Excellent', fci: 0.05 },
    ],
    assessmentHistory: [
      { date: '2024-04-10', fci: 0.12, assessor: 'Alex Johnson', notes: 'Regular annual assessment' },
      { date: '2023-04-15', fci: 0.15, assessor: 'Maria Garcia', notes: 'Post-renovation assessment' },
      { date: '2022-03-22', fci: 0.22, assessor: 'David Chen', notes: 'Comprehensive assessment' },
      { date: '2021-05-01', fci: 0.27, assessor: 'Sarah Williams', notes: 'Initial baseline assessment' },
    ],
    repairCosts: {
      immediate: 1250000,
      shortTerm: 3450000,
      longTerm: 4800000,
      total: 9500000,
      replacementValue: 79000000,
    }
  },
  { 
    id: '2', 
    name: 'Riverside Apartments', 
    location: 'Chicago, IL', 
    address: '456 Lake Shore Drive, Chicago, IL 60611',
    type: 'Residential', 
    size: 325000, 
    yearBuilt: 2005, 
    fci: 0.34, 
    lastAssessment: '2024-03-22',
    constructionType: 'Concrete',
    floors: 18,
    occupancy: 'Multi-family',
    ownershipType: 'Investment',
    image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    images: [
      'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    systems: [
      { name: 'Structural', condition: 'Fair', fci: 0.35 },
      { name: 'HVAC', condition: 'Poor', fci: 0.45 },
      { name: 'Electrical', condition: 'Fair', fci: 0.30 },
      { name: 'Plumbing', condition: 'Fair', fci: 0.32 },
      { name: 'Exterior', condition: 'Good', fci: 0.20 },
      { name: 'Interior', condition: 'Good', fci: 0.25 }
    ],
    assessmentHistory: [
      { date: '2024-03-22', fci: 0.34, assessor: 'Emily Rodriguez', notes: 'Quarterly assessment' }
    ],
    repairCosts: {
      immediate: 2100000,
      total: 3800000,
      replacementValue: 48000000,
    }
  },
  { 
    id: '3', 
    name: 'Sunset Mall', 
    location: 'Miami, FL', 
    address: '789 Ocean Drive, Miami, FL 33139',
    type: 'Retail', 
    size: 580000, 
    yearBuilt: 1992, 
    fci: 0.08, 
    lastAssessment: '2024-05-01',
    constructionType: 'Steel frame',
    floors: 2,
    occupancy: 'Retail',
    ownershipType: 'REIT',
    image: 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    images: [
      'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/236705/pexels-photo-236705.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    systems: [
      { name: 'Structural', condition: 'Excellent', fci: 0.05 },
      { name: 'HVAC', condition: 'Good', fci: 0.12 },
      { name: 'Electrical', condition: 'Good', fci: 0.10 },
      { name: 'Plumbing', condition: 'Good', fci: 0.08 },
      { name: 'Exterior', condition: 'Excellent', fci: 0.04 },
      { name: 'Interior', condition: 'Good', fci: 0.11 }
    ],
    assessmentHistory: [
      { date: '2024-05-01', fci: 0.08, assessor: 'Michael Chen', notes: 'Annual assessment' }
    ],
    repairCosts: {
      immediate: 800000,
      total: 4600000,
      replacementValue: 58000000,
    }
  },
  { 
    id: '4', 
    name: 'Central Hospital', 
    location: 'Boston, MA', 
    address: '1000 Medical Center Drive, Boston, MA 02114',
    type: 'Healthcare', 
    size: 720000, 
    yearBuilt: 1984, 
    fci: 0.22, 
    lastAssessment: '2024-02-15',
    constructionType: 'Concrete',
    floors: 8,
    occupancy: 'Hospital',
    ownershipType: 'Non-profit',
    image: 'https://images.pexels.com/photos/668298/pexels-photo-668298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    images: [
      'https://images.pexels.com/photos/668298/pexels-photo-668298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/3259629/pexels-photo-3259629.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    systems: [
      { name: 'Structural', condition: 'Good', fci: 0.18 },
      { name: 'HVAC', condition: 'Fair', fci: 0.35 },
      { name: 'Electrical', condition: 'Fair', fci: 0.28 },
      { name: 'Plumbing', condition: 'Good', fci: 0.15 },
      { name: 'Exterior', condition: 'Fair', fci: 0.25 },
      { name: 'Interior', condition: 'Good', fci: 0.20 },
      { name: 'Medical Gas', condition: 'Good', fci: 0.16 },
      { name: 'Fire Protection', condition: 'Good', fci: 0.12 }
    ],
    assessmentHistory: [
      { date: '2024-02-15', fci: 0.22, assessor: 'Dr. Sarah Williams', notes: 'Healthcare facility assessment' },
      { date: '2023-02-20', fci: 0.26, assessor: 'Robert Johnson', notes: 'Annual medical facility review' }
    ],
    repairCosts: {
      immediate: 3200000,
      shortTerm: 5800000,
      longTerm: 6400000,
      total: 15400000,
      replacementValue: 98000000,
    }
  },
  { 
    id: '5', 
    name: 'Green Hills School', 
    location: 'Seattle, WA', 
    address: '500 Education Way, Seattle, WA 98101',
    type: 'Education', 
    size: 275000, 
    yearBuilt: 2010, 
    fci: 0.05, 
    lastAssessment: '2024-04-28',
    constructionType: 'Steel frame',
    floors: 3,
    occupancy: 'K-12 School',
    ownershipType: 'Public',
    image: 'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    images: [
      'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    systems: [
      { name: 'Structural', condition: 'Excellent', fci: 0.03 },
      { name: 'HVAC', condition: 'Excellent', fci: 0.06 },
      { name: 'Electrical', condition: 'Excellent', fci: 0.04 },
      { name: 'Plumbing', condition: 'Excellent', fci: 0.05 },
      { name: 'Exterior', condition: 'Excellent', fci: 0.02 },
      { name: 'Interior', condition: 'Good', fci: 0.08 },
      { name: 'Technology', condition: 'Excellent', fci: 0.04 }
    ],
    assessmentHistory: [
      { date: '2024-04-28', fci: 0.05, assessor: 'Lisa Anderson', notes: 'School district annual assessment' }
    ],
    repairCosts: {
      immediate: 400000,
      shortTerm: 800000,
      longTerm: 1200000,
      total: 2400000,
      replacementValue: 42000000,
    }
  },
  { 
    id: '6', 
    name: 'Waterfront Hotel', 
    location: 'San Francisco, CA', 
    address: '2000 Bay Street, San Francisco, CA 94133',
    type: 'Hospitality', 
    size: 390000, 
    yearBuilt: 2002, 
    fci: 0.19, 
    lastAssessment: '2024-03-05',
    constructionType: 'Steel frame',
    floors: 15,
    occupancy: 'Hotel',
    ownershipType: 'Corporate',
    image: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    images: [
      'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    systems: [
      { name: 'Structural', condition: 'Good', fci: 0.16 },
      { name: 'HVAC', condition: 'Good', fci: 0.22 },
      { name: 'Electrical', condition: 'Good', fci: 0.18 },
      { name: 'Plumbing', condition: 'Fair', fci: 0.25 },
      { name: 'Exterior', condition: 'Good', fci: 0.14 },
      { name: 'Interior', condition: 'Fair', fci: 0.28 },
      { name: 'Elevators', condition: 'Good', fci: 0.20 }
    ],
    assessmentHistory: [
      { date: '2024-03-05', fci: 0.19, assessor: 'Mark Thompson', notes: 'Hospitality facility assessment' },
      { date: '2023-03-10', fci: 0.21, assessor: 'Jennifer Lee', notes: 'Annual hotel inspection' }
    ],
    repairCosts: {
      immediate: 2800000,
      shortTerm: 4200000,
      longTerm: 5100000,
      total: 12100000,
      replacementValue: 65000000,
    }
  },
  { 
    id: '7', 
    name: 'Metro Logistics Center', 
    location: 'Dallas, TX', 
    address: '3500 Industrial Blvd, Dallas, TX 75247',
    type: 'Industrial', 
    size: 850000, 
    yearBuilt: 2015, 
    fci: 0.03, 
    lastAssessment: '2024-05-10',
    constructionType: 'Steel frame',
    floors: 1,
    occupancy: 'Warehouse/Distribution',
    ownershipType: 'Corporate',
    image: 'https://images.pexels.com/photos/236705/pexels-photo-236705.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    images: [
      'https://images.pexels.com/photos/236705/pexels-photo-236705.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/586688/pexels-photo-586688.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    systems: [
      { name: 'Structural', condition: 'Excellent', fci: 0.02 },
      { name: 'HVAC', condition: 'Excellent', fci: 0.03 },
      { name: 'Electrical', condition: 'Excellent', fci: 0.04 },
      { name: 'Plumbing', condition: 'Excellent', fci: 0.02 },
      { name: 'Exterior', condition: 'Excellent', fci: 0.01 },
      { name: 'Interior', condition: 'Excellent', fci: 0.05 },
      { name: 'Loading Systems', condition: 'Excellent', fci: 0.02 }
    ],
    assessmentHistory: [
      { date: '2024-05-10', fci: 0.03, assessor: 'Carlos Rodriguez', notes: 'Industrial facility assessment' }
    ],
    repairCosts: {
      immediate: 200000,
      shortTerm: 400000,
      longTerm: 600000,
      total: 1200000,
      replacementValue: 52000000,
    }
  },
  { 
    id: '8', 
    name: 'Highland Park Condos', 
    location: 'Denver, CO', 
    address: '800 Highland Avenue, Denver, CO 80218',
    type: 'Residential', 
    size: 210000, 
    yearBuilt: 2008, 
    fci: 0.16, 
    lastAssessment: '2024-04-15',
    constructionType: 'Concrete',
    floors: 12,
    occupancy: 'Condominium',
    ownershipType: 'HOA',
    image: 'https://images.pexels.com/photos/1838640/pexels-photo-1838640.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    images: [
      'https://images.pexels.com/photos/1838640/pexels-photo-1838640.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
    ],
    systems: [
      { name: 'Structural', condition: 'Good', fci: 0.14 },
      { name: 'HVAC', condition: 'Good', fci: 0.19 },
      { name: 'Electrical', condition: 'Good', fci: 0.16 },
      { name: 'Plumbing', condition: 'Fair', fci: 0.22 },
      { name: 'Exterior', condition: 'Good', fci: 0.12 },
      { name: 'Interior', condition: 'Good', fci: 0.15 },
      { name: 'Elevators', condition: 'Good', fci: 0.18 }
    ],
    assessmentHistory: [
      { date: '2024-04-15', fci: 0.16, assessor: 'Nancy Davis', notes: 'HOA annual assessment' },
      { date: '2023-04-20', fci: 0.18, assessor: 'Tom Wilson', notes: 'Residential complex review' }
    ],
    repairCosts: {
      immediate: 1600000,
      shortTerm: 2400000,
      longTerm: 3200000,
      total: 7200000,
      replacementValue: 38000000,
    }
  }
];

// Helper function to determine FCI status color
const getFciStatusColor = (fci: number) => {
  if (fci <= 0.1) return 'text-green-500';
  if (fci <= 0.2) return 'text-blue-500';
  if (fci <= 0.3) return 'text-yellow-500';
  return 'text-red-500';
};

// Helper function to determine FCI label
const getFciLabel = (fci: number) => {
  if (fci <= 0.1) return 'Excellent';
  if (fci <= 0.2) return 'Good';
  if (fci <= 0.3) return 'Fair';
  return 'Poor';
};

// Define colors for pie chart
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

// System condition distribution data
const conditionData = [
  { name: 'Excellent', value: 2 },
  { name: 'Good', value: 4 },
  { name: 'Fair', value: 2 },
  { name: 'Poor', value: 0 },
];

// FCI trend data
const fciTrendData = [
  { year: '2021', fci: 0.27 },
  { year: '2022', fci: 0.22 },
  { year: '2023', fci: 0.15 },
  { year: '2024', fci: 0.12 },
];

export function BuildingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBuilding } = useBuildings();
  const [building, setBuilding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchBuilding = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getBuilding(id);
        
        // Transform API data to match expected format
        const transformedBuilding = {
          ...data,
          location: `${data.city || 'Unknown'}, ${data.state || ''}`,
          address: `${data.street_address || ''}, ${data.city || ''}, ${data.state || ''} ${data.zip_code || ''}`,
          size: data.square_footage || 0,
          yearBuilt: data.year_built || new Date().getFullYear(),
          fci: calculateFCI(data),
          lastAssessment: data.updated_at ? new Date(data.updated_at).toLocaleDateString() : 'Not assessed',
          image: data.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
          images: [data.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'],
          // Mock data for now - will be replaced when we implement these features
          systems: [
            { name: 'Structural', condition: 'Good', fci: 0.05 },
            { name: 'HVAC', condition: 'Fair', fci: 0.15 },
            { name: 'Electrical', condition: 'Good', fci: 0.08 },
            { name: 'Plumbing', condition: 'Good', fci: 0.06 },
          ],
          assessmentHistory: [],
          repairCosts: {
            immediate: 100000,
            shortTerm: 200000,
            longTerm: 300000,
            total: 600000,
            replacementValue: (data.square_footage || 0) * (data.cost_per_sqft || 200),
          }
        };
        
        setBuilding(transformedBuilding);
      } catch (err) {
        setError('Failed to load building details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuilding();
  }, [id]);

  // Simple FCI calculation based on age
  function calculateFCI(building: any) {
    const age = new Date().getFullYear() - (building.year_built || 2020);
    const baseFCI = age * 0.01;
    return Math.min(baseFCI, 0.9);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !building) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Building Not Found</CardTitle>
            <CardDescription>
              {error || "The building you're looking for doesn't exist or has been removed."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/buildings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Buildings
              </Link>
            </Button>
          </CardContent>
        </Card>
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
            <BreadcrumbLink as={Link} to="/buildings">Buildings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>{building.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-4 md:flex-row md:items-start md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{building.name}</h2>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-1 h-4 w-4" />
            {building.address}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to={`/buildings/${id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Building
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/assessments/new?buildingId=${id}`}>
              <ClipboardList className="mr-2 h-4 w-4" />
              Start Assessment
            </Link>
          </Button>
        </div>
      </div>

      {/* Building Overview Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={building.images[currentImageIndex]}
              alt={building.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {building.images.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    index === currentImageIndex ? "bg-primary" : "bg-white/50 hover:bg-white/75"
                  )}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </div>
          <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold">Building Type</h3>
              <p>{building.type}</p>
            </div>
            <div>
              <h3 className="font-semibold">Year Built</h3>
              <p>{building.yearBuilt}</p>
            </div>
            <div>
              <h3 className="font-semibold">Size</h3>
              <p>{building.size.toLocaleString()} sq ft</p>
            </div>
            <div>
              <h3 className="font-semibold">Construction Type</h3>
              <p>{building.constructionType}</p>
            </div>
            <div>
              <h3 className="font-semibold">Number of Floors</h3>
              <p>{building.floors}</p>
            </div>
            <div>
              <h3 className="font-semibold">Occupancy</h3>
              <p>{building.occupancy}</p>
            </div>
            <div>
              <h3 className="font-semibold">Ownership Type</h3>
              <p>{building.ownershipType}</p>
            </div>
            <div>
              <h3 className="font-semibold">Last Assessment</h3>
              <p>{new Date(building.lastAssessment).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facility Condition Index</CardTitle>
            <CardDescription>
              Current FCI score and status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-6 p-6">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-8 border-muted">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold">{building.fci.toFixed(2)}</span>
                <span
                  className={cn(
                    "text-lg font-medium",
                    getFciStatusColor(building.fci)
                  )}
                >
                  {getFciLabel(building.fci)}
                </span>
              </div>
              <svg
                className="absolute -rotate-90"
                width="160"
                height="160"
                viewBox="0 0 160 160"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray="439.6"
                  strokeDashoffset={439.6 - (439.6 * building.fci)}
                  className={cn(
                    building.fci <= 0.1 ? "text-green-500" :
                    building.fci <= 0.2 ? "text-blue-500" :
                    building.fci <= 0.3 ? "text-yellow-500" :
                    "text-red-500"
                  )}
                />
              </svg>
            </div>
            <div className="w-full space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>Repair Cost</span>
                  <span className="font-medium">
                    ${building.repairCosts.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Replacement Value</span>
                  <span className="font-medium">
                    ${building.repairCosts.replacementValue.toLocaleString()}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/reports?buildingId=${id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Reports
                  </Link>
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for more detailed information */}
      <Tabs defaultValue="systems" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="systems">Building Systems</TabsTrigger>
          <TabsTrigger value="history">Assessment History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        {/* Building Systems Tab */}
        <TabsContent value="systems">
          <Card>
            <CardHeader>
              <CardTitle>Building Systems Overview</CardTitle>
              <CardDescription>
                Condition assessment of major building systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="col-span-2 space-y-4">
                  {building.systems.map((system) => (
                    <div
                      key={system.name}
                      className="flex items-center justify-between space-x-4 rounded-lg border p-4"
                    >
                      <div>
                        <h3 className="font-medium">{system.name}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "mt-1",
                            system.condition === 'Excellent' ? "border-green-500 text-green-500" :
                            system.condition === 'Good' ? "border-blue-500 text-blue-500" :
                            system.condition === 'Fair' ? "border-yellow-500 text-yellow-500" :
                            "border-red-500 text-red-500"
                          )}
                        >
                          {system.condition}
                        </Badge>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn(
                          "text-sm font-medium",
                          getFciStatusColor(system.fci)
                        )}>
                          FCI: {system.fci.toFixed(2)}
                        </span>
                        <Progress
                          value={system.fci * 100}
                          className="h-2 w-24"
                          indicatorClassName={cn(
                            system.fci <= 0.1 ? "bg-green-500" :
                            system.fci <= 0.2 ? "bg-blue-500" :
                            system.fci <= 0.3 ? "bg-yellow-500" :
                            "bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center justify-center space-y-4">
                  <h3 className="text-center font-medium">System Condition Distribution</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={conditionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {conditionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} systems`, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {conditionData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center">
                        <div
                          className="mr-1 h-3 w-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-xs">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Assessment History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>
                Record of previous building assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {building.assessmentHistory.map((assessment, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col space-y-2 border-l-4 pl-4",
                      assessment.fci <= 0.1 ? "border-green-500" :
                      assessment.fci <= 0.2 ? "border-blue-500" :
                      assessment.fci <= 0.3 ? "border-yellow-500" :
                      "border-red-500"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(assessment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge className={cn(
                        assessment.fci <= 0.1 ? "bg-green-500" :
                        assessment.fci <= 0.2 ? "bg-blue-500" :
                        assessment.fci <= 0.3 ? "bg-yellow-500" :
                        "bg-red-500"
                      )}>
                        FCI: {assessment.fci.toFixed(2)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Assessor:</span> {assessment.assessor}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Notes:</span> {assessment.notes}
                    </p>
                    <div className="pt-1">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/reports/${index + 1}?buildingId=${id}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Report
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Building Analytics</CardTitle>
              <CardDescription>
                FCI trends and cost projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* FCI Trend */}
                <div className="space-y-2">
                  <h3 className="font-medium">FCI Trend Over Time</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fciTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" />
                        <YAxis domain={[0, 0.5]} tickFormatter={(value) => value.toFixed(1)} />
                        <Tooltip formatter={(value) => [value.toFixed(2), 'FCI Score']} />
                        <Bar 
                          dataKey="fci" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]}
                          name="FCI Score" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    FCI trend shows continuous improvement over the past 4 years
                  </p>
                </div>
                
                {/* Repair Cost Breakdown */}
                <div className="space-y-4">
                  <h3 className="font-medium">Repair Cost Breakdown</h3>
                  <div className="space-y-6 rounded-lg border p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Immediate Repairs</span>
                        <span className="text-sm font-medium">${building.repairCosts.immediate.toLocaleString()}</span>
                      </div>
                      <Progress value={(building.repairCosts.immediate / building.repairCosts.total) * 100} className="h-2" indicatorClassName="bg-red-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Short-Term (1-3 years)</span>
                        <span className="text-sm font-medium">${building.repairCosts.shortTerm.toLocaleString()}</span>
                      </div>
                      <Progress value={(building.repairCosts.shortTerm / building.repairCosts.total) * 100} className="h-2" indicatorClassName="bg-yellow-500" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Long-Term (3-5 years)</span>
                        <span className="text-sm font-medium">${building.repairCosts.longTerm.toLocaleString()}</span>
                      </div>
                      <Progress value={(building.repairCosts.longTerm / building.repairCosts.total) * 100} className="h-2" indicatorClassName="bg-blue-500" />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between font-medium">
                      <span>Total Repair Costs</span>
                      <span>${building.repairCosts.total.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Replacement Value</span>
                      <span>${building.repairCosts.replacementValue.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border border-dashed p-4">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="space-y-1">
                        <h4 className="font-medium">Investment Recommendation</h4>
                        <p className="text-sm text-muted-foreground">
                          Based on current FCI and repair costs, we recommend prioritizing HVAC and elevator systems for improvement in the next budget cycle.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
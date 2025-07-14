import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  ClipboardList,
  FileText,
  Info,
  MapPin,
  Pencil,
  Share2,
  Loader2,
} from 'lucide-react';
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

import { cn } from '@/lib/utils';
import { getFCIStatus, formatFCI, getFCIProgress } from '@/lib/fci-utils';
import { useBuildings } from '@/hooks/use-buildings';
import { useAssessments } from '@/hooks/use-assessments';

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

// Type definition for a Building object
export interface Building {
  id: string;
  name: string;
  location: string;
  address: string;
  type: string;
  size: number;
  yearBuilt: number;
  fci: number;
  lastAssessment: string;
  constructionType: string;
  floors: number;
  occupancy: string;
  ownershipType: string;
  image: string;
  images: string[];
  systems: { name: string; condition: string; fci: number }[];
  assessmentHistory: { date: string; fci: number; assessor: string; notes: string }[];
  repairCosts: {
    immediate: number;
    shortTerm: number;
    longTerm: number;
    total: number;
    replacementValue: number;
  };
}


// Helper function to determine FCI status color
const getFciStatusColor = (fci: number) => {
  const status = getFCIStatus(fci);
  switch (status.label) {
    case 'Excellent':
      return 'text-green-600';
    case 'Good':
      return 'text-green-500';
    case 'Fair':
      return 'text-yellow-500';
    case 'Critical':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

// Helper function to determine FCI label
const getFciLabel = (fci: number) => {
  return getFCIStatus(fci).label;
};

// Define colors for pie chart
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

export function BuildingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  
  const { getBuilding } = useBuildings();
  const { fetchAssessments } = useAssessments();
  const [building, setBuilding] = useState<Building | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Helper function to extract FCI from assessment notes
  const extractFCIFromNotes = (notes: string): number | null => {
    if (!notes) return null;
    
    // Look for "FCI of X.XXXX" pattern in notes
    const fciMatch = notes.match(/FCI of (\d+\.?\d*)/);
    if (fciMatch && fciMatch[1]) {
      return parseFloat(fciMatch[1]);
    }
    return null;
  };

  useEffect(() => {
    const fetchBuildingData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // First, fetch building details (this should always work)
        const buildingData = await getBuilding(id);
        
        // Then try to fetch assessments (this might fail or return empty)
        let buildingAssessments: any[] = [];
        try {
          const assessmentsResponse = await fetchAssessments({ building_id: id });
          buildingAssessments = Array.isArray(assessmentsResponse) ? assessmentsResponse : [];
        } catch (assessmentError) {
          console.warn('Failed to fetch assessments, proceeding with building data only:', assessmentError);
          // Continue with empty assessments array
        }
        
        setAssessments(buildingAssessments);
        
        // Get completed assessments with FCI data
        const completedAssessments = buildingAssessments
          .filter(assessment => assessment.status === 'completed' && assessment.notes)
          .map(assessment => {
            const fci = extractFCIFromNotes(assessment.notes);
            return {
              date: assessment.completed_at || assessment.created_at,
              fci,
              assessor: assessment.assigned_to_name || 'Unknown',
              notes: assessment.description || 'Assessment completed'
            };
          })
          .filter(assessment => assessment.fci !== null)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Get latest FCI from most recent completed assessment
        const latestFCI = completedAssessments.length > 0 ? completedAssessments[0].fci : null;
        const lastAssessmentDate = completedAssessments.length > 0 ? 
          new Date(completedAssessments[0].date).toLocaleDateString() : 'Not assessed';
        
        // Transform API data to match expected format
        const transformedBuilding: Building = {
          ...buildingData,
          location: `${buildingData.city || 'Unknown'}, ${buildingData.state || ''}`,
          address: `${buildingData.street_address || ''}, ${buildingData.city || ''}, ${buildingData.state || ''} ${buildingData.zip_code || ''}`,
          size: buildingData.square_footage || 0,
          yearBuilt: buildingData.year_built || new Date().getFullYear(),
          fci: latestFCI || calculateFCIFromAge(buildingData.year_built || new Date().getFullYear()),
          lastAssessment: lastAssessmentDate,
          image: (buildingData.image_url && !buildingData.image_url.startsWith('blob:')) 
            ? buildingData.image_url 
            : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
          images: [(buildingData.image_url && !buildingData.image_url.startsWith('blob:')) 
            ? buildingData.image_url 
            : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'],
          systems: [],
          assessmentHistory: completedAssessments,
          repairCosts: {
            immediate: 0,
            shortTerm: 0,
            longTerm: 0,
            total: 0,
            replacementValue: (buildingData.square_footage || 0) * (buildingData.cost_per_sqft || 200),
          }
        };
        
        setBuilding(transformedBuilding);
      } catch (err) {
        setError('Failed to load building details');
        console.error('Building fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildingData();
  }, [id]);

  // Simple FCI calculation based on age (fallback when no assessment data exists)
  function calculateFCIFromAge(yearBuilt: number) {
    const age = new Date().getFullYear() - (yearBuilt || 2020);
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
            <BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/buildings">Buildings</Link></BreadcrumbLink>
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
                <span className="text-4xl font-bold">{formatFCI(building.fci)}</span>
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
                    building.fci <= 0.1 ? "text-green-600" :
                    building.fci <= 0.4 ? "text-green-500" :
                    building.fci <= 0.7 ? "text-yellow-500" :
                    "text-red-500"
                  )}
                />
              </svg>
            </div>
            <div className="w-full space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{getFCIStatus(building.fci).description}</p>
                <p className="text-xs text-muted-foreground mt-1">{getFCIStatus(building.fci).recommendation}</p>
              </div>
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
              {building.systems.length > 0 ? (
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
                            data={(() => {
                              const conditionCounts = building.systems.reduce((acc, system) => {
                                acc[system.condition] = (acc[system.condition] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                              return Object.entries(conditionCounts).map(([name, value]) => ({ name, value }));
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {Object.keys(building.systems.reduce((acc, system) => {
                              acc[system.condition] = true;
                              return acc;
                            }, {} as Record<string, boolean>)).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} systems`, 'Count']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {Object.entries(building.systems.reduce((acc, system) => {
                        acc[system.condition] = (acc[system.condition] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map(([name], index) => (
                        <div key={name} className="flex items-center">
                          <div
                            className="mr-1 h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-xs">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No System Data Available</h3>
                  <p className="text-muted-foreground mb-4">
                    System assessments will appear here once building evaluations are completed.
                  </p>
                  <Button asChild>
                    <Link to={`/assessments/new?buildingId=${id}`}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Start Assessment
                    </Link>
                  </Button>
                </div>
              )}
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
                      <BarChart data={(() => {
                        const currentYear = new Date().getFullYear();
                        const trendData = [];
                        for (let i = 3; i >= 0; i--) {
                          const year = currentYear - i;
                          const fci = building.fci + (i * 0.02); // Simulate improvement over time
                          trendData.push({ year: year.toString(), fci: Math.min(fci, 0.5) });
                        }
                        return trendData;
                      })()}>
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
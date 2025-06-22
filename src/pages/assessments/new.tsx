import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { useBuildings } from '@/hooks/use-buildings';
import { useAssessments } from '@/hooks/use-assessments';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

// Mock data for buildings
const buildingsData = [
  { 
    id: '1', 
    name: 'Oak Tower Office Complex', 
    location: 'New York, NY', 
    type: 'Commercial', 
    size: 450000,
    lastAssessment: '2024-04-10',
    fci: 0.12,
  },
  { 
    id: '2', 
    name: 'Riverside Apartments', 
    location: 'Chicago, IL', 
    type: 'Residential', 
    size: 325000,
    lastAssessment: '2024-03-22',
    fci: 0.34,
  },
  { 
    id: '3', 
    name: 'Sunset Mall', 
    location: 'Miami, FL', 
    type: 'Retail', 
    size: 580000,
    lastAssessment: '2024-05-01',
    fci: 0.08,
  },
  { 
    id: '4', 
    name: 'Central Hospital', 
    location: 'Boston, MA', 
    type: 'Healthcare', 
    size: 720000,
    lastAssessment: '2024-02-15',
    fci: 0.22,
  },
  { 
    id: '5', 
    name: 'Green Hills School', 
    location: 'Seattle, WA', 
    type: 'Education', 
    size: 275000,
    lastAssessment: '2024-04-28',
    fci: 0.05,
  },
  { 
    id: '6', 
    name: 'Waterfront Hotel', 
    location: 'San Francisco, CA', 
    type: 'Hospitality', 
    size: 390000,
    lastAssessment: '2024-03-05',
    fci: 0.19,
  },
  { 
    id: '7', 
    name: 'Metro Logistics Center', 
    location: 'Dallas, TX', 
    type: 'Industrial', 
    size: 850000,
    lastAssessment: '2024-05-10',
    fci: 0.03,
  },
  { 
    id: '8', 
    name: 'Highland Park Condos', 
    location: 'Denver, CO', 
    type: 'Residential', 
    size: 210000,
    lastAssessment: '2024-04-15',
    fci: 0.16,
  },
];

export function NewAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBuildingId = searchParams.get('buildingId');
  
  const { buildings, loading: buildingsLoading } = useBuildings();
  const { createAssessment } = useAssessments();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuildingId, setSelectedBuildingId] = useState(preselectedBuildingId || '');
  const [creating, setCreating] = useState(false);

  // Transform buildings data to match expected format
  const buildingsData = buildings.map(building => ({
    id: building.id,
    name: building.name || 'Unknown Building',
    location: `${building.city || 'Unknown'}, ${building.state || ''}`,
    type: building.type || 'Unknown',
    size: building.square_footage || 0,
    lastAssessment: building.updated_at ? new Date(building.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    fci: calculateFCI(building),
  }));

  function calculateFCI(building: any) {
    const age = new Date().getFullYear() - (building.year_built || 2020);
    const baseFCI = age * 0.01;
    return Math.min(baseFCI, 0.9);
  }

  const filteredBuildings = buildingsData.filter((building) =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedBuilding = buildingsData.find(b => b.id === selectedBuildingId);

  const handleStartAssessment = async () => {
    if (!selectedBuildingId) {
      toast.error('Please select a building to assess');
      return;
    }

    console.log('🚀 Starting assessment creation...');
    setCreating(true);
    try {
      console.log('📋 Creating assessment with data:', {
        building_id: selectedBuildingId,
        type: 'pre_assessment',
        description: `Pre-assessment for ${selectedBuilding?.name}`,
        scheduled_date: new Date().toISOString(),
      });

      // Create a new pre-assessment
      const assessment = await createAssessment({
        building_id: selectedBuildingId,
        type: 'pre_assessment',
        description: `Pre-assessment for ${selectedBuilding?.name}`,
        scheduled_date: new Date().toISOString(),
      });

      console.log('✅ Assessment created:', assessment);

      // Store the assessment data in localStorage for continuity
      const assessmentData = {
        assessmentId: assessment.id,
        buildingId: selectedBuildingId,
        buildingName: selectedBuilding?.name,
        startDate: new Date().toISOString(),
        status: 'pre-assessment',
        currentStep: 1,
      };

      console.log('💾 Storing in localStorage:', assessmentData);
      localStorage.setItem('currentAssessment', JSON.stringify(assessmentData));
      
      console.log('📍 Navigating to pre-assessment...');
      // Navigate to pre-assessment
      const url = `/assessments/pre-assessment?assessmentId=${assessment.id}&buildingId=${selectedBuildingId}`;
      console.log('🔗 Navigation URL:', url);
      navigate(url);
    } catch (error) {
      console.error('❌ Failed to create assessment:', error);
      toast.error('Failed to create assessment');
    } finally {
      console.log('🏁 Finished assessment creation');
      setCreating(false);
    }
  };

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
            <BreadcrumbLink>New Assessment</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Start New Assessment</h2>
          <p className="text-muted-foreground">
            Select a building to begin the assessment process.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/assessments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assessments
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Building</CardTitle>
          <CardDescription>
            Choose the building you want to assess from the list below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search buildings..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Building Selection */}
          <RadioGroup value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
            <div className="grid gap-4">
              {filteredBuildings.map((building) => (
                <Label
                  key={building.id}
                  htmlFor={building.id}
                  className="flex cursor-pointer items-start space-x-3 rounded-lg border p-4 hover:bg-accent"
                >
                  <RadioGroupItem value={building.id} id={building.id} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium leading-none">{building.name}</p>
                        <p className="text-sm text-muted-foreground">{building.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">FCI: {building.fci.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          Last: {new Date(building.lastAssessment).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{building.type}</span>
                      <span>•</span>
                      <span>{building.size.toLocaleString()} sq ft</span>
                    </div>
                  </div>
                </Label>
              ))}
            </div>
          </RadioGroup>

          {filteredBuildings.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No buildings found matching your search criteria.
            </div>
          )}

          {/* Selected Building Summary */}
          {selectedBuilding && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">Selected Building</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedBuilding.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{selectedBuilding.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{selectedBuilding.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{selectedBuilding.size.toLocaleString()} sq ft</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" asChild>
              <Link to="/assessments">Cancel</Link>
            </Button>
            <Button 
              onClick={handleStartAssessment}
              disabled={!selectedBuildingId || creating || buildingsLoading}
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
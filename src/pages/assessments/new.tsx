import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle2, Loader2 } from 'lucide-react';
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


export function NewAssessmentPage() {
  // Add try-catch around the entire component logic
  try {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedBuildingId = searchParams.get('buildingId');
    
    const { buildings, loading: buildingsLoading, error: buildingsError } = useBuildings();
    const { createAssessment } = useAssessments();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBuildingId, setSelectedBuildingId] = useState(preselectedBuildingId || '');
    const [creating, setCreating] = useState(false);

  // Debug logging
  console.log('NewAssessmentPage render:', { 
    buildings, 
    buildingsLoading, 
    buildingsError, 
    buildingsLength: buildings?.length,
    buildingsType: typeof buildings,
    preselectedBuildingId
  });

  // Add error boundary-like error handling
  if (buildingsError) {
    console.error('Buildings error in NewAssessmentPage:', buildingsError);
  }

  // Temporary debug - show if component is rendering at all
  console.log('NewAssessmentPage component is rendering...');

  // Transform buildings data to match expected format
  let buildingsData = [];
  try {
    buildingsData = (buildings || []).map(building => ({
      id: building.id,
      name: building.name || 'Unknown Building',
      location: `${building.city || 'Unknown'}, ${building.state || ''}`,
      type: building.type || 'Unknown',
      size: building.square_footage || 0,
      lastAssessment: building.updated_at ? new Date(building.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      fci: building.latest_fci_score, // Use actual FCI score from completed assessments, null if never assessed
      hasBeenAssessed: building.latest_fci_score !== null && building.latest_fci_score !== undefined,
    }));
  } catch (error) {
    console.error('Error transforming buildings data:', error);
    buildingsData = [];
  }

  const filteredBuildings = buildingsData.filter((building) =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedBuilding = buildingsData.find(b => b.id === selectedBuildingId);

  // Early return for critical errors
  if (!buildingsLoading && buildingsError && !buildings) {
    return (
      <div className="space-y-6 p-6 pb-16">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-lg font-medium">Error Loading Page</h3>
              <p className="text-muted-foreground">
                {buildingsError || 'Something went wrong while loading the assessment page'}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while buildings are being fetched
  if (buildingsLoading) {
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
              <BreadcrumbLink>New Assessment</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading buildings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if buildings failed to load
  if (buildingsError || (!buildingsLoading && (!buildings || buildings.length === 0))) {
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
              <BreadcrumbLink>New Assessment</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="text-4xl">🏢</div>
            <div>
              <h3 className="text-lg font-medium">No Buildings Available</h3>
              <p className="text-muted-foreground">
                {buildingsError ? 'Failed to load buildings' : 'You need to add buildings before creating assessments'}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link to="/buildings/new">Add Building</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/buildings">View Buildings</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <BreadcrumbLink asChild><Link to="/dashboard">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link to="/assessments">Assessments</Link></BreadcrumbLink>
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
                        <p className="text-sm font-medium">
                          FCI: {building.hasBeenAssessed && building.fci !== null ? building.fci.toFixed(2) : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last: {building.hasBeenAssessed ? new Date(building.lastAssessment).toLocaleDateString() : 'Never assessed'}
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
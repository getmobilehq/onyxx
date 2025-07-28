import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpDown, 
  Building2, 
  FileText, 
  Filter, 
  MoreHorizontal, 
  Plus, 
  Search, 
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBuildings } from '@/hooks/use-buildings';
import { useBuildingsDebug } from '@/hooks/use-buildings-debug';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for buildings
const buildingsData = [
  { 
    id: '1', 
    name: 'Oak Tower Office Complex', 
    location: 'New York, NY', 
    type: 'Commercial', 
    size: 450000, 
    yearBuilt: 1998, 
    fci: 0.12, 
    lastAssessment: '2024-04-10', 
    image: 'https://images.pexels.com/photos/2119713/pexels-photo-2119713.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  { 
    id: '2', 
    name: 'Riverside Apartments', 
    location: 'Chicago, IL', 
    type: 'Residential', 
    size: 325000, 
    yearBuilt: 2005, 
    fci: 0.34, 
    lastAssessment: '2024-03-22',
    image: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  { 
    id: '3', 
    name: 'Sunset Mall', 
    location: 'Miami, FL', 
    type: 'Retail', 
    size: 580000, 
    yearBuilt: 1992, 
    fci: 0.08, 
    lastAssessment: '2024-05-01',
    image: 'https://images.pexels.com/photos/1579253/pexels-photo-1579253.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  { 
    id: '4', 
    name: 'Central Hospital', 
    location: 'Boston, MA', 
    type: 'Healthcare', 
    size: 720000, 
    yearBuilt: 1984, 
    fci: 0.22, 
    lastAssessment: '2024-02-15',
    image: 'https://images.pexels.com/photos/668298/pexels-photo-668298.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  { 
    id: '5', 
    name: 'Green Hills School', 
    location: 'Seattle, WA', 
    type: 'Education', 
    size: 275000, 
    yearBuilt: 2010, 
    fci: 0.05, 
    lastAssessment: '2024-04-28',
    image: 'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  { 
    id: '6', 
    name: 'Waterfront Hotel', 
    location: 'San Francisco, CA', 
    type: 'Hospitality', 
    size: 390000, 
    yearBuilt: 2002, 
    fci: 0.19, 
    lastAssessment: '2024-03-05',
    image: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  { 
    id: '7', 
    name: 'Metro Logistics Center', 
    location: 'Dallas, TX', 
    type: 'Industrial', 
    size: 850000, 
    yearBuilt: 2015, 
    fci: 0.03, 
    lastAssessment: '2024-05-10',
    image: 'https://images.pexels.com/photos/236705/pexels-photo-236705.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
  { 
    id: '8', 
    name: 'Highland Park Condos', 
    location: 'Denver, CO', 
    type: 'Residential', 
    size: 210000, 
    yearBuilt: 2008, 
    fci: 0.16, 
    lastAssessment: '2024-04-15',
    image: 'https://images.pexels.com/photos/1838640/pexels-photo-1838640.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  },
];

// Building types for filtering
const buildingTypes = [
  'All Types',
  'Commercial',
  'Residential',
  'Retail',
  'Healthcare',
  'Education',
  'Hospitality',
  'Industrial',
];

// Helper function to determine FCI status color
const getFciStatusColor = (fci: number | null) => {
  if (fci === null) return 'text-gray-500';
  if (fci <= 0.1) return 'text-green-500';
  if (fci <= 0.2) return 'text-blue-500';
  if (fci <= 0.3) return 'text-yellow-500';
  return 'text-red-500';
};

// Helper function to determine FCI label
const getFciLabel = (fci: number | null) => {
  if (fci === null) return 'Not Yet Assessed';
  if (fci <= 0.1) return 'Excellent';
  if (fci <= 0.2) return 'Good';
  if (fci <= 0.3) return 'Fair';
  return 'Poor';
};

export function BuildingsPage() {
  const { buildings, loading, error, fetchBuildings } = useBuildings();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [fciRange, setFciRange] = useState<[number, number]>([0, 1]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<string>('name');
  const [filterOpen, setFilterOpen] = useState(false);

  // Transform API data to match expected format
  const buildingsData = buildings.filter(building => building && building.id).map(building => ({
    id: building.id,
    name: building.name || 'Unnamed Building',
    location: `${building.city || 'Unknown'}, ${building.state || ''}`,
    type: building.type || 'Unknown',
    size: building.square_footage || 0,
    yearBuilt: building.year_built || new Date().getFullYear(),
    fci: building.latest_fci_score !== null && building.latest_fci_score !== undefined ? parseFloat(building.latest_fci_score) : null,
    lastAssessment: building.updated_at ? new Date(building.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    image: building.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'
  }));


  // Simple FCI calculation based on age
  function calculateFCI(building: any) {
    const age = new Date().getFullYear() - (building.year_built || 2020);
    const baseFCI = age * 0.01;
    return Math.min(baseFCI, 0.9);
  }

  // Filter buildings based on search query, type, and FCI range
  const filteredBuildings = buildingsData.filter((building) => {
    const matchesSearch = building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        building.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All Types' || building.type === selectedType;
    const matchesFci = building.fci === null || (building.fci >= fciRange[0] && building.fci <= fciRange[1]);
    
    return matchesSearch && matchesType && matchesFci;
  });


  // Sort buildings
  const sortedBuildings = [...filteredBuildings].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'location':
        comparison = a.location.localeCompare(b.location);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'fci':
        comparison = a.fci - b.fci;
        break;
      case 'lastAssessment':
        comparison = new Date(a.lastAssessment).getTime() - new Date(b.lastAssessment).getTime();
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('All Types');
    setFciRange([0, 1]);
    setSortField('name');
    setSortOrder('asc');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-red-600 mb-4">Error loading buildings: {error}</p>
        <Button onClick={fetchBuildings}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Buildings</h2>
          <p className="text-muted-foreground">
            Manage and monitor all your facilities in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/buildings/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Building
            </Link>
          </Button>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {(selectedType !== 'All Types' || fciRange[0] > 0 || fciRange[1] < 1) && (
                  <Badge variant="secondary\" className="ml-2 px-1 py-0">
                    <span className="text-xs font-normal">Active</span>
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Buildings</SheetTitle>
                <SheetDescription>
                  Narrow down your building list with custom filters.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Building Type</h3>
                  <Select 
                    value={selectedType} 
                    onValueChange={(value) => setSelectedType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a building type" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildingTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">FCI Range</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Excellent</span>
                      <span className="text-xs text-muted-foreground">Poor</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                          "flex-1",
                          fciRange[0] === 0 && fciRange[1] >= 0.1 ? "bg-primary/10" : ""
                        )}
                        onClick={() => setFciRange([0, 0.1])}
                      >
                        Excellent
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                          "flex-1",
                          fciRange[0] >= 0.1 && fciRange[0] < 0.2 && fciRange[1] >= 0.2 ? "bg-primary/10" : ""
                        )}
                        onClick={() => setFciRange([0.1, 0.2])}
                      >
                        Good
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                          "flex-1",
                          fciRange[0] >= 0.2 && fciRange[0] < 0.3 && fciRange[1] >= 0.3 ? "bg-primary/10" : ""
                        )}
                        onClick={() => setFciRange([0.2, 0.3])}
                      >
                        Fair
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                          "flex-1",
                          fciRange[0] >= 0.3 && fciRange[1] <= 1 ? "bg-primary/10" : ""
                        )}
                        onClick={() => setFciRange([0.3, 1])}
                      >
                        Poor
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>FCI: {fciRange[0].toFixed(1)}</span>
                      <span>to {fciRange[1].toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <SheetFooter>
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="mb-2 sm:mb-0"
                >
                  Reset Filters
                </Button>
                <Button onClick={() => setFilterOpen(false)}>Apply Filters</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <div className="flex">
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setView('grid')}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M3.5 2C3.22386 2 3 2.22386 3 2.5V6.5C3 6.77614 3.22386 7 3.5 7H7.5C7.77614 7 8 6.77614 8 6.5V2.5C8 2.22386 7.77614 2 7.5 2H3.5ZM4 6V3H7V6H4ZM3.5 8C3.22386 8 3 8.22386 3 8.5V12.5C3 12.7761 3.22386 13 3.5 13H7.5C7.77614 13 8 12.7761 8 12.5V8.5C8 8.22386 7.77614 8 7.5 8H3.5ZM4 12V9H7V12H4ZM9.5 2C9.22386 2 9 2.22386 9 2.5V6.5C9 6.77614 9.22386 7 9.5 7H13.5C13.7761 7 14 6.77614 14 6.5V2.5C14 2.22386 13.7761 2 13.5 2H9.5ZM10 6V3H13V6H10ZM9.5 8C9.22386 8 9 8.22386 9 8.5V12.5C9 12.7761 9.22386 13 9.5 13H13.5C13.7761 13 14 12.7761 14 12.5V8.5C14 8.22386 13.7761 8 13.5 8H9.5ZM10 12V9H13V12H10Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="sr-only">Grid view</span>
            </Button>
            <Button
              variant={view === 'table' ? 'default' : 'outline'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setView('table')}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M2.5 4C2.22386 4 2 3.77614 2 3.5C2 3.22386 2.22386 3 2.5 3H12.5C12.7761 3 13 3.22386 13 3.5C13 3.77614 12.7761 4 12.5 4H2.5ZM2.5 8C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H2.5ZM2 11.5C2 11.2239 2.22386 11 2.5 11H12.5C12.7761 11 13 11.2239 13 11.5C13 11.7761 12.7761 12 12.5 12H2.5C2.22386 12 2 11.7761 2 11.5Z"
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                ></path>
              </svg>
              <span className="sr-only">Table view</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search and applied filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search buildings..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full rounded-l-none"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          
          {/* Applied filters display */}
          {(selectedType !== 'All Types' || fciRange[0] > 0 || fciRange[1] < 1) && (
            <div className="flex flex-wrap items-center gap-2">
              {selectedType !== 'All Types' && (
                <Badge variant="secondary\" className="flex items-center gap-1">
                  Type: {selectedType}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setSelectedType('All Types')}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove type filter</span>
                  </Button>
                </Badge>
              )}
              
              {(fciRange[0] > 0 || fciRange[1] < 1) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  FCI: {fciRange[0].toFixed(1)}-{fciRange[1].toFixed(1)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setFciRange([0, 1])}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove FCI filter</span>
                  </Button>
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={resetFilters}
              >
                Reset all
              </Button>
            </div>
          )}
        </div>
        
        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {sortedBuildings.length} of {buildingsData.length} buildings
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedBuildings.map((building) => (
            <Link
              key={building.id}
              to={`/buildings/${building.id}`}
              className="group block"
            >
              <Card className="overflow-hidden transition-all hover:shadow-md">
                <div className="relative aspect-video w-full overflow-hidden">
                  <img
                    src={building.image}
                    alt={building.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                    <div className={cn(
                      "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                      building.fci === null ? "bg-gray-500/20 text-gray-500" :
                      building.fci <= 0.1 ? "bg-green-500/20 text-green-500" :
                      building.fci <= 0.2 ? "bg-blue-500/20 text-blue-500" :
                      building.fci <= 0.3 ? "bg-yellow-500/20 text-yellow-500" :
                      "bg-red-500/20 text-red-500"
                    )}>
                      FCI: {building.fci !== null ? building.fci.toFixed(2) : 'N/A'} ({getFciLabel(building.fci)})
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold leading-none tracking-tight group-hover:underline">
                      {building.name}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building2 className="mr-1 h-3.5 w-3.5" />
                      {building.location}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="inline-block mr-2">
                        {building.type}
                      </span>
                      <span className="inline-block">
                        {building.size.toLocaleString()} sq ft
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                      <span>Last assessed: {new Date(building.lastAssessment).toLocaleDateString()}</span>
                      <span className="inline-flex items-center">
                        <FileText className="mr-1 h-3 w-3" />
                        Reports
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 font-medium"
                  >
                    Name
                    {sortField === 'name' && (
                      <ArrowUpDown className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        sortOrder === 'desc' && "rotate-180"
                      )} />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('location')}
                    className="flex items-center gap-1 font-medium"
                  >
                    Location
                    {sortField === 'location' && (
                      <ArrowUpDown className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        sortOrder === 'desc' && "rotate-180"
                      )} />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('type')}
                    className="flex items-center gap-1 font-medium"
                  >
                    Type
                    {sortField === 'type' && (
                      <ArrowUpDown className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        sortOrder === 'desc' && "rotate-180"
                      )} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">Size (sq ft)</TableHead>
                <TableHead className="hidden lg:table-cell">Year Built</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('fci')}
                    className="flex items-center gap-1 font-medium"
                  >
                    FCI
                    {sortField === 'fci' && (
                      <ArrowUpDown className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        sortOrder === 'desc' && "rotate-180"
                      )} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('lastAssessment')}
                    className="flex items-center gap-1 font-medium"
                  >
                    Last Assessment
                    {sortField === 'lastAssessment' && (
                      <ArrowUpDown className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        sortOrder === 'desc' && "rotate-180"
                      )} />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBuildings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No buildings found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                sortedBuildings.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell>
                      <Link to={`/buildings/${building.id}`} className="font-medium hover:underline">
                        {building.name}
                      </Link>
                    </TableCell>
                    <TableCell>{building.location}</TableCell>
                    <TableCell>{building.type}</TableCell>
                    <TableCell className="hidden md:table-cell">{building.size.toLocaleString()}</TableCell>
                    <TableCell className="hidden lg:table-cell">{building.yearBuilt}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={cn("text-sm font-medium", getFciStatusColor(building.fci))}>
                          {building.fci !== null ? building.fci.toFixed(2) : 'N/A'}
                        </span>
                        <Progress
                          value={building.fci !== null ? building.fci * 100 : 0}
                          className="h-2 w-16"
                          indicatorClassName={cn(
                            building.fci === null ? "bg-gray-400" :
                            building.fci <= 0.1 ? "bg-green-500" :
                            building.fci <= 0.2 ? "bg-blue-500" :
                            building.fci <= 0.3 ? "bg-yellow-500" :
                            "bg-red-500"
                          )}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {new Date(building.lastAssessment).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/buildings/${building.id}`}>
                              View details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/assessments/new?buildingId=${building.id}`}>
                              Start assessment
                            </Link>
                          </DropdownMenuItem>
                
                
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={`/reports?buildingId=${building.id}`}>
                              View reports
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
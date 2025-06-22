import { useState, useEffect } from 'react';
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

export function BuildingsPage() {
  const { buildings, loading, error, fetchBuildings } = useBuildings();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [fciRange, setFciRange] = useState([0, 1]);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Transform API data to match frontend format
  const transformedBuildings = buildings.map(building => ({
    id: building.id,
    name: building.name,
    location: `${building.city}, ${building.state}`,
    type: building.type,
    size: building.square_footage,
    yearBuilt: building.year_built,
    fci: calculateFCI(building), // Calculate based on your logic
    lastAssessment: building.updated_at ? new Date(building.updated_at).toLocaleDateString() : 'Not assessed',
    image: building.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    status: building.status
  }));

  // Calculate FCI based on building age and type
  function calculateFCI(building: any) {
    // Simple FCI calculation - replace with actual logic
    const age = new Date().getFullYear() - building.year_built;
    const baseFCI = age * 0.01;
    return Math.min(baseFCI, 0.9);
  }

  // Get unique building types for filter
  const buildingTypes = ['All Types', ...new Set(transformedBuildings.map(b => b.type))];

  // Filter buildings based on search and filters
  const filteredBuildings = transformedBuildings.filter(building => {
    const matchesSearch = building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         building.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All Types' || building.type === selectedType;
    const matchesFCI = building.fci >= fciRange[0] && building.fci <= fciRange[1];
    
    return matchesSearch && matchesType && matchesFCI;
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

  const getFCIColor = (fci: number) => {
    if (fci <= 0.05) return 'text-green-600 bg-green-100';
    if (fci <= 0.10) return 'text-yellow-600 bg-yellow-100';
    if (fci <= 0.30) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getFCILabel = (fci: number) => {
    if (fci <= 0.05) return 'Excellent';
    if (fci <= 0.10) return 'Good';
    if (fci <= 0.30) return 'Fair';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search buildings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Buildings</SheetTitle>
                <SheetDescription>
                  Narrow down your building list
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Building Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildingTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">FCI Range</label>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="number" 
                      value={fciRange[0]} 
                      onChange={(e) => setFciRange([+e.target.value, fciRange[1]])}
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-20"
                    />
                    <span>to</span>
                    <Input 
                      type="number" 
                      value={fciRange[1]} 
                      onChange={(e) => setFciRange([fciRange[0], +e.target.value])}
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={resetFilters}>
                  Reset
                </Button>
                <Button onClick={() => setIsFilterOpen(false)}>
                  Apply Filters
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none rounded-l-md"
              onClick={() => setViewMode('grid')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" strokeWidth={2} />
                <rect x="14" y="3" width="7" height="7" strokeWidth={2} />
                <rect x="3" y="14" width="7" height="7" strokeWidth={2} />
                <rect x="14" y="14" width="7" height="7" strokeWidth={2} />
              </svg>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-none rounded-r-md"
              onClick={() => setViewMode('list')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <line x1="3" y1="6" x2="21" y2="6" strokeWidth={2} />
                <line x1="3" y1="12" x2="21" y2="12" strokeWidth={2} />
                <line x1="3" y1="18" x2="21" y2="18" strokeWidth={2} />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedBuildings.length} of {buildings.length} buildings
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedBuildings.map((building) => (
            <Link
              key={building.id}
              to={`/buildings/${building.id}`}
              className="group"
            >
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="aspect-video relative overflow-hidden bg-gray-100">
                  <img
                    src={building.image}
                    alt={building.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
                  />
                  <Badge 
                    className={cn(
                      "absolute top-2 left-2",
                      getFCIColor(building.fci)
                    )}
                  >
                    FCI: {(building.fci * 100).toFixed(0)}% ({getFCILabel(building.fci)})
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{building.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {building.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{building.type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Size</p>
                      <p className="font-medium">{building.size.toLocaleString()} sq ft</p>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last assessed: {building.lastAssessment}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/reports?building=${building.id}`}>
                        <FileText className="h-4 w-4" />
                        Reports
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox />
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('name')}>
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('location')}>
                    Location
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('type')}>
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Size</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('fci')}>
                    FCI
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('lastAssessment')}>
                    Last Assessment
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedBuildings.map((building) => (
                <TableRow key={building.id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link 
                      to={`/buildings/${building.id}`}
                      className="hover:underline"
                    >
                      {building.name}
                    </Link>
                  </TableCell>
                  <TableCell>{building.location}</TableCell>
                  <TableCell>{building.type}</TableCell>
                  <TableCell>{building.size.toLocaleString()} sq ft</TableCell>
                  <TableCell>
                    <Badge className={cn(getFCIColor(building.fci))}>
                      {(building.fci * 100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell>{building.lastAssessment}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to={`/buildings/${building.id}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/buildings/${building.id}/edit`}>
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/assessments/new?building=${building.id}`}>
                            New Assessment
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
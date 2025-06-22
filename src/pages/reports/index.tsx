import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpDown,
  Building2,
  Download,
  FileText,
  Filter,
  MoreHorizontal,
  Search,
  Share2,
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for reports
const reportsData = [
  {
    id: '1',
    buildingName: 'Oak Tower Office Complex',
    location: 'New York, NY',
    assessmentDate: '2024-04-10',
    fci: 0.12,
    assessor: 'Alex Johnson',
    status: 'published',
  },
  {
    id: '2',
    buildingName: 'Riverside Apartments',
    location: 'Chicago, IL',
    assessmentDate: '2024-03-22',
    fci: 0.34,
    assessor: 'Maria Garcia',
    status: 'draft',
  },
  {
    id: '3',
    buildingName: 'Sunset Mall',
    location: 'Miami, FL',
    assessmentDate: '2024-05-01',
    fci: 0.08,
    assessor: 'David Chen',
    status: 'published',
  },
  {
    id: '4',
    buildingName: 'Central Hospital',
    location: 'Boston, MA',
    assessmentDate: '2024-02-15',
    fci: 0.22,
    assessor: 'Sarah Williams',
    status: 'archived',
  },
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

export function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [fciRange, setFciRange] = useState<[number, number]>([0, 1]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<string>('assessmentDate');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter reports based on search query, status, and FCI range
  const filteredReports = reportsData.filter((report) => {
    const matchesSearch = report.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.assessor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    const matchesFci = report.fci >= fciRange[0] && report.fci <= fciRange[1];
    
    return matchesSearch && matchesStatus && matchesFci;
  });

  // Sort reports
  const sortedReports = [...filteredReports].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'buildingName':
        comparison = a.buildingName.localeCompare(b.buildingName);
        break;
      case 'location':
        comparison = a.location.localeCompare(b.location);
        break;
      case 'assessmentDate':
        comparison = new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime();
        break;
      case 'fci':
        comparison = a.fci - b.fci;
        break;
      case 'assessor':
        comparison = a.assessor.localeCompare(b.assessor);
        break;
      default:
        comparison = new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime();
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setFciRange([0, 1]);
    setSortField('assessmentDate');
    setSortOrder('desc');
  };

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            View and manage assessment reports.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search reports..."
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
          
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {(selectedStatus !== 'all' || fciRange[0] > 0 || fciRange[1] < 1) && (
                  <Badge variant="secondary\" className="ml-2 px-1 py-0">
                    <span className="text-xs font-normal">Active</span>
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Reports</SheetTitle>
                <SheetDescription>
                  Narrow down your report list with custom filters.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Report Status</h3>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={(value) => setSelectedStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
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
        </div>
        
        {/* Applied filters display */}
        {(selectedStatus !== 'all' || fciRange[0] > 0 || fciRange[1] < 1) && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedStatus !== 'all' && (
              <Badge variant="secondary\" className="flex items-center gap-1">
                Status: {selectedStatus}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0"
                  onClick={() => setSelectedStatus('all')}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove status filter</span>
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
        
        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {sortedReports.length} of {reportsData.length} reports
        </div>
      </div>

      {/* Reports Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('buildingName')}
                  className="flex items-center gap-1 font-medium"
                >
                  Building
                  {sortField === 'buildingName' && (
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
                  onClick={() => handleSort('assessmentDate')}
                  className="flex items-center gap-1 font-medium"
                >
                  Assessment Date
                  {sortField === 'assessmentDate' && (
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
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('assessor')}
                  className="flex items-center gap-1 font-medium"
                >
                  Assessor
                  {sortField === 'assessor' && (
                    <ArrowUpDown className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      sortOrder === 'desc' && "rotate-180"
                    )} />
                  )}
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No reports found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              sortedReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Link to={`/reports/${report.id}`} className="font-medium hover:underline">
                      {report.buildingName}
                    </Link>
                  </TableCell>
                  <TableCell>{report.location}</TableCell>
                  <TableCell>{new Date(report.assessmentDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={cn("font-medium", getFciStatusColor(report.fci))}>
                      {report.fci.toFixed(2)} ({getFciLabel(report.fci)})
                    </span>
                  </TableCell>
                  <TableCell>{report.assessor}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        report.status === 'published' && "border-green-500 text-green-500",
                        report.status === 'draft' && "border-yellow-500 text-yellow-500",
                        report.status === 'archived' && "border-blue-500 text-blue-500"
                      )}
                    >
                      {report.status}
                    </Badge>
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
                          <Link to={`/reports/${report.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            View report
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share report
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
    </div>
  );
}
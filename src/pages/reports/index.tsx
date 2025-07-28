import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { EmailSubscriptions } from '@/components/email-subscriptions';
import { Link } from 'react-router-dom';
import { useReports } from '@/hooks/use-reports';
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
import { getFCIStatus, formatFCI } from '@/lib/fci-utils';
import { generateReportPDF } from '@/services/pdf-generator';

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

// Map backend report data to frontend format
const mapReportData = (report: any) => ({
  id: report.id,
  buildingName: report.building_name || 'Unknown Building',
  location: `${report.city || ''}, ${report.state || ''}`.replace(', ', ''),
  assessmentDate: report.assessment_date || report.report_date || new Date().toISOString().split('T')[0],
  fci: report.fci_score !== null && report.fci_score !== undefined ? parseFloat(report.fci_score) : null,
  assessor: report.assessor_name || report.created_by_name || 'Unknown',
  status: report.status || 'draft',
  title: report.title || `Assessment Report - ${report.building_name}`,
  totalRepairCost: report.total_repair_cost || 0,
  replacementValue: report.replacement_value || 0,
  elementCount: report.element_count || 0,
  deficiencyCount: report.deficiency_count || 0,
});

// Helper function to determine FCI status color
const getFciStatusColor = (fci: number | null) => {
  if (fci === null) return 'text-gray-500';
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
const getFciLabel = (fci: number | null) => {
  if (fci === null) return 'Not Yet Assessed';
  return getFCIStatus(fci).label;
};

export function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [fciRange, setFciRange] = useState<[number, number]>([0, 1]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<string>('assessmentDate');
  const [filterOpen, setFilterOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { reports, loading, error, fetchReports, deleteReport, getReport } = useReports();

  // Load reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Map backend data to frontend format
  const mappedReports = reports.map(mapReportData);

  // Filter reports based on search query, status, and FCI range
  const filteredReports = mappedReports.filter((report) => {
    const matchesSearch = report.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.assessor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    const matchesFci = report.fci === null || (report.fci >= fciRange[0] && report.fci <= fciRange[1]);
    
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
        if (a.fci === null && b.fci === null) comparison = 0;
        else if (a.fci === null) comparison = 1; // Put null values at the end
        else if (b.fci === null) comparison = -1;
        else comparison = a.fci - b.fci;
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

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      
      // Build query parameters based on current filters
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const response = await fetch(`/api/reports/excel?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to generate Excel report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Excel report downloaded successfully');
    } catch (error) {
      console.error('Excel download failed:', error);
      toast.error('Failed to download Excel report');
    } finally {
      setDownloading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading reports: {error}</p>
          <Button onClick={() => fetchReports()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            View and manage assessment reports for capital planning decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleDownloadExcel}
            disabled={downloading}
            variant="outline"
          >
            {downloading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </>
            )}
          </Button>
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
          Showing {sortedReports.length} of {mappedReports.length} reports
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
                      {report.fci !== null ? `${report.fci.toFixed(2)} (${getFciLabel(report.fci)})` : `N/A (${getFciLabel(report.fci)})`}
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
                        <DropdownMenuItem onClick={async () => {
                          try {
                            // Get full report data for PDF generation
                            const fullReport = await getReport(report.id);
                            
                            // Convert to PDF format
                            const pdfData = {
                              id: fullReport.id,
                              title: fullReport.title || `Facility Condition Assessment - ${report.buildingName}`,
                              building_name: report.buildingName,
                              assessor_name: report.assessor,
                              assessment_date: report.assessmentDate,
                              report_date: new Date().toISOString(),
                              fci_score: report.fci,
                              total_repair_cost: report.totalRepairCost || 0,
                              replacement_value: report.replacementValue || 0,
                              immediate_repair_cost: fullReport.immediate_repair_cost || 0,
                              short_term_repair_cost: fullReport.short_term_repair_cost || 0,
                              long_term_repair_cost: fullReport.long_term_repair_cost || 0,
                              element_count: report.elementCount || 0,
                              deficiency_count: report.deficiencyCount || 0,
                              executive_summary: fullReport.executive_summary || `Assessment report for ${report.buildingName}`,
                              building_type: fullReport.building_type || 'Unknown',
                              square_footage: fullReport.square_footage || 0,
                              year_built: fullReport.year_built || 'Unknown',
                              city: report.location.split(',')[1]?.trim() || '',
                              state: report.location.split(',')[0]?.trim() || '',
                              systems_data: fullReport.systems_data || { elements: [] },
                              recommendations: fullReport.recommendations || []
                            };

                            generateReportPDF(pdfData);
                            toast.success('PDF report downloaded successfully');
                          } catch (error) {
                            console.error('Failed to generate PDF:', error);
                            toast.error('Failed to generate PDF report');
                          }
                        }}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share report
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this report?')) {
                              try {
                                await deleteReport(report.id);
                              } catch (error) {
                                console.error('Failed to delete report:', error);
                              }
                            }
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Delete report
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

      {/* Email Subscriptions */}
      <EmailSubscriptions />
    </div>
  );
}
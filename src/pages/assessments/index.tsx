import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { useAssessments } from '@/hooks/use-assessments';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ClipboardList, 
  FileText, 
  Filter, 
  Loader2,
  MoreHorizontal, 
  Plus, 
  Search, 
  X,
  Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';


const assessmentTypes = ['All Types', 'Pre-Assessment', 'Field Assessment'];
const assessmentStatuses = ['All Statuses', 'Pending', 'In Progress', 'Completed'];

export function AssessmentsPage() {
  const { user } = useAuth();
  const { assessments, loading, error, fetchAssessments, deleteAssessment } = useAssessments();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Refresh assessments when component mounts (useful when returning from completed assessment)
  useEffect(() => {
    fetchAssessments();
  }, []); // Empty dependency array to run only once on mount

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

  // Transform API data to match expected format
  const assessmentsData = assessments.map(assessment => {
    const extractedFCI = extractFCIFromNotes(assessment.notes);
    
    return {
      id: assessment.id,
      buildingName: assessment.building_name || 'Unknown Building',
      buildingId: assessment.building_id,
      location: `${assessment.city || 'Unknown'}, ${assessment.state || ''}`,
      status: assessment.status || 'pending',
      type: assessment.type === 'pre_assessment' ? 'Pre-Assessment' : 
            assessment.type === 'field_assessment' ? 'Field Assessment' : 'Unknown',
      date: assessment.scheduled_date || assessment.created_at,
      assessor: assessment.assigned_to_name || 'Unassigned',
      fci: extractedFCI, // Use actual FCI from completed assessments or null for pending
    };
  });

  // Debug logging
  console.log('📊 All assessments:', assessments);
  console.log('🔄 Transformed assessments:', assessmentsData);

  const filteredAssessments = assessmentsData.filter((assessment) => {
    const matchesSearch = assessment.buildingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.assessor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All Types' || assessment.type === selectedType;
    
    // Fix status matching logic
    let matchesStatus = selectedStatus === 'All Statuses';
    if (!matchesStatus) {
      const filterStatus = selectedStatus.toLowerCase().replace(' ', '_');
      matchesStatus = assessment.status === filterStatus;
    }
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('All Types');
    setSelectedStatus('All Statuses');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-blue-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <ClipboardList className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Delete handlers
  const handleDeleteClick = (assessmentId: string) => {
    setAssessmentToDelete(assessmentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;
    
    setDeleting(true);
    try {
      await deleteAssessment(assessmentToDelete);
      toast.success('Assessment deleted successfully');
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete assessment');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAssessmentToDelete(null);
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

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
        <p className="text-red-600 mb-4">Error loading assessments: {error}</p>
        <Button onClick={() => fetchAssessments()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assessments</h2>
          <p className="text-muted-foreground">
            Manage and track building condition assessments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/assessments/new">
              <Plus className="mr-2 h-4 w-4" />
              New Assessment
            </Link>
          </Button>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {(selectedType !== 'All Types' || selectedStatus !== 'All Statuses') && (
                  <Badge variant="secondary\" className="ml-2 px-1 py-0">
                    <span className="text-xs font-normal">Active</span>
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Assessments</SheetTitle>
                <SheetDescription>
                  Narrow down your assessment list with custom filters.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Assessment Type</h3>
                  <Select 
                    value={selectedType} 
                    onValueChange={(value) => setSelectedType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an assessment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Status</h3>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={(value) => setSelectedStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessmentStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search assessments..."
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
          
          {(selectedType !== 'All Types' || selectedStatus !== 'All Statuses') && (
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
              
              {selectedStatus !== 'All Statuses' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {selectedStatus}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0"
                    onClick={() => setSelectedStatus('All Statuses')}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove status filter</span>
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
        
        <div className="text-sm text-muted-foreground">
          Showing {filteredAssessments.length} of {assessmentsData.length} assessments
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Building</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Assessor</TableHead>
              <TableHead>FCI</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssessments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No assessments found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredAssessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Link 
                          to={`/buildings/${assessment.buildingId}`}
                          className="font-medium hover:underline"
                        >
                          {assessment.buildingName}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {assessment.location}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{assessment.type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(assessment.status)}
                      <span className={getStatusColor(assessment.status)}>
                        {assessment.status.replace('_', ' ').charAt(0).toUpperCase() + 
                         assessment.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(assessment.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {assessment.assessor.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {assessment.assessor}
                    </div>
                  </TableCell>
                  <TableCell>
                    {assessment.fci !== null ? (
                      <div className="flex items-center gap-2">
                        <div className={`text-sm font-medium ${
                          assessment.fci <= 0.05 ? 'text-green-600' : 
                          assessment.fci <= 0.10 ? 'text-yellow-600' : 
                          assessment.fci <= 0.30 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {assessment.fci.toFixed(3)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {assessment.fci <= 0.05 ? 'Good' : 
                           assessment.fci <= 0.10 ? 'Fair' : 
                           assessment.fci <= 0.30 ? 'Poor' : 'Critical'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
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
                          <Link to={`/assessments/${assessment.id}`}>
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/assessments/${assessment.id}/edit`}>
                            Edit assessment
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/reports?assessmentId=${assessment.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            View report
                          </Link>
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(assessment.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete assessment
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone. 
              All assessment data, including element ratings and reports, will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Assessment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
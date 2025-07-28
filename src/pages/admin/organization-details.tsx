import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/auth-context';
import { organizationsAPI, buildingsAPI, assessmentsAPI, usersAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Users,
  ClipboardList,
  ArrowLeft,
  Edit,
  Shield,
  Trash2,
  Plus,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface OrganizationDetails {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdAt: string;
  updatedAt?: string;
  subscription: {
    plan: string;
    status: string;
    expiresAt?: string;
  };
  stats: {
    totalUsers: number;
    totalBuildings: number;
    totalAssessments: number;
    activeProjects: number;
  };
  // Token-based fields
  subscription_plan?: string;
  subscription_status?: string;
  token_balance?: number;
}

export function OrganizationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  useEffect(() => {
    fetchOrganizationData();
  }, [id]);

  const fetchOrganizationData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Fetch organization details
      const orgResponse = await organizationsAPI.getById(id);
      if (orgResponse.data.success) {
        setOrganization(orgResponse.data.data.organization);
      }

      // Fetch related data
      const [buildingsRes, usersRes, assessmentsRes] = await Promise.all([
        buildingsAPI.getAll(),
        usersAPI.getAll(),
        assessmentsAPI.getAll(),
      ]);

      // Filter data for this organization
      if (buildingsRes.data.success) {
        const orgBuildings = buildingsRes.data.data.buildings.filter(
          (b: any) => b.organization_id === id
        );
        setBuildings(orgBuildings);
      }

      if (usersRes.data.success) {
        const orgUsers = usersRes.data.data.users.filter(
          (u: any) => u.organization_id === id
        );
        setUsers(orgUsers);
      }

      if (assessmentsRes.data.success) {
        const orgAssessments = assessmentsRes.data.data.assessments.filter(
          (a: any) => a.organization_id === id
        );
        setAssessments(orgAssessments);
      }
    } catch (error) {
      console.error('Failed to fetch organization data:', error);
      toast.error('Failed to load organization details');
      navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendOrganization = async () => {
    if (!organization) return;

    const newStatus = organization.subscription_status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'suspend' : 'activate';

    if (!confirm(`Are you sure you want to ${action} this organization?`)) {
      return;
    }

    try {
      await organizationsAPI.update(organization.id, {
        subscription_status: newStatus,
      });
      toast.success(`Organization ${action}d successfully`);
      fetchOrganizationData();
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error('Failed to update organization status');
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organization) return;

    if (!confirm(`Are you sure you want to delete "${organization.name}"? This action cannot be undone and will delete all associated data.`)) {
      return;
    }

    try {
      await organizationsAPI.delete(organization.id);
      toast.success('Organization deleted successfully');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Failed to delete organization:', error);
      toast.error('Failed to delete organization');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Organization not found</p>
        <Button onClick={() => navigate('/admin/dashboard')} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const subscriptionPlan = organization.subscription?.plan || organization.subscription_plan || 'free';
  const subscriptionStatus = organization.subscription?.status || organization.subscription_status || 'inactive';

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{organization.name}</h2>
            {organization.description && (
              <p className="text-muted-foreground">{organization.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/organizations/${organization.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleSuspendOrganization}
          >
            <Shield className="mr-2 h-4 w-4" />
            {subscriptionStatus === 'active' ? 'Suspend' : 'Activate'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteOrganization}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Organization Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={
                subscriptionPlan === 'enterprise' ? 'default' :
                subscriptionPlan === 'professional' ? 'secondary' : 'outline'
              }>
                {subscriptionPlan}
              </Badge>
              <Badge variant={
                subscriptionStatus === 'active' ? 'default' :
                subscriptionStatus === 'suspended' ? 'destructive' : 'secondary'
              }>
                {subscriptionStatus}
              </Badge>
            </div>
            {organization.token_balance !== undefined && (
              <p className="text-xs text-muted-foreground mt-2">
                Token Balance: {organization.token_balance}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buildings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buildings.length}</div>
            <p className="text-xs text-muted-foreground">
              Managed properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total assessments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              {organization.industry && (
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Industry</p>
                    <p className="text-sm text-muted-foreground">{organization.industry}</p>
                  </div>
                </div>
              )}
              {organization.size && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Company Size</p>
                    <p className="text-sm text-muted-foreground">{organization.size}</p>
                  </div>
                </div>
              )}
              {organization.website && (
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Website</p>
                    <a href={organization.website} target="_blank" rel="noopener noreferrer" 
                       className="text-sm text-primary hover:underline">
                      {organization.website}
                    </a>
                  </div>
                </div>
              )}
              {organization.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{organization.phone}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {(organization.address || organization.city || organization.state || organization.zipCode) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {organization.address && <>{organization.address}<br /></>}
                      {organization.city && `${organization.city}, `}
                      {organization.state && `${organization.state} `}
                      {organization.zipCode}
                      {organization.country && <><br />{organization.country}</>}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(organization.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for related data */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Users in this organization
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                          {user.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                          {user.role}
                          {user.is_organization_owner && ' (Owner)'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Active</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buildings Tab */}
        <TabsContent value="buildings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Buildings</CardTitle>
                  <CardDescription>
                    Properties managed by this organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size (sq ft)</TableHead>
                    <TableHead>Year Built</TableHead>
                    <TableHead>FCI Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buildings.map((building) => (
                    <TableRow key={building.id}>
                      <TableCell className="font-medium">{building.name}</TableCell>
                      <TableCell>{building.address}</TableCell>
                      <TableCell>{building.building_type}</TableCell>
                      <TableCell>{building.square_footage?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{building.year_built || '-'}</TableCell>
                      <TableCell>
                        {building.fci_score ? (
                          <Badge variant={
                            parseFloat(building.fci_score) < 0.1 ? 'default' :
                            parseFloat(building.fci_score) < 0.4 ? 'secondary' :
                            parseFloat(building.fci_score) < 0.7 ? 'outline' :
                            'destructive'
                          }>
                            {(parseFloat(building.fci_score) * 100).toFixed(1)}%
                          </Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {buildings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No buildings found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assessments</CardTitle>
                  <CardDescription>
                    Assessment history for this organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assessor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>FCI Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell>{assessment.building?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {assessment.type?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          assessment.status === 'completed' ? 'default' :
                          assessment.status === 'in_progress' ? 'secondary' :
                          'outline'
                        }>
                          {assessment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{assessment.assigned_to?.name || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {assessment.fci_score ? (
                          <Badge variant={
                            assessment.fci_score < 0.1 ? 'default' :
                            assessment.fci_score < 0.4 ? 'secondary' :
                            assessment.fci_score < 0.7 ? 'outline' :
                            'destructive'
                          }>
                            {(assessment.fci_score * 100).toFixed(1)}%
                          </Badge>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {assessments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No assessments found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
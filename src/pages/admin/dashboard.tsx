import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Building2,
  Users,
  Shield,
  CreditCard,
  TrendingUp,
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Building,
  Activity,
  DollarSign,
  Loader2,
  Search,
  Filter,
  Download,
  Eye,
} from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { organizationsAPI, usersAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Organization {
  id: string;
  name: string;
  description?: string;
  subscription_plan: 'free' | 'professional' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  user_count: number;
  building_count: number;
  assessment_count: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_id: string;
  organization_name: string;
  created_at: string;
  is_organization_owner: boolean;
}

interface DashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  totalBuildings: number;
  totalAssessments: number;
  activeOrganizations: number;
  revenue: {
    monthly: number;
    annual: number;
  };
}

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  description: z.string().optional(),
  subscription_plan: z.enum(['free', 'professional', 'enterprise']),
});

type OrganizationForm = z.infer<typeof organizationSchema>;

export function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    totalBuildings: 0,
    totalAssessments: 0,
    activeOrganizations: 0,
    revenue: { monthly: 0, annual: 0 },
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const form = useForm<OrganizationForm>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      description: '',
      subscription_plan: 'free',
    },
  });

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch organizations
      const orgsResponse = await organizationsAPI.getAll();
      if (orgsResponse.data.success) {
        setOrganizations(orgsResponse.data.data.organizations);
        
        // Calculate stats
        const orgs = orgsResponse.data.data.organizations;
        const totalUsers = orgs.reduce((sum: number, org: Organization) => sum + (parseInt(org.user_count as any) || 0), 0);
        const totalBuildings = orgs.reduce((sum: number, org: Organization) => sum + (parseInt(org.building_count as any) || 0), 0);
        const totalAssessments = orgs.reduce((sum: number, org: Organization) => sum + (parseInt(org.assessment_count as any) || 0), 0);
        const activeOrgs = orgs.filter((org: Organization) => org.subscription_status === 'active').length;
        
        // Calculate revenue (mock calculation)
        const monthlyRevenue = orgs.reduce((sum: number, org: Organization) => {
          if (org.subscription_plan === 'professional') return sum + 99;
          if (org.subscription_plan === 'enterprise') return sum + 299;
          return sum;
        }, 0);
        
        setStats({
          totalOrganizations: orgs.length,
          totalUsers,
          totalBuildings,
          totalAssessments,
          activeOrganizations: activeOrgs,
          revenue: {
            monthly: monthlyRevenue,
            annual: monthlyRevenue * 12,
          },
        });
      }

      // Fetch all users
      const usersResponse = await usersAPI.getAll();
      if (usersResponse.data.success) {
        setUsers(usersResponse.data.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (data: OrganizationForm) => {
    try {
      const response = await organizationsAPI.create({
        name: data.name,
        description: data.description || '',
        industry: 'Real Estate',
        size: 'Medium',
        website: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'US',
        subscription_plan: data.subscription_plan
      });
      
      if (response.data.success) {
        toast.success('Organization created successfully');
        setIsCreateOrgDialogOpen(false);
        form.reset();
        fetchData();
      }
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      const message = error.response?.data?.message || 'Failed to create organization';
      toast.error(message);
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete "${orgName}"? This will delete all associated data.`)) {
      return;
    }

    try {
      await organizationsAPI.delete(orgId);
      toast.success(`Organization "${orgName}" deleted successfully`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete organization:', error);
      toast.error('Failed to delete organization');
    }
  };

  const handleSuspendOrganization = async (org: Organization) => {
    try {
      await organizationsAPI.update(org.id, {
        subscription_status: org.subscription_status === 'active' ? 'suspended' : 'active',
      });
      toast.success(`Organization ${org.subscription_status === 'active' ? 'suspended' : 'activated'} successfully`);
      fetchData();
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error('Failed to update organization status');
    }
  };

  const handleViewOrganization = (orgId: string) => {
    navigate(`/admin/organizations/${orgId}`);
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || org.subscription_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-16">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Manage all organizations, users, and system settings
          </p>
        </div>
        <Badge variant="destructive" className="w-fit">
          <Shield className="mr-1 h-3 w-3" />
          Super Admin
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeOrganizations} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all orgs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buildings</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBuildings}</div>
            <p className="text-xs text-muted-foreground">Total managed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.monthly}</div>
            <p className="text-xs text-muted-foreground">Recurring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.annual}</div>
            <p className="text-xs text-muted-foreground">Projected</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="activity">System Activity</TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Organizations</CardTitle>
                  <CardDescription>
                    Manage organizations and their subscriptions
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search organizations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Dialog open={isCreateOrgDialogOpen} onOpenChange={setIsCreateOrgDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Organization
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Organization</DialogTitle>
                        <DialogDescription>
                          Create a new organization and set up their subscription.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleCreateOrganization)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Organization Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Acme Corporation" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Brief description..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="subscription_plan"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subscription Plan</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="professional">Professional ($99/mo)</SelectItem>
                                    <SelectItem value="enterprise">Enterprise ($299/mo)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => {
                              setIsCreateOrgDialogOpen(false);
                              form.reset();
                            }}>
                              Cancel
                            </Button>
                            <Button type="submit">Create Organization</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Buildings</TableHead>
                    <TableHead className="text-center">Assessments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          {org.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {org.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          org.subscription_plan === 'enterprise' ? 'default' :
                          org.subscription_plan === 'professional' ? 'secondary' : 'outline'
                        }>
                          {org.subscription_plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          org.subscription_status === 'active' ? 'default' :
                          org.subscription_status === 'suspended' ? 'destructive' : 'secondary'
                        }>
                          {org.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{org.user_count || 0}</TableCell>
                      <TableCell className="text-center">{org.building_count || 0}</TableCell>
                      <TableCell className="text-center">{org.assessment_count || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewOrganization(org.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/organizations/${org.id}/edit`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleSuspendOrganization(org)}>
                              <Shield className="mr-2 h-4 w-4" />
                              {org.subscription_status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteOrganization(org.id, org.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    Manage users across all organizations
                  </CardDescription>
                </div>
                <Button onClick={() => navigate('/admin/users')}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.slice(0, 10).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.organization_name}
                          {user.is_organization_owner && (
                            <span className="ml-1 text-xs">(Owner)</span>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                          {user.role}
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
              {users.length > 10 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => navigate('/admin/users')}>
                    View All {users.length} Users
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>
                Recent activity across all organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Activity logging coming soon</p>
                  <p className="text-xs mt-2">Track user actions, system events, and audit trails</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, UserPlus, Mail, Phone, Shield, ShieldCheck, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { usersAPI } from '@/services/api';
import { useAuth } from '@/context/auth-context';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive';
  lastActive?: string;
  joinedAt: string;
  assessmentsCompleted?: number;
}

const inviteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['manager', 'assessor'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
  message: z.string().optional(),
});

type InviteForm = z.infer<typeof inviteSchema>;

const roleConfig = {
  manager: {
    label: 'Manager',
    description: 'Can manage buildings, assessments, and invite users',
    icon: Shield,
    color: 'bg-blue-100 text-blue-800',
  },
  assessor: {
    label: 'Assessor',
    description: 'Can perform building assessments',
    icon: Users,
    color: 'bg-green-100 text-green-800',
  },
};

export function TeamPage() {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'assessor',
      message: '',
    },
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      if (response.data.success) {
        // Filter users to only show those in the current user's organization
        const users = response.data.data.users
          .filter((u: any) => u.organization_id === user?.organization_id)
          .map((user: any): TeamMember => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || '',
            avatar: '',
            status: 'active',
            lastActive: 'Recently',
            joinedAt: user.created_at || user.createdAt,
            assessmentsCompleted: 0,
          }));
        setTeamMembers(users);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleInviteSubmit = async (data: InviteForm) => {
    try {
      const response = await usersAPI.invite({
        name: data.name,
        email: data.email,
        role: data.role,
      });

      if (response.data.success) {
        toast.success(`Invitation sent to ${data.email}`);
        setIsInviteDialogOpen(false);
        form.reset();
        // Refresh team members list
        fetchTeamMembers();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send invitation';
      toast.error(message);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    // In real app, this would call API to remove member
    console.log('Removing member:', memberId);
    toast.success(`${memberName} has been removed from the team`);
  };

  const handleRoleChange = (memberId: string, newRole: string, memberName: string) => {
    // In real app, this would call API to update member role
    console.log('Changing role for member:', memberId, 'to:', newRole);
    toast.success(`${memberName}'s role has been updated to ${roleConfig[newRole as keyof typeof roleConfig].label}`);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Management</h2>
          <p className="text-muted-foreground">
            Manage team members, roles, and permissions for your organization.
          </p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization. They'll receive an email with setup instructions.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleInviteSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="colleague@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(roleConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{config.label}</div>
                                  <div className="text-xs text-muted-foreground">{config.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Message (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Welcome to the team!" {...field} />
                      </FormControl>
                      <FormDescription>
                        Add a personal note to the invitation email
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Send Invitation</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {teamMembers.filter(m => m.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Full access members
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments This Month</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.reduce((sum, member) => sum + (member.assessmentsCompleted || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members and their access levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="assessor">Assessor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Members Table */}
      <Card>
        <CardContent className="p-0">
          {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Team Members Yet</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {searchTerm || selectedRole !== 'all'
                  ? 'No team members match your search criteria. Try adjusting your filters.'
                  : 'Start building your team by inviting managers and assessors to collaborate on building assessments.'}
              </p>
              {!searchTerm && selectedRole === 'all' && (
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Your First Team Member
                    </Button>
                  </DialogTrigger>
                </Dialog>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Assessments</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const roleInfo = roleConfig[member.role as keyof typeof roleConfig];
                  const IconComponent = roleInfo?.icon;

                  // Skip if role not found in roleConfig (e.g., admin users)
                  if (!roleInfo) return null;

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={roleInfo.color}>
                          <IconComponent className="mr-1 h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
                            {member.email}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="mr-2 h-3 w-3" />
                            {member.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.lastActive}
                      </TableCell>
                      <TableCell className="text-sm">
                        {member.assessmentsCompleted}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => console.log('View profile', member.id)}>
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => console.log('Send message', member.id)}>
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                            {Object.entries(roleConfig).map(([key, config]) => (
                              <DropdownMenuItem
                                key={key}
                                onClick={() => handleRoleChange(member.id, key, member.name)}
                                disabled={member.role === key}
                              >
                                <config.icon className="mr-2 h-4 w-4" />
                                {config.label}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              className="text-red-600"
                            >
                              Remove from Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
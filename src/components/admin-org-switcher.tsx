import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Building, ChevronDown, Shield } from 'lucide-react';
import { organizationsAPI } from '@/services/api';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  subscription_plan: string;
}

export function AdminOrgSwitcher() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationsAPI.getAll();
      if (response.data.success) {
        const orgs = response.data.data.organizations;
        setOrganizations(orgs);
        
        // Set current user's organization as selected by default
        const userOrg = orgs.find((org: Organization) => org.id === user.organization_id);
        if (userOrg) {
          setSelectedOrg(userOrg);
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgSwitch = (org: Organization) => {
    setSelectedOrg(org);
    toast.success(`Switched to ${org.name} context`);
    // In a real implementation, you might want to update the context
    // or reload certain data based on the selected organization
  };

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium">Admin Context</span>
        </div>
        <Badge variant="destructive" className="text-xs">
          Super Admin
        </Badge>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-auto p-2">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <div className="text-left">
                <div className="text-sm font-medium">
                  {selectedOrg?.name || 'Select Organization'}
                </div>
                {selectedOrg && (
                  <div className="text-xs text-muted-foreground">
                    {selectedOrg.subscription_plan} plan
                  </div>
                )}
              </div>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Switch Organization Context</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading ? (
            <DropdownMenuItem disabled>Loading organizations...</DropdownMenuItem>
          ) : (
            organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleOrgSwitch(org)}
                className={selectedOrg?.id === org.id ? 'bg-accent' : ''}
              >
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {org.subscription_plan} plan
                    </div>
                  </div>
                  {selectedOrg?.id === org.id && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground text-xs" disabled>
            Admin can view data from any organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
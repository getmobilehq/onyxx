import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Building } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useOrg } from '@/context/org-context';
import { toast } from 'sonner';

type Organization = {
  id: string;
  name: string;
  subscription: 'free' | 'professional' | 'enterprise';
  createdAt: string;
};

// Mock organizations - in real app, this would come from API
const mockOrganizations: Organization[] = [
  {
    id: '1',
    name: 'Acme Construction Corp',
    subscription: 'professional',
    createdAt: '2023-01-15T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'BuildTech Solutions',
    subscription: 'enterprise',
    createdAt: '2023-04-22T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Urban Development LLC',
    subscription: 'professional',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
];

export function OrgSwitcher() {
  const { currentOrg, setCurrentOrg } = useOrg();
  const [open, setOpen] = useState(false);
  const [showNewOrgDialog, setShowNewOrgDialog] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');

  // Find current organization from mock data
  const currentOrgData = mockOrganizations.find(org => org.id === currentOrg?.id) || mockOrganizations[0];

  const handleOrgSelect = (org: Organization) => {
    setCurrentOrg({
      id: org.id,
      name: org.name,
      subscription: org.subscription,
      createdAt: org.createdAt,
    });
    setOpen(false);
    toast.success(`Switched to ${org.name}`);
  };

  const handleCreateOrg = () => {
    if (!newOrgName.trim()) {
      toast.error('Organization name is required');
      return;
    }

    // In real app, this would make an API call
    const newOrg: Organization = {
      id: Date.now().toString(),
      name: newOrgName.trim(),
      subscription: 'professional',
      createdAt: new Date().toISOString(),
    };

    mockOrganizations.push(newOrg);
    
    setCurrentOrg(newOrg);

    toast.success(`Created and switched to ${newOrg.name}`);
    setShowNewOrgDialog(false);
    setNewOrgName('');
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select organization"
            className="w-[240px] justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              <Building className="h-4 w-4 shrink-0" />
              <span className="truncate">{currentOrgData?.name}</span>
            </div>
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandEmpty>No organizations found.</CommandEmpty>
              <CommandGroup heading="Organizations">
                {mockOrganizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    onSelect={() => handleOrgSelect(org)}
                    className="text-sm"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Building className="h-4 w-4" />
                      <div className="flex-1 truncate">
                        <div className="font-medium truncate">{org.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {org.subscription} • {new Date(org.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentOrgData?.id === org.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem onSelect={() => setShowNewOrgDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewOrgDialog} onOpenChange={setShowNewOrgDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization to manage buildings and assessments separately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Enter organization name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateOrg();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewOrgDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrg}>Create Organization</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
import { useState } from 'react';
import { Check, ChevronsUpDown, Building } from 'lucide-react';

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
// Dialog imports removed - organization creation not implemented
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

// Organizations now come from org context (real API data)

export function OrgSwitcher() {
  const { currentOrg, setCurrentOrg, organizations } = useOrg();
  const [open, setOpen] = useState(false);

  // Use current organization from context
  const currentOrgData = currentOrg;

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

  // Organization creation removed - not implemented in backend

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
                {organizations.map((org) => (
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
              {/* Organization creation not yet implemented */}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
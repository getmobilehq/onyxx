import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';

type Organization = {
  id: string;
  name: string;
  subscription: 'free' | 'professional' | 'enterprise';
  createdAt: string;
};

type OrgContextType = {
  currentOrg: Organization | null;
  setCurrentOrg: (org: Organization) => void;
  organizations: Organization[];
};

const OrgContext = createContext<OrgContextType | undefined>(undefined);

// Mock organizations
const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: '1',
    name: 'Acme Properties',
    subscription: 'professional',
    createdAt: '2023-01-15T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Evergreen Facilities',
    subscription: 'enterprise',
    createdAt: '2023-04-22T00:00:00.000Z',
  },
  {
    id: '3',
    name: 'Metro Building Group',
    subscription: 'free',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
];

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    if (user) {
      // In a real app, we would fetch organizations based on user's access
      // For this demo, we're using mock data
      const userOrgs = MOCK_ORGANIZATIONS;
      setOrganizations(userOrgs);
      
      // Set current org if not already set
      if (!currentOrg && userOrgs.length > 0) {
        const userOrgId = user.organizationId;
        const userOrg = userOrgs.find(org => org.id === userOrgId) || userOrgs[0];
        setCurrentOrg(userOrg);
      }
    } else {
      setCurrentOrg(null);
      setOrganizations([]);
    }
  }, [user, currentOrg]);

  return (
    <OrgContext.Provider value={{ currentOrg, setCurrentOrg, organizations }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
};
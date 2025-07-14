import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { organizationsAPI } from '@/services/api';
import { toast } from 'sonner';

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
  loading: boolean;
};

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (user) {
        setLoading(true);
        try {
          // Try to get current organization first
          const currentResponse = await organizationsAPI.getCurrent();
          if (currentResponse.data.success && currentResponse.data.data.organization) {
            setCurrentOrg(currentResponse.data.data.organization);
          }
          
          // Get all organizations user has access to
          const response = await organizationsAPI.getAll();
          if (response.data.success) {
            const orgs = response.data.data.organizations;
            setOrganizations(orgs);
            
            // If no current org set, use the first one
            if (!currentOrg && orgs.length > 0) {
              setCurrentOrg(orgs[0]);
            }
          }
        } catch (error: any) {
          console.error('Failed to fetch organizations:', error);
          // If API fails, keep empty state
          setOrganizations([]);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentOrg(null);
        setOrganizations([]);
      }
    };

    fetchOrganizations();
  }, [user]);

  return (
    <OrgContext.Provider value={{ currentOrg, setCurrentOrg, organizations, loading }}>
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
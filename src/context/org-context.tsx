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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (user) {
        setLoading(true);
        try {
          console.log('Fetching current organization...');
          // Try to get current organization first
          const currentResponse = await organizationsAPI.getCurrent();
          console.log('Organization response:', currentResponse.data);
          if (currentResponse.data.success && currentResponse.data.data.organization) {
            const orgData = currentResponse.data.data.organization;
            // Ensure the organization has the expected structure for the frontend
            const formattedOrg = {
              id: orgData.id,
              name: orgData.name,
              subscription: orgData.subscription?.plan || 'professional',
              createdAt: orgData.createdAt || orgData.created_at || new Date().toISOString(),
            };
            setCurrentOrg(formattedOrg);
            setOrganizations([formattedOrg]); // Set the current org in organizations list
          } else {
            // Fallback: create a default organization structure
            const fallbackOrg = {
              id: user.organization_id || 'default',
              name: user.organization_name || 'Default Organization',
              subscription: 'professional',
              createdAt: new Date().toISOString(),
            };
            setCurrentOrg(fallbackOrg);
            setOrganizations([fallbackOrg]);
          }
        } catch (error: any) {
          console.error('Failed to fetch organizations:', error);
          console.error('Error details:', error.response?.data);
          
          // Fallback: create a default organization structure from user data
          if (user.organization_id) {
            const fallbackOrg = {
              id: user.organization_id,
              name: user.organization_name || 'Default Organization',
              subscription: 'professional',
              createdAt: new Date().toISOString(),
            };
            setCurrentOrg(fallbackOrg);
            setOrganizations([fallbackOrg]);
          } else {
            setOrganizations([]);
            setCurrentOrg(null);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentOrg(null);
        setOrganizations([]);
        setLoading(false);
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
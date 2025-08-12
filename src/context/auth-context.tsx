import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authAPI } from '../services/api';
import { setUserContext, clearUserContext, trackUserAction } from '@/config/sentry';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'assessor';
  created_at?: string;
  organization_id?: string;
  organization_name?: string;
  is_organization_owner?: boolean;
  is_platform_admin?: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, tokenCode: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored tokens and get current user
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const response = await authAPI.getMe();
          if (response.data.success) {
            const user = response.data.data.user;
            setUser(user);
            
            // Set Sentry user context on initial load
            setUserContext({
              id: user.id,
              email: user.email,
              role: user.role,
              organization_id: user.organization_id,
            });
          }
        } catch (error) {
          // Token might be expired, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Set user in state
        setUser(user);
        
        // Set Sentry user context
        setUserContext({
          id: user.id,
          email: user.email,
          role: user.role,
          organization_id: user.organization_id,
        });
        
        // Track login event
        trackUserAction('login', 'authentication', {
          user_role: user.role,
          organization_id: user.organization_id,
        });
        
        toast.success('Login successful');
        
        // Navigate after a short delay to prevent flash
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    }
    
    // Track logout event
    trackUserAction('logout', 'authentication');
    
    // Clear Sentry user context
    clearUserContext();
    
    // Clear local state and storage
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    navigate('/login');
    toast.info('Logged out successfully');
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    tokenCode: string
  ) => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        name,
        email,
        password,
        token_code: tokenCode,
        role: 'admin' // Default to admin for new registrations
      });
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Set user in state
        setUser(user);
        
        // Set Sentry user context
        setUserContext({
          id: user.id,
          email: user.email,
          role: user.role,
          organization_id: user.organization_id,
        });
        
        // Track registration event
        trackUserAction('register', 'authentication', {
          user_role: user.role,
        });
        
        toast.success('Registration successful');
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
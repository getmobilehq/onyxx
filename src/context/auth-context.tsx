import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authAPI } from '../services/api';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'assessor';
  created_at?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, orgName?: string) => Promise<void>;
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
            setUser(response.data.data.user);
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
    setLoading(true);
    try {
      const response = await authAPI.login(email, password);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Set user in state
        setUser(user);
        
        toast.success('Login successful');
        navigate('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore logout errors
    }
    
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
    orgName?: string
  ) => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        name,
        email,
        password,
        role: 'admin' // Default to admin for new registrations
      });
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        // Store tokens
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Set user in state
        setUser(user);
        
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
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
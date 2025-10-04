import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth-context';
import { authAPI } from '@/services/api';

// Mock the API module used by the auth context
vi.mock('@/services/api', () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
  }
}));

// Mock Sentry helpers to avoid side effects during tests
vi.mock('@/config/sentry', () => ({
  setUserContext: vi.fn(),
  clearUserContext: vi.fn(),
  trackUserAction: vi.fn(),
}));

// Mock toast notifications to keep console noise down
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, login, logout, register } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="user-email">{user?.email || 'No user'}</div>
      <button onClick={() => login('test@example.com', 'password').catch(() => undefined)}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => register('Test User', 'test@example.com', 'password', 'ONX-TEST-1234').catch(() => undefined)}>
        Register
      </button>
    </div>
  );
}

describe('AuthContext', () => {
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  vi.mocked(authAPI.getMe).mockResolvedValue({ data: { success: false } } as any);
  vi.mocked(authAPI.logout).mockResolvedValue({} as any);
});

  it('provides authentication context to children', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
  });

  it('handles successful login', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
            organization_id: 'org-1',
          },
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        },
      },
    };

    vi.mocked(authAPI.login).mockResolvedValueOnce(mockResponse as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'access-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('refreshToken', 'refresh-token');
  });

  it('handles failed login', async () => {
    vi.mocked(authAPI.login).mockRejectedValueOnce({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('No user');
    });
  });

  it('handles logout', async () => {
    // Setup authenticated state
    const mockResponse = {
      data: {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
            organization_id: 'org-1',
          },
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        },
      },
    };

    vi.mocked(authAPI.login).mockResolvedValueOnce(mockResponse as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    // Login first
    const loginButton = screen.getByText('Login');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    // Then logout
    const logoutButton = screen.getByText('Logout');
    await userEvent.click(logoutButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
  });

  it('handles registration with token', async () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'admin',
            organization_id: 'org-1',
          },
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        },
      },
    };

    vi.mocked(authAPI.register).mockResolvedValueOnce(mockResponse as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    const registerButton = screen.getByText('Register');
    await userEvent.click(registerButton);

    await waitFor(() => {
      expect(authAPI.register).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password',
        organization_name: 'ONX-TEST-1234',
        role: 'admin',
      });
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
  });

  it('loads user from localStorage on mount', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'accessToken') return 'stored-token';
      return null;
    });

    vi.mocked(authAPI.getMe).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'stored@example.com',
            name: 'Stored User',
            role: 'admin',
          },
        },
      },
    } as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('stored@example.com');
    });
  });
});

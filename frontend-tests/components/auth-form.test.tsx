import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthForm from '@/components/auth-form';

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock auth context
const mockLogin = jest.fn();
const mockRegister = jest.fn();
jest.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
    loading: false,
    error: null,
  }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const AuthFormWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

describe('AuthForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Mode', () => {
    it('renders login form correctly', () => {
      render(
        <AuthFormWrapper>
          <AuthForm mode="login" />
        </AuthFormWrapper>
      );

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('submits login form with valid data', async () => {
      mockLogin.mockResolvedValueOnce({ success: true });

      render(
        <AuthFormWrapper>
          <AuthForm mode="login" />
        </AuthFormWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('shows validation errors for empty fields', async () => {
      render(
        <AuthFormWrapper>
          <AuthForm mode="login" />
        </AuthFormWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('shows validation error for invalid email', async () => {
      render(
        <AuthFormWrapper>
          <AuthForm mode="login" />
        </AuthFormWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });
  });

  describe('Register Mode', () => {
    it('renders register form correctly', () => {
      render(
        <AuthFormWrapper>
          <AuthForm mode="register" />
        </AuthFormWrapper>
      );

      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('submits register form with valid data', async () => {
      mockRegister.mockResolvedValueOnce({ success: true });

      render(
        <AuthFormWrapper>
          <AuthForm mode="register" />
        </AuthFormWrapper>
      );

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const roleSelect = screen.getByLabelText(/role/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(roleSelect, { target: { value: 'assessor' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'assessor',
        });
      });
    });

    it('shows validation error for short password', async () => {
      render(
        <AuthFormWrapper>
          <AuthForm mode="register" />
        </AuthFormWrapper>
      );

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Switching', () => {
    it('switches from login to register mode', () => {
      render(
        <AuthFormWrapper>
          <AuthForm mode="login" />
        </AuthFormWrapper>
      );

      const switchLink = screen.getByText(/don't have an account/i);
      fireEvent.click(switchLink);

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('switches from register to login mode', () => {
      render(
        <AuthFormWrapper>
          <AuthForm mode="register" />
        </AuthFormWrapper>
      );

      const switchLink = screen.getByText(/already have an account/i);
      fireEvent.click(switchLink);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
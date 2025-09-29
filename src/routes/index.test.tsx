import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { AppRoutes } from './index';
import { useAuth } from '@/context/auth-context';

type MockAuthValue = {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'assessor';
    is_platform_admin?: boolean;
  } | null;
  loading: boolean;
  isFirstLogin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, organizationName: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearFirstLogin: () => void;
};

vi.mock('@/context/auth-context', async () => {
  const actual = await vi.importActual<typeof import('@/context/auth-context')>('@/context/auth-context');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

vi.mock('@/layouts/dashboard-layout', () => ({
  DashboardLayout: () => (
    <div data-testid="mock-dashboard-layout">
      <Outlet />
    </div>
  ),
}));

vi.mock('@/pages/admin/dashboard', () => ({
  AdminDashboard: () => <div>Admin Dashboard</div>,
}));

const mockUseAuth = vi.mocked(useAuth);

const createAuthValue = (overrides: Partial<MockAuthValue> = {}): MockAuthValue => ({
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'manager',
    is_platform_admin: false,
  },
  loading: false,
  isFirstLogin: false,
  login: vi.fn(async (_email: string, _password: string) => {}),
  logout: vi.fn(() => {}),
  register: vi.fn(async (_name: string, _email: string, _password: string, _organizationName: string) => {}),
  refreshUser: vi.fn(async () => {}),
  clearFirstLogin: vi.fn(() => {}),
  ...overrides,
});

describe('AppRoutes admin protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(createAuthValue());
  });

  it('renders forbidden page for non-admin users accessing admin dashboard', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText('Access Denied')).toBeInTheDocument();
    expect(
      screen.getByText(
        "You don't have permission to access this page. Please contact your administrator if you believe this is a mistake."
      )
    ).toBeInTheDocument();
  });
});

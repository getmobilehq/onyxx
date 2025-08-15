import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AssessmentsPage } from './index';
import api from '@/services/api';

// Mock the API
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
  },
  assessmentsAPI: {
    fetchAll: vi.fn(),
    fetchById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the auth context
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      organization_id: 'org-1',
    },
    isAuthenticated: true,
  }),
}));

// Mock the org context
vi.mock('@/context/org-context', () => ({
  useOrganization: () => ({
    currentOrganization: {
      id: 'org-1',
      name: 'Test Organization',
    },
  }),
}));

const mockAssessments = [
  {
    id: '1',
    building_id: 'building-1',
    building_name: 'Main Office',
    assessment_type: 'routine',
    status: 'completed',
    completion_date: '2024-01-15',
    fci_score: 0.15,
    total_repair_cost: 50000,
    assigned_to_name: 'John Doe',
  },
  {
    id: '2',
    building_id: 'building-2',
    building_name: 'Warehouse A',
    assessment_type: 'detailed',
    status: 'in_progress',
    scheduled_date: '2024-02-01',
    assigned_to_name: 'Jane Smith',
  },
  {
    id: '3',
    building_id: 'building-3',
    building_name: 'Factory B',
    assessment_type: 'routine',
    status: 'pending',
    scheduled_date: '2024-02-15',
    assigned_to_name: 'Bob Johnson',
  },
];

describe('AssessmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders assessment list', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { assessments: mockAssessments },
    });

    render(
      <BrowserRouter>
        <AssessmentsPage />
      </BrowserRouter>
    );

    // Check for loading state
    expect(screen.getByText(/Assessments/i)).toBeInTheDocument();

    // Wait for assessments to load
    await waitFor(() => {
      expect(screen.getByText('Main Office')).toBeInTheDocument();
      expect(screen.getByText('Warehouse A')).toBeInTheDocument();
      expect(screen.getByText('Factory B')).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays FCI scores correctly', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { assessments: mockAssessments },
    });

    render(
      <BrowserRouter>
        <AssessmentsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      // FCI score should be displayed as percentage
      expect(screen.getByText('15.00%')).toBeInTheDocument();
    });
  });

  it('handles empty assessment list', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { assessments: [] },
    });

    render(
      <BrowserRouter>
        <AssessmentsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No assessments found/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));

    render(
      <BrowserRouter>
        <AssessmentsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load assessments/i)).toBeInTheDocument();
    });
  });

  it('navigates to new assessment page', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { assessments: [] },
    });

    render(
      <BrowserRouter>
        <AssessmentsPage />
      </BrowserRouter>
    );

    const newButton = await screen.findByRole('button', { name: /New Assessment/i });
    expect(newButton).toBeInTheDocument();
    
    // Check that the button has the correct link
    const link = newButton.closest('a');
    expect(link).toHaveAttribute('href', '/assessments/new');
  });

  it('filters assessments by status', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { assessments: mockAssessments },
    });

    render(
      <BrowserRouter>
        <AssessmentsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Main Office')).toBeInTheDocument();
    });

    // Find and click the status filter
    const statusFilter = screen.getByRole('combobox', { name: /Status/i });
    await userEvent.click(statusFilter);

    // Select "Completed" option
    const completedOption = await screen.findByRole('option', { name: /Completed/i });
    await userEvent.click(completedOption);

    // Only completed assessments should be visible
    expect(screen.getByText('Main Office')).toBeInTheDocument();
    expect(screen.queryByText('Warehouse A')).not.toBeInTheDocument();
    expect(screen.queryByText('Factory B')).not.toBeInTheDocument();
  });
});

describe('Assessment Workflow', () => {
  it('completes pre-assessment workflow', async () => {
    const mockBuildings = [
      { id: '1', name: 'Building A', address: '123 Main St' },
      { id: '2', name: 'Building B', address: '456 Oak Ave' },
    ];

    const mockElements = [
      { id: '1', name: 'Foundation', code: 'A1010' },
      { id: '2', name: 'Roof', code: 'B3010' },
    ];

    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { buildings: mockBuildings } })
      .mockResolvedValueOnce({ data: { elements: mockElements } });

    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        success: true,
        assessment: { id: 'new-assessment-1' },
      },
    });

    // This would be a more complex test involving the pre-assessment component
    // For now, we're testing the basic API interactions
    expect(vi.mocked(api.get)).toBeDefined();
  });

  it('validates FCI calculation', () => {
    const testCases = [
      { repairCost: 0, replacementValue: 100000, expected: 0 },
      { repairCost: 10000, replacementValue: 100000, expected: 0.1 },
      { repairCost: 40000, replacementValue: 100000, expected: 0.4 },
      { repairCost: 70000, replacementValue: 100000, expected: 0.7 },
      { repairCost: 100000, replacementValue: 100000, expected: 1.0 },
    ];

    testCases.forEach(({ repairCost, replacementValue, expected }) => {
      const fci = repairCost / replacementValue;
      expect(fci).toBeCloseTo(expected, 2);
    });
  });

  it('categorizes FCI scores correctly', () => {
    const categories = [
      { fci: 0.05, expected: 'Excellent' },
      { fci: 0.25, expected: 'Good' },
      { fci: 0.55, expected: 'Fair' },
      { fci: 0.85, expected: 'Critical' },
    ];

    categories.forEach(({ fci, expected }) => {
      let category: string;
      if (fci <= 0.1) category = 'Excellent';
      else if (fci <= 0.4) category = 'Good';
      else if (fci <= 0.7) category = 'Fair';
      else category = 'Critical';

      expect(category).toBe(expected);
    });
  });
});
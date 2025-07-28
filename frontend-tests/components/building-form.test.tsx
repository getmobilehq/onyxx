import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BuildingForm from '@/components/building-form';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock buildings hook
const mockCreateBuilding = jest.fn();
const mockUpdateBuilding = jest.fn();
jest.mock('@/hooks/use-buildings', () => ({
  useBuildings: () => ({
    createBuilding: mockCreateBuilding,
    updateBuilding: mockUpdateBuilding,
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

const BuildingFormWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </QueryClientProvider>
);

const mockBuilding = {
  id: 'building-1',
  name: 'Test Building',
  type: 'Office',
  construction_type: 'Steel Frame',
  year_built: 2020,
  square_footage: 50000,
  state: 'California',
  city: 'San Francisco',
  zip_code: '94105',
  street_address: '123 Test Street',
  cost_per_sqft: 300,
  status: 'active'
};

describe('BuildingForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form correctly', () => {
      render(
        <BuildingFormWrapper>
          <BuildingForm mode="create" />
        </BuildingFormWrapper>
      );

      expect(screen.getByText('Add New Building')).toBeInTheDocument();
      expect(screen.getByLabelText(/building name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/building type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/year built/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/square footage/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create building/i })).toBeInTheDocument();
    });

    it('submits create form with valid data', async () => {
      mockCreateBuilding.mockResolvedValueOnce({ success: true, data: mockBuilding });

      render(
        <BuildingFormWrapper>
          <BuildingForm mode="create" />
        </BuildingFormWrapper>
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/building name/i), {
        target: { value: 'Test Building' }
      });
      fireEvent.change(screen.getByLabelText(/building type/i), {
        target: { value: 'Office' }
      });
      fireEvent.change(screen.getByLabelText(/year built/i), {
        target: { value: '2020' }
      });
      fireEvent.change(screen.getByLabelText(/square footage/i), {
        target: { value: '50000' }
      });
      fireEvent.change(screen.getByLabelText(/city/i), {
        target: { value: 'San Francisco' }
      });
      fireEvent.change(screen.getByLabelText(/state/i), {
        target: { value: 'California' }
      });

      const submitButton = screen.getByRole('button', { name: /create building/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockCreateBuilding).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Building',
            type: 'Office',
            year_built: 2020,
            square_footage: 50000,
            city: 'San Francisco',
            state: 'California',
          })
        );
      });
    });

    it('shows validation errors for required fields', async () => {
      render(
        <BuildingFormWrapper>
          <BuildingForm mode="create" />
        </BuildingFormWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /create building/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/building name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/building type is required/i)).toBeInTheDocument();
      });

      expect(mockCreateBuilding).not.toHaveBeenCalled();
    });

    it('validates year built range', async () => {
      render(
        <BuildingFormWrapper>
          <BuildingForm mode="create" />
        </BuildingFormWrapper>
      );

      fireEvent.change(screen.getByLabelText(/year built/i), {
        target: { value: '1800' }
      });

      const submitButton = screen.getByRole('button', { name: /create building/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/year must be between 1850 and/i)).toBeInTheDocument();
      });
    });

    it('validates square footage is positive', async () => {
      render(
        <BuildingFormWrapper>
          <BuildingForm mode="create" />
        </BuildingFormWrapper>
      );

      fireEvent.change(screen.getByLabelText(/square footage/i), {
        target: { value: '-1000' }
      });

      const submitButton = screen.getByRole('button', { name: /create building/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/square footage must be positive/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('renders edit form with pre-filled data', () => {
      render(
        <BuildingFormWrapper>
          <BuildingForm mode="edit" building={mockBuilding} />
        </BuildingFormWrapper>
      );

      expect(screen.getByText('Edit Building')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Building')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Office')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2020')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50000')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update building/i })).toBeInTheDocument();
    });

    it('submits edit form with updated data', async () => {
      mockUpdateBuilding.mockResolvedValueOnce({ success: true, data: mockBuilding });

      render(
        <BuildingFormWrapper>
          <BuildingForm mode="edit" building={mockBuilding} />
        </BuildingFormWrapper>
      );

      // Change the building name
      const nameInput = screen.getByDisplayValue('Test Building');
      fireEvent.change(nameInput, { target: { value: 'Updated Building Name' } });

      const submitButton = screen.getByRole('button', { name: /update building/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateBuilding).toHaveBeenCalledWith(
          mockBuilding.id,
          expect.objectContaining({
            name: 'Updated Building Name',
          })
        );
      });
    });
  });

  describe('Form Actions', () => {
    it('navigates back when cancel button is clicked', () => {
      render(
        <BuildingFormWrapper>
          <BuildingForm mode="create" />
        </BuildingFormWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/buildings');
    });

    it('shows loading state during submission', async () => {
      // Mock a delayed response
      mockCreateBuilding.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <BuildingFormWrapper>
          <BuildingForm mode="create" />
        </BuildingFormWrapper>
      );

      // Fill required fields and submit
      fireEvent.change(screen.getByLabelText(/building name/i), {
        target: { value: 'Test Building' }
      });
      fireEvent.change(screen.getByLabelText(/building type/i), {
        target: { value: 'Office' }
      });

      const submitButton = screen.getByRole('button', { name: /create building/i });
      fireEvent.click(submitButton);

      // Check for loading state
      expect(screen.getByText(/creating.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Building Type Selection', () => {
    it('shows building type options', () => {
      render(
        <BuildingFormWrapper>
          <BuildingForm mode="create" />
        </BuildingFormWrapper>
      );

      const typeSelect = screen.getByLabelText(/building type/i);
      fireEvent.click(typeSelect);

      expect(screen.getByText('Office')).toBeInTheDocument();
      expect(screen.getByText('Retail')).toBeInTheDocument();
      expect(screen.getByText('Industrial')).toBeInTheDocument();
      expect(screen.getByText('Educational')).toBeInTheDocument();
      expect(screen.getByText('Healthcare')).toBeInTheDocument();
    });
  });
});
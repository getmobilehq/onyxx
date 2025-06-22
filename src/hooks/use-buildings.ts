import { useState, useEffect } from 'react';
import { buildingsAPI } from '@/services/api';
import { toast } from 'sonner';

// For now, we'll still use mock data but with the API structure ready
const MOCK_BUILDINGS = [
  {
    id: '1',
    name: 'Oak Tower Office Complex',
    type: 'Office Building',
    year_built: 2010,
    square_footage: 150000,
    street_address: '123 Business Ave',
    city: 'Downtown',
    state: 'NY',
    zip_code: '10001',
    cost_per_sqft: 300,
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
    status: 'assessed',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Riverside Apartments',
    type: 'Residential Complex',
    year_built: 2015,
    square_footage: 200000,
    street_address: '456 River Road',
    city: 'Riverside',
    state: 'CA',
    zip_code: '92501',
    cost_per_sqft: 200,
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
    status: 'assessed',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z'
  },
  {
    id: '3',
    name: 'Central Mall',
    type: 'Retail',
    year_built: 2005,
    square_footage: 500000,
    street_address: '789 Shopping Blvd',
    city: 'Commerce City',
    state: 'TX',
    zip_code: '75001',
    cost_per_sqft: 300,
    image_url: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6',
    status: 'assessed',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z'
  },
  {
    id: '4',
    name: 'Tech Campus Building A',
    type: 'Office Building',
    year_built: 2018,
    square_footage: 180000,
    street_address: '321 Innovation Way',
    city: 'Tech Valley',
    state: 'CA',
    zip_code: '94025',
    cost_per_sqft: 400,
    image_url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
    status: 'pending',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z'
  },
  {
    id: '5',
    name: 'Memorial Hospital - East Wing',
    type: 'Healthcare',
    year_built: 2012,
    square_footage: 120000,
    street_address: '555 Health Center Dr',
    city: 'Medical District',
    state: 'IL',
    zip_code: '60601',
    cost_per_sqft: 750,
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d',
    status: 'assessed',
    created_at: '2023-12-15T00:00:00Z',
    updated_at: '2023-12-15T00:00:00Z'
  },
  {
    id: '6',
    name: 'Greenfield Elementary School',
    type: 'Educational',
    year_built: 1998,
    square_footage: 80000,
    street_address: '100 Education Lane',
    city: 'Greenfield',
    state: 'OH',
    zip_code: '43301',
    cost_per_sqft: 400,
    image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b',
    status: 'assessed',
    created_at: '2024-02-28T00:00:00Z',
    updated_at: '2024-02-28T00:00:00Z'
  },
  {
    id: '7',
    name: 'Northside Warehouse',
    type: 'Industrial',
    year_built: 2008,
    square_footage: 250000,
    street_address: '2000 Industrial Pkwy',
    city: 'North District',
    state: 'MI',
    zip_code: '48201',
    cost_per_sqft: 200,
    image_url: 'https://images.unsplash.com/photo-1553413077-190dd305871c',
    status: 'pending',
    created_at: '2024-01-25T00:00:00Z',
    updated_at: '2024-01-25T00:00:00Z'
  },
  {
    id: '8',
    name: 'City Hall',
    type: 'Government',
    year_built: 1985,
    square_footage: 100000,
    street_address: '1 Civic Center Plaza',
    city: 'Metro City',
    state: 'FL',
    zip_code: '33101',
    cost_per_sqft: 400,
    image_url: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b',
    status: 'assessed',
    created_at: '2023-11-30T00:00:00Z',
    updated_at: '2023-11-30T00:00:00Z'
  }
];

export function useBuildings() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBuildings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await buildingsAPI.getAll();
      if (response.data.success) {
        setBuildings(response.data.data.buildings);
      } else {
        throw new Error('Failed to fetch buildings');
      }
    } catch (err: any) {
      // Fallback to mock data if API fails
      console.warn('API call failed, using mock data:', err.message);
      setBuildings(MOCK_BUILDINGS);
      setError(err.response?.data?.message || 'Failed to fetch buildings');
    } finally {
      setLoading(false);
    }
  };

  const getBuilding = async (id: string) => {
    try {
      const response = await buildingsAPI.getById(id);
      if (response.data.success && response.data.data.building) {
        return response.data.data.building;
      } else {
        throw new Error('Building not found');
      }
    } catch (err: any) {
      // Fallback to finding in current buildings array
      const building = buildings.find(b => b.id === id);
      if (building) {
        return building;
      }
      
      toast.error('Failed to load building details');
      throw err;
    }
  };

  const createBuilding = async (data: any) => {
    try {
      const response = await buildingsAPI.create(data);
      if (response.data.success) {
        await fetchBuildings(); // Refresh the list
        toast.success('Building created successfully');
        return response.data.data.building;
      } else {
        throw new Error('Failed to create building');
      }
    } catch (err: any) {
      toast.error('Failed to create building');
      throw err;
    }
  };

  const updateBuilding = async (id: string, data: any) => {
    try {
      const response = await buildingsAPI.update(id, data);
      if (response.data.success) {
        await fetchBuildings(); // Refresh the list
        toast.success('Building updated successfully');
        return response.data.data.building;
      } else {
        throw new Error('Failed to update building');
      }
    } catch (err: any) {
      toast.error('Failed to update building');
      throw err;
    }
  };

  const deleteBuilding = async (id: string) => {
    try {
      const response = await buildingsAPI.delete(id);
      if (response.data.success) {
        await fetchBuildings(); // Refresh the list
        toast.success('Building deleted successfully');
      } else {
        throw new Error('Failed to delete building');
      }
    } catch (err: any) {
      toast.error('Failed to delete building');
      throw err;
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  return {
    buildings,
    loading,
    error,
    fetchBuildings,
    getBuilding,
    createBuilding,
    updateBuilding,
    deleteBuilding,
  };
}
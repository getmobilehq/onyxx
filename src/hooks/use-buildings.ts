import { useState, useEffect, useCallback } from 'react';
import { buildingsAPI } from '@/services/api';
import { toast } from 'sonner';

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
      console.error('Failed to fetch buildings:', err);
      setError(err.response?.data?.message || 'Failed to fetch buildings');
      toast.error('Failed to load buildings');
    } finally {
      setLoading(false);
    }
  };

  const getBuilding = useCallback(async (id: string) => {
    try {
      const response = await buildingsAPI.getById(id);
      if (response.data.success && response.data.data.building) {
        return response.data.data.building;
      } else {
        throw new Error('Building not found');
      }
    } catch (err: any) {
      toast.error('Failed to load building details');
      throw err;
    }
  }, []);

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
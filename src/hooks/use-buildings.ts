import { useState, useEffect, useCallback } from 'react';
import { buildingsAPI } from '@/services/api';
import { toast } from 'sonner';

export function useBuildings() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBuildings = async () => {
    console.log('🏢 useBuildings: Starting fetchBuildings...');
    setLoading(true);
    setError(null);
    
    try {
      console.log('🏢 useBuildings: Calling buildingsAPI.getAll()...');
      const response = await buildingsAPI.getAll();
      console.log('🏢 useBuildings: API response received:', response?.data);
      
      if (response.data.success) {
        console.log('🏢 useBuildings: Setting buildings:', response.data.data.buildings?.length || 0, 'buildings');
        setBuildings(response.data.data.buildings);
      } else {
        console.error('🏢 useBuildings: API returned success=false');
        throw new Error('Failed to fetch buildings');
      }
    } catch (err: any) {
      console.error('🏢 useBuildings: Error in fetchBuildings:', err);
      setError(err.response?.data?.message || 'Failed to fetch buildings');
      toast.error('Failed to load buildings');
    } finally {
      console.log('🏢 useBuildings: fetchBuildings completed');
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
    console.log('🏢 useBuildings: useEffect triggered, calling fetchBuildings...');
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
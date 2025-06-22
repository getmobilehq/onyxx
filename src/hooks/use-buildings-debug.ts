import { useState, useEffect } from 'react';
import { buildingsAPI } from '@/services/api';
import { toast } from 'sonner';

export function useBuildingsDebug() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('');

  const fetchBuildings = async () => {
    setLoading(true);
    setError(null);
    setApiStatus('Starting API call...');
    
    try {
      console.log('🔵 Calling API:', buildingsAPI.getAll.toString());
      console.log('🔵 API Base URL:', import.meta.env.VITE_API_URL);
      
      const response = await buildingsAPI.getAll();
      console.log('✅ API Response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📦 Response data.data:', response.data.data);
      console.log('📦 Buildings array:', response.data.data?.buildings);
      
      if (response.data.success) {
        const buildingsArray = response.data.data?.buildings || [];
        console.log('🏢 Setting buildings:', buildingsArray);
        
        // Log first building details
        if (buildingsArray.length > 0) {
          console.log('🏢 First building details:', buildingsArray[0]);
          console.log('🏢 Building properties:', Object.keys(buildingsArray[0]));
        }
        
        setBuildings(buildingsArray);
        setApiStatus(`✅ API call successful! Found ${buildingsArray.length} buildings`);
        toast.success(`Buildings loaded from API: ${buildingsArray.length} found`);
      } else {
        throw new Error('Failed to fetch buildings');
      }
    } catch (err: any) {
      console.error('❌ API Error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response,
        request: err.request,
        config: err.config
      });
      
      setApiStatus(`❌ API failed: ${err.message}`);
      setError(err.response?.data?.message || err.message || 'Failed to fetch buildings');
      toast.error(`API Error: ${err.message}`);
      
      // Don't fall back to mock data - let's see the actual error
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  return {
    buildings,
    loading,
    error,
    apiStatus,
    fetchBuildings,
  };
}
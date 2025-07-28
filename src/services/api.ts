import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API base URL - can be configured via environment variables
// Production API with auto-fallback to local development
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:5001/api' : 'https://onyxx.onrender.com/api');

// Debug: Log the API URL being used
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔧 Environment Variables:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV
});

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const tokenManager = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenManager.getRefreshToken();

      if (!refreshToken) {
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        
        tokenManager.setTokens(accessToken, newRefreshToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
    
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'manager' | 'assessor';
  }) => api.post('/auth/register', data),
  
  logout: () => {
    tokenManager.clearTokens();
    return Promise.resolve();
  },
  
  getMe: () => api.get('/auth/me'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

export const buildingsAPI = {
  getAll: () => api.get('/buildings'),
  getById: (id: string) => api.get(`/buildings/${id}`),
  create: (data: any) => api.post('/buildings', data),
  update: (id: string, data: any) => api.put(`/buildings/${id}`, data),
  delete: (id: string) => api.delete(`/buildings/${id}`),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/buildings/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const assessmentsAPI = {
  getAll: (params?: { building_id?: string; type?: string; status?: string; assigned_to?: string; limit?: number; offset?: number }) => 
    api.get('/assessments', { params }),
  getById: (id: string) => api.get(`/assessments/${id}`),
  create: (data: {
    building_id: string;
    type: 'pre_assessment' | 'field_assessment';
    description?: string;
    scheduled_date?: string;
    assigned_to_user_id?: string;
  }) => api.post('/assessments', data),
  update: (id: string, data: any) => api.put(`/assessments/${id}`, data),
  delete: (id: string) => api.delete(`/assessments/${id}`),
  getElements: (id: string, major_group?: string) => 
    api.get(`/assessments/${id}/elements`, { params: { major_group } }),
  updateElement: (assessmentId: string, elementId: string, data: {
    condition_rating?: number;
    notes?: string;
    photo_urls?: string[];
    deficiencies?: Array<{
      description: string;
      cost: number;
      category: string;
      photos?: any[];
    }>;
  }) => api.put(`/assessments/${assessmentId}/elements/${elementId}`, data),
  saveElements: (assessmentId: string, elements: Array<{
    element_id: string;
    condition_rating: number;
    notes?: string;
    photo_urls?: string[];
    deficiencies?: Array<{
      description: string;
      cost: number;
      category: string;
      photos?: any[];
    }>;
  }>) => api.post(`/assessments/${assessmentId}/elements`, { elements }),
  calculateFCI: (assessmentId: string) => 
    api.get(`/assessments/${assessmentId}/calculate-fci`),
  completeAssessment: (assessmentId: string) => 
    api.post(`/assessments/${assessmentId}/complete`),
};

export const elementsAPI = {
  getAll: (params?: { major_group?: string; search?: string }) => 
    api.get('/elements', { params }),
  getById: (id: string) => api.get(`/elements/${id}`),
  seed: () => api.post('/elements/seed'),
};

export const reportsAPI = {
  getAll: (params?: { 
    building_id?: string; 
    status?: string; 
    report_type?: string; 
    assessor?: string; 
    search?: string;
    limit?: number; 
    offset?: number; 
  }) => api.get('/reports', { params }),
  getById: (id: string) => api.get(`/reports/${id}`),
  create: (data: {
    assessment_id?: string;
    building_id: string;
    title: string;
    description?: string;
    report_type?: 'facility_condition' | 'maintenance_plan' | 'capital_assessment';
    status?: 'draft' | 'published' | 'archived';
    assessment_date?: string;
    assessor_name?: string;
    fci_score?: number;
    total_repair_cost?: number;
    replacement_value?: number;
    immediate_repair_cost?: number;
    short_term_repair_cost?: number;
    long_term_repair_cost?: number;
    element_count?: number;
    deficiency_count?: number;
    executive_summary?: string;
    recommendations?: any[];
    systems_data?: any;
  }) => api.post('/reports', data),
  update: (id: string, data: any) => api.put(`/reports/${id}`, data),
  delete: (id: string) => api.delete(`/reports/${id}`),
  generateFromAssessment: (assessmentId: string) => api.post(`/reports/generate/${assessmentId}`),
  getByBuildingId: (buildingId: string) => api.get('/reports', { params: { building_id: buildingId } }),
  download: (id: string) => api.get(`/reports/${id}/download`, { responseType: 'blob' }),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  invite: (data: { email: string; role: string; name: string }) =>
    api.post('/users/invite', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const referenceAPI = {
  getBuildingCosts: () => api.get('/reference/building-costs'),
  getElements: () => api.get('/reference/elements'),
};

export const organizationsAPI = {
  getAll: () => api.get('/organizations'),
  getById: (id: string) => api.get(`/organizations/${id}`),
  getCurrent: () => api.get('/organizations/current'),
  create: (data: { name: string; subscription?: string }) => api.post('/organizations', data),
  update: (id: string, data: any) => api.put(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
};

export const analyticsAPI = {
  getSummary: (params?: { timeRange?: string }) => api.get('/analytics/summary', { params }),
  getBuildingAnalytics: () => api.get('/analytics/buildings'),
  getFCICorrelation: () => api.get('/analytics/fci-correlation'),
  getCostTrends: (params?: { timeRange?: string }) => api.get('/analytics/cost-trends', { params }),
  getEfficiency: () => api.get('/analytics/efficiency'),
};

export default api;
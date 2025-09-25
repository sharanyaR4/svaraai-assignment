import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    
    if (error.response?.status === 401) {
      Cookies.remove('token');
      Cookies.remove('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Don't show toast for certain requests
    const silentEndpoints = ['/api/auth/me'];
    const shouldShowToast = !silentEndpoints.some(endpoint => 
      error.config?.url?.includes(endpoint)
    );
    
    if (shouldShowToast) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// API functions
export const authAPI = {
  login: (data: any) => api.post('/api/auth/login', data),
  register: (data: any) => api.post('/api/auth/register', data),
  getCurrentUser: () => api.get('/api/auth/me'),
  updateProfile: (data: any) => api.put('/api/auth/profile', data),
  changePassword: (data: any) => api.put('/api/auth/change-password', data),
  logout: () => api.post('/api/auth/logout'),
};

export const projectAPI = {
  getProjects: (params?: any) => api.get('/api/projects', { params }),
  getProject: (id: string) => api.get(`/api/projects/${id}`),
  createProject: (data: any) => api.post('/api/projects', data),
  updateProject: (id: string, data: any) => api.put(`/api/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/api/projects/${id}`),
  getProjectStats: () => api.get('/api/projects/stats'),
  getRecentProjects: (limit?: number) => api.get('/api/projects/recent', { params: { limit } }),
  getProjectWithTasks: (id: string) => api.get(`/api/projects/${id}/with-tasks`),
};

export const taskAPI = {
  getTasks: (params?: any) => api.get('/api/tasks/my-tasks', { params }),
  getTask: (id: string) => api.get(`/api/tasks/${id}`),
  createTask: (data: any) => api.post('/api/tasks', data),
  updateTask: (id: string, data: any) => api.put(`/api/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/api/tasks/${id}`),
  updateTaskStatus: (id: string, status: string) => 
    api.patch(`/api/tasks/${id}/status`, { status }),
  moveTask: (id: string, status: string, position?: number) =>
    api.patch(`/api/tasks/${id}/move`, { status, position }),
  getTaskStats: () => api.get('/api/tasks/stats'),
  getUpcomingTasks: (days?: number) => api.get('/api/tasks/upcoming', { params: { days } }),
  getProjectTasks: (projectId: string, params?: any) => 
    api.get(`/api/tasks/project/${projectId}`, { params }),
  getKanbanBoard: (projectId: string) => 
    api.get(`/api/tasks/project/${projectId}/kanban`),
};
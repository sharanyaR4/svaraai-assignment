export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  color: string;
  endDate?: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  projectId: Project;
  assignedTo: string;
  createdBy: string;
  tags: string[];
  estimatedHours: number;
  position?: number;
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  errors?: any[];
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  projectsByStatus: { status: string; count: number }[];
  projectsByPriority: { priority: string; count: number }[];
}

export interface TaskStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
}

export interface KanbanBoard {
  project: Project;
  columns: {
    todo: KanbanColumn;
    'in-progress': KanbanColumn;
    done: KanbanColumn;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface CreateProjectData {
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  endDate?: string;
  color: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  projectId: string;
  tags?: string[];
  estimatedHours?: number;
}
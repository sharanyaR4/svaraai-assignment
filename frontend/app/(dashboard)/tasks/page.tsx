'use client';

import { useState } from 'react';
import { CheckSquare, Plus, Search, Calendar, Clock, AlertCircle, FolderOpen } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { TaskForm } from '@/components/forms/task-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate, debounce } from '@/lib/utils';
import { taskAPI, projectAPI } from '@/lib/api';
import { Task, Project } from '@/types';
import toast from 'react-hot-toast';

export default function TasksPage() {
  const router = useRouter();
  
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchInput, setSearchInput] = useState(''); // Add separate state for input
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  
  const queryClient = useQueryClient();

  // Fetch all projects for the form and filtering
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getProjects({ limit: 100 }),
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all tasks
  const { data: tasksData, isLoading: tasksLoading, error, refetch } = useQuery({
    queryKey: ['tasks', page, searchTerm, statusFilter, priorityFilter, projectFilter, sortBy, sortOrder],
    queryFn: async () => {
      const params = {
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(projectFilter !== 'all' && { projectId: projectFilter }),
        sortBy,
        sortOrder,
      };
      
      return await taskAPI.getTasks(params);
    },
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await taskAPI.createTask(data);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      setShowCreateTask(false);
      toast.success('Task created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to create task';
      toast.error(message);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taskAPI.updateTask(id, data),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowEditTask(false);
      setSelectedTask(null);
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update task';
      toast.error(message);
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      taskAPI.updateTaskStatus(id, status),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task status updated');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || 'Failed to update task status';
      toast.error(message);
    },
  });

  const handleCreateTask = async (data: any) => {
    await createTaskMutation.mutateAsync(data);
  };

  const handleUpdateTask = async (data: any) => {
    if (!selectedTask) return;
    await updateTaskMutation.mutateAsync({ id: selectedTask._id, data });
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, 300);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const clearFilters = () => {
    setSearchInput(''); // Clear input field
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setSortBy('deadline');
    setSortOrder('asc');
    setPage(1);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'done': return 'success';
      case 'in-progress': return 'warning';
      default: return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const isOverdue = (deadline: string, status: string) => {
    return status !== 'done' && new Date(deadline) < new Date();
  };

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Failed to load tasks. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (projectsError) {
    console.error('Projects loading error:', projectsError);
  }

  // Extract data with multiple fallback attempts
  const projects = projectsData?.data?.data || projectsData?.data || [];
  
  // Debug logging - remove this after fixing
  console.log('Raw projectsData:', projectsData);
  console.log('Extracted projects:', projects);
  
  // Try multiple ways to extract tasks array
  let tasks = [];
  let pagination = {};
  
  if (tasksData) {
    tasks = tasksData?.data?.data ||           
            tasksData?.data?.tasks ||          
            tasksData?.data ||                 
            tasksData?.tasks ||                
            tasksData ||                       
            [];
            
    pagination = tasksData?.data?.pagination || 
                 tasksData?.pagination || 
                 { pages: 1, total: Array.isArray(tasks) ? tasks.length : 0 };
  }

  // Debug logging for tasks
  console.log('Raw tasksData:', tasksData);
  console.log('Extracted tasks:', tasks);
  if (tasks.length > 0) {
    console.log('First task projectId:', tasks[0].projectId);
  }

  // Ensure tasks is an array
  if (!Array.isArray(tasks)) {
    tasks = [];
  }

  // Define getProjectName function after projects data is available
  const getProjectName = (projectId: string) => {
    if (!projectId) return 'No Project';
    
    // Debug logging - remove this after fixing
    console.log('Looking for project with ID:', projectId);
    console.log('Available projects:', projects);
    console.log('Projects count:', projects.length);
    
    const project = projects.find(p => p._id === projectId);
    console.log('Found project:', project);
    
    return project?.name || 'Unknown Project';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-gray-600 mt-1">
              Manage all your tasks across projects • {tasks.length} tasks
            </p>
          </div>
          <Button onClick={() => setShowCreateTask(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 w-full lg:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchInput} // Use controlled input
                  onChange={handleSearchChange} // Use proper handler
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: Project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline-asc">Due Soon</SelectItem>
                  <SelectItem value="deadline-desc">Due Later</SelectItem>
                  <SelectItem value="createdAt-desc">Newest First</SelectItem>
                  <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                  <SelectItem value="priority-desc">High Priority</SelectItem>
                  <SelectItem value="priority-asc">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {(searchInput || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all') && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  Clear Filters
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <CheckSquare className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500 mb-6">
              {searchInput || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all'
                ? 'Try adjusting your filters or creating a new task'
                : 'Get started by creating your first task'
              }
            </p>
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tasks.map((task: Task) => (
            <Card key={task._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status === 'in-progress' ? 'In Progress' : 
                         task.status === 'todo' ? 'To Do' : 'Done'}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(task.priority)}>
                        {task.priority} priority
                      </Badge>
                      {task.projectId && (
                        <Badge variant="outline" className="flex items-center">
                          <FolderOpen className="w-3 h-3 mr-1" />
                          {getProjectName(task.projectId)}
                        </Badge>
                      )}
                      {isOverdue(task.deadline, task.status) && (
                        <Badge variant="danger" className="flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-gray-600 mb-3">{task.description}</p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Due {formatDate(task.deadline)}</span>
                      </div>
                      {task.estimatedHours > 0 && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{task.estimatedHours}h estimated</span>
                        </div>
                      )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Select 
                      value={task.status} 
                      onValueChange={(newStatus) => handleStatusChange(task._id, newStatus)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTask(task);
                        setShowEditTask(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination?.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-600">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        title="Create New Task"
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          isLoading={createTaskMutation.isPending}
          projects={projects}
          isLoadingProjects={projectsLoading}
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditTask}
        onClose={() => {
          setShowEditTask(false);
          setSelectedTask(null);
        }}
        title="Edit Task"
        size="lg"
      >
        {selectedTask && (
          <TaskForm
            onSubmit={handleUpdateTask}
            initialData={selectedTask}
            isLoading={updateTaskMutation.isPending}
            projects={projects}
            isLoadingProjects={projectsLoading}
          />
        )}
      </Modal>
    </div>
  );
}
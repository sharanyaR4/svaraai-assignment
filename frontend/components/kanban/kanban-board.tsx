'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { projectAPI } from '@/lib/api';

export default function KanbanPage() {
  const params = useParams();
  const projectId = params.id as string;

  // Fetch the current project data
  const { 
    data: projectData, 
    isLoading: isProjectLoading, 
    error: projectError 
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectAPI.getProject(projectId),
    enabled: !!projectId,
  });

  // Extract project data - handle different response structures
  const currentProject = projectData?.data?.data || projectData?.data || projectData;

  if (isProjectLoading) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading project...</span>
          </div>
        </div>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="h-screen flex flex-col">
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-red-600">Error</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600">Error Loading Project</h2>
            <p className="text-gray-600 mb-4">Failed to load project data</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentProject?.name || 'Kanban Board'}
              </h1>
              {currentProject?.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {currentProject.description}
                </p>
              )}
            </div>
          </div>
          
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline">
              Project Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard 
          projectId={projectId} 
          currentProject={currentProject}
        />'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { TaskForm } from '@/components/forms/task-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskAPI } from '@/lib/api';
import toast from 'react-hot-toast';

// Types
interface Project {
  _id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  priority: "low" | "medium" | "high";
}

interface KanbanBoardProps {
  projectId: string;
  currentProject?: Project;
  allProjects?: Project[];
}

export function KanbanBoard({ projectId, currentProject, allProjects = [] }: KanbanBoardProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const queryClient = useQueryClient();

  // Debug logging
  console.log('KanbanBoard received:');
  console.log('- projectId:', projectId);
  console.log('- currentProject:', currentProject);
  console.log('- allProjects:', allProjects);

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return await taskAPI.createTask(data);
    },
    onSuccess: () => {
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

  const handleCreateTask = async (data: any) => {
    console.log('Creating task with data:', data);
    await createTaskMutation.mutateAsync(data);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Debug Panel - Remove after fixing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="text-sm space-y-1">
            <p><strong>Project ID:</strong> {projectId}</p>
            <p><strong>Current Project:</strong> {currentProject ? currentProject.name : 'Not found'}</p>
            <p><strong>All Projects Count:</strong> {allProjects.length}</p>
            <p><strong>Projects Available:</strong> {allProjects.map(p => p.name).join(', ') || 'None'}</p>
          </div>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="flex-1 flex space-x-6">
        {/* Todo Column */}
        <div className="flex-1 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Todo</h2>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">3</span>
          </div>
          
          <Button 
            onClick={() => setShowCreateTask(true)}
            className="w-full mb-4"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add task
          </Button>

          <div className="space-y-3">
            {/* Placeholder tasks */}
            <div className="bg-white p-3 rounded-lg shadow-sm border">
              <h3 className="font-medium">Setup Authentication Module</h3>
              <p className="text-sm text-gray-600 mt-1">Implement user authentication using JWT</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">medium</span>
                <span className="text-xs text-gray-500">Sep 26, 2025</span>
              </div>
            </div>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex-1 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">In Progress</h2>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">0</span>
          </div>
          
          <Button 
            onClick={() => setShowCreateTask(true)}
            className="w-full mb-4"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add task
          </Button>

          <div className="text-center text-gray-500 py-8">
            <p>No tasks</p>
            <Button 
              onClick={() => setShowCreateTask(true)}
              className="mt-2"
              variant="ghost"
              size="sm"
            >
              + Add task
            </Button>
          </div>
        </div>

        {/* Done Column */}
        <div className="flex-1 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Done</h2>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-sm">0</span>
          </div>
          
          <Button 
            onClick={() => setShowCreateTask(true)}
            className="w-full mb-4"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add task
          </Button>

          <div className="text-center text-gray-500 py-8">
            <p>No tasks</p>
            <Button 
              onClick={() => setShowCreateTask(true)}
              className="mt-2"
              variant="ghost"
              size="sm"
            >
              + Add task
            </Button>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        title={`Create Task in ${currentProject?.status || 'In Progress'}`}
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          isLoading={createTaskMutation.isPending}
          projects={allProjects} // Pass all projects as fallback
          isLoadingProjects={false}
          currentProject={currentProject} // Pass current project
          projectId={projectId}
        />
      </Modal>
    </div>
  );
}
      </div>
    </div>
  );
}
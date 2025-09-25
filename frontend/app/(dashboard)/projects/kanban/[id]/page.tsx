'use client';

import { Suspense } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/kanban/kanban-column';
import { projectAPI } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PageProps {
  params: {
    id: string;
  };
}

function KanbanContent({ projectId }: { projectId: string }) {
  // Fetch the current project data
  const { 
    data: projectData, 
    isLoading: isProjectLoading, 
    error: projectError 
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectAPI.getProject(projectId),
    enabled: !!projectId,
    retry: 3,
  });

  if (!projectId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 mb-4">Project ID is required</p>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isProjectLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="md" />
          <span className="text-gray-600">Loading project...</span>
        </div>
      </div>
    );
  }

  if (projectError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Error Loading Project</h1>
          <p className="text-gray-600 mb-4">
            {projectError?.message || 'Failed to load project data'}
          </p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Link href="/projects">
              <Button variant="outline">Back to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Extract project data - handle different possible response structures
  const currentProject = projectData?.data?.data || projectData?.data || projectData;

  if (!currentProject) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-xl font-bold text-red-600">Project Not Found</h1>
          <p className="text-gray-600 mb-4">
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b bg-white px-6 py-4 flex-shrink-0">
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
                {currentProject.name || 'Kanban Board'}
              </h1>
              {currentProject.description && (
                <p className="text-sm text-gray-600 mt-1">
                  {currentProject.description}
                </p>
              )}
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={() => {
              // You can implement a proper project details modal later
              alert(`Project Details:
Name: ${currentProject.name}
Status: ${currentProject.status}
Priority: ${currentProject.priority}
Created: ${currentProject.createdAt ? new Date(currentProject.createdAt).toLocaleDateString() : 'Unknown'}
${currentProject.description ? `Description: ${currentProject.description}` : ''}`);
            }}
          >
            Project Details
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <KanbanBoard 
          projectId={projectId} 
          currentProject={currentProject}
        />
      </div>
    </div>
  );
}

export default function KanbanPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading Kanban Board...</span>
        </div>
      </div>
    }>
      <KanbanContent projectId={params.id} />
    </Suspense>
  );
}
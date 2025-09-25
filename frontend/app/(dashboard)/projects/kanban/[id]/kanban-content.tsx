'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/kanban/kanban-board';

interface KanbanContentProps {
  projectId: string;
}

export default function KanbanContent({ projectId }: KanbanContentProps) {
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

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
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
        <KanbanBoard projectId={projectId} />
      </div>
    </div>
  );
}
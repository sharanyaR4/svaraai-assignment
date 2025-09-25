'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Clock, MoreHorizontal, User, Tag } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { TaskForm } from '@/components/forms/task-form';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { taskAPI } from '@/lib/api';
import { Task } from '@/types';
import { formatDate, getPriorityColor, isOverdue, truncateText } from '@/lib/utils';
import toast from 'react-hot-toast';

interface TaskCardProps {
  task: Task;
}

export const TaskCard = ({ task }: TaskCardProps) => {
  const [showEditTask, setShowEditTask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const queryClient = useQueryClient();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taskAPI.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      setShowEditTask(false);
      toast.success('Task updated successfully');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: taskAPI.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      setShowDeleteConfirm(false);
      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  const handleUpdateTask = async (data: any) => {
    await updateTaskMutation.mutateAsync({ id: task._id, data });
  };

  const handleDeleteTask = () => {
    deleteTaskMutation.mutate(task._id);
  };

  const priorityColor = getPriorityColor(task.priority);
  const overdue = isOverdue(task.deadline, task.status);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-move ${
          isDragging ? 'opacity-50' : ''
        } ${overdue ? 'border-red-300' : 'border-gray-200'}`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-medium text-gray-900 text-sm leading-5">
              {truncateText(task.title, 60)}
            </h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditTask(true)}>
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600"
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-xs text-gray-600 mb-3">
              {truncateText(task.description, 80)}
            </p>
          )}

          <div className="flex items-center justify-between mb-3">
            <Badge 
              variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}
              size="sm"
            >
              {task.priority}
            </Badge>
            
            <div className={`flex items-center text-xs ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(task.deadline)}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {task.estimatedHours}h
            </div>
            
            {task.tags.length > 0 && (
              <div className="flex items-center">
                <Tag className="w-3 h-3 mr-1" />
                {task.tags.slice(0, 2).map((tag, index) => (
                  <span key={index} className="bg-gray-100 px-1 py-0.5 rounded text-xs mr-1">
                    {tag}
                  </span>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-gray-400">+{task.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {overdue && (
            <div className="mt-2 text-xs text-red-600 font-medium">
              Overdue
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showEditTask}
        onClose={() => setShowEditTask(false)}
        title="Edit Task"
        size="lg"
      >
        <TaskForm
          onSubmit={handleUpdateTask}
          initialData={task}
          isLoading={updateTaskMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Task"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{task.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Edit, Trash, Calendar, Clock, Flag } from 'lucide-react';
import { taskAPI, projectAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { TaskForm } from '@/components/forms/task-form';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';
import { Task } from '@/types';
import toast from 'react-hot-toast';

interface KanbanBoardProps {
  projectId: string;
}

const COLUMNS = [
  { id: 'todo', title: 'Todo', color: 'bg-blue-50 border-blue-200' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'done', title: 'Done', color: 'bg-green-50 border-green-200' },
];

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showDeleteTask, setShowDeleteTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');

  const queryClient = useQueryClient();

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectAPI.getProject(projectId),
  });

  // Fetch tasks for this project
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['kanban', projectId],
    queryFn: () => taskAPI.getTasks({ projectId, limit: 100 }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => taskAPI.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', projectId] });
      toast.success('Task updated successfully');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: taskAPI.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', projectId] });
      setShowCreateTask(false);
      toast.success('Task created successfully');
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: taskAPI.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', projectId] });
      setShowDeleteTask(false);
      setSelectedTask(null);
      toast.success('Task deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete task');
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Update task status
    updateTaskMutation.mutate({
      id: draggableId,
      data: { status: destination.droppableId }
    });
  };

  const handleCreateTask = async (data: any) => {
    await createTaskMutation.mutateAsync({
      ...data,
      projectId,
      status: selectedColumn,
    });
  };

  const handleUpdateTask = async (data: any) => {
    if (!selectedTask) return;
    await updateTaskMutation.mutateAsync({ id: selectedTask._id, data });
    setShowEditTask(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = () => {
    if (!selectedTask) return;
    deleteTaskMutation.mutate(selectedTask._id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tasks = tasksData?.data?.data || [];
  const tasksByColumn = COLUMNS.reduce((acc, column) => {
    acc[column.id] = tasks.filter((task: Task) => task.status === column.id);
    return acc;
  }, {} as Record<string, Task[]>);

  const projectData = project?.data;

  return (
    <div className="h-full">
      {/* Project Header */}
      {projectData && (
        <div className="mb-6 flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: projectData.color }}
          />
          <h2 className="text-xl font-semibold text-gray-900">{projectData.name}</h2>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-6 h-full">
          {COLUMNS.map((column) => (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByColumn[column.id]?.length || 0}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedColumn(column.id);
                    setShowCreateTask(true);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Droppable Column */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[500px] rounded-lg border-2 border-dashed p-4 transition-colors ${column.color} ${
                      snapshot.isDraggingOver ? 'border-blue-400 bg-blue-100' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {tasksByColumn[column.id]?.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-move transition-shadow hover:shadow-md ${
                                snapshot.isDragging ? 'shadow-lg rotate-1' : ''
                              }`}
                            >
                              {/* Task Header */}
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-medium text-gray-900 text-sm leading-tight">
                                  {task.title}
                                </h4>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setShowEditTask(true);
                                      }}
                                    >
                                      <Edit className="mr-2 h-3 w-3" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setShowDeleteTask(true);
                                      }}
                                      className="text-red-600"
                                    >
                                      <Trash className="mr-2 h-3 w-3" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Task Description */}
                              {task.description && (
                                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              {/* Task Priority - Color Coded */}
                              <div className="flex items-center justify-between mb-3">
                                <Badge className={`text-xs px-2 py-1 ${getPriorityColor(task.priority)}`}>
                                  <Flag className="w-2 h-2 mr-1" />
                                  {task.priority}
                                </Badge>
                              </div>

                              {/* Task Footer */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                {task.dueDate && (
                                  <div className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(task.dueDate)}
                                  </div>
                                )}
                                {task.estimatedHours && (
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {task.estimatedHours}h
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {/* Empty State */}
                    {tasksByColumn[column.id]?.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <p className="text-sm mb-2">No tasks</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedColumn(column.id);
                            setShowCreateTask(true);
                          }}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add task
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateTask}
        onClose={() => {
          setShowCreateTask(false);
          setSelectedColumn('');
        }}
        title={`Create Task in ${COLUMNS.find(c => c.id === selectedColumn)?.title || 'Column'}`}
        size="lg"
      >
        <TaskForm
          onSubmit={handleCreateTask}
          isLoading={createTaskMutation.isPending}
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
          />
        )}
      </Modal>

      {/* Delete Task Modal */}
      <Modal
        isOpen={showDeleteTask}
        onClose={() => {
          setShowDeleteTask(false);
          setSelectedTask(null);
        }}
        title="Delete Task"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{selectedTask?.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteTask(false);
                setSelectedTask(null);
              }}
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
    </div>
  );
};
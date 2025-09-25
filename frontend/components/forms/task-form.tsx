"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Tag, Plus, X, FolderOpen } from "lucide-react";

// Types
interface Task {
  _id?: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
  deadline: string;
  estimatedHours: number;
  tags: string[];
  projectId?: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "on-hold";
  priority: "low" | "medium" | "high";
}

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  isLoading?: boolean;
  projectId?: string;
  initialData?: Task;
  projects?: Project[];
  isLoadingProjects?: boolean;
  currentProject?: Project; // Add this for when we're in a specific project context
}

interface TaskFormData {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "done";
  deadline: string;
  estimatedHours: number;
  tags: string[];
  projectId?: string;
}

// Loading spinner component
const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${className}`}
    />
  );
};

export function TaskForm({
  onSubmit,
  isLoading = false,
  projectId,
  initialData,
  projects = [],
  isLoadingProjects = false,
  currentProject, // When we're in a specific project context (like Kanban)
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    deadline: "",
    estimatedHours: 0,
    tags: [],
    projectId: projectId || "",
  });

  const [tagInput, setTagInput] = useState("");

  // Initialize form with existing data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        priority: initialData.priority || "medium",
        status: initialData.status || "todo",
        deadline: initialData.deadline
          ? new Date(initialData.deadline).toISOString().split("T")[0]
          : "",
        estimatedHours: initialData.estimatedHours || 0,
        tags: initialData.tags || [],
        projectId: initialData.projectId || projectId || "",
      });
    } else {
      // Ensure projectId is set when creating new task
      setFormData((prev) => ({
        ...prev,
        projectId: projectId || prev.projectId || "",
      }));
    }
  }, [initialData, projectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter a task title");
      return;
    }

    if (!formData.deadline) {
      alert("Please select a deadline");
      return;
    }

    // If we have currentProject, use its ID, otherwise require selection
    const finalProjectId = currentProject?._id || formData.projectId;
    if (!finalProjectId) {
      alert("Please select a project");
      return;
    }

    onSubmit({
      ...formData,
      projectId: finalProjectId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      deadline: formData.deadline + "T23:59:59.999Z",
    });
  };

  const handleInputChange = (
    field: keyof TaskFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "todo":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get selected project details - prioritize currentProject if available
  const selectedProject = currentProject || projects.find((p) => p._id === formData.projectId);
  
  // If we're in a specific project context (like Kanban), don't show project selection
  const showProjectSelection = !currentProject;

  // Combine available projects with currentProject to avoid duplication
  const availableProjects = currentProject 
    ? [currentProject, ...projects.filter(p => p._id !== currentProject._id)]
    : projects;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="text-center pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? "Edit Task" : "Create New Task"}
          </h2>
          <p className="text-gray-600 mt-1">
            {currentProject 
              ? `Add a new task to ${currentProject.name}`
              : initialData
              ? "Update task details"
              : "Add a new task to your project"}
          </p>
        </div>

        {/* Project Selection - Only show if not in a specific project context */}
        {showProjectSelection && (
          <div className="space-y-3">
            <Label
              htmlFor="project"
              className="text-sm font-semibold text-gray-900 flex items-center"
            >
              <FolderOpen className="w-4 h-4 mr-1" />
              Select Project <span className="text-red-500 ml-1">*</span>
            </Label>
            <Select
              value={formData.projectId || ""}
              onValueChange={(value: string) =>
                handleInputChange("projectId", value)
              }
              disabled={isLoading || isLoadingProjects}
            >
              <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                <div className="flex items-center space-x-2 w-full overflow-hidden">
                  {isLoadingProjects ? (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <LoadingSpinner size="sm" />
                      <span>Loading projects...</span>
                    </div>
                  ) : selectedProject ? (
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FolderOpen className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <div className="text-left min-w-0 flex-1">
                        <span className="font-medium block truncate">
                          {selectedProject.name}
                        </span>
                        {selectedProject.description && (
                          <span className="text-sm text-gray-500 block truncate">
                            {selectedProject.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <FolderOpen className="w-4 h-4" />
                      <span>
                        {availableProjects.length === 0
                          ? "No projects available"
                          : "Choose a project for this task"}
                      </span>
                    </div>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                {availableProjects.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No projects found</p>
                    <p className="text-xs">Create a project first</p>
                  </div>
                ) : (
                  availableProjects.map((project) => (
                    <SelectItem
                      key={project._id}
                      value={project._id}
                      className="p-3"
                    >
                      <div className="flex items-start space-x-2 w-full min-w-0">
                        <FolderOpen className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {project.name}
                          </div>
                          {project.description && (
                            <div className="text-xs text-gray-500 mt-1 break-words line-clamp-2">
                              {project.description}
                            </div>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge
                              variant="outline"
                              className={`text-xs px-1.5 py-0.5 ${
                                project.status === "active"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : project.status === "completed"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-yellow-50 text-yellow-700 border-yellow-200"
                              }`}
                            >
                              {project.status}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs px-1.5 py-0.5 ${getPriorityColor(
                                project.priority
                              )}`}
                            >
                              {project.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {availableProjects.length === 0 && !isLoadingProjects && (
              <p className="text-sm text-amber-600 flex items-center">
                <span className="mr-1">⚠️</span>
                No projects available. Please create a project first.
              </p>
            )}
          </div>
        )}

        {/* Show current project info if we're in a specific project context */}
        {!showProjectSelection && currentProject && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Creating task in:</p>
                <p className="text-blue-700 font-semibold">{currentProject.name}</p>
                {currentProject.description && (
                  <p className="text-blue-600 text-sm">{currentProject.description}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-3">
          <Label
            htmlFor="title"
            className="text-sm font-semibold text-gray-900 flex items-center"
          >
            Task Title <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Enter a clear, descriptive task title"
            required
            disabled={isLoading}
            className="text-lg font-medium h-12 border-2 focus:border-blue-500 focus:ring-0"
          />
        </div>

        {/* Description */}
        <div className="space-y-3">
          <Label
            htmlFor="description"
            className="text-sm font-semibold text-gray-900"
          >
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Provide additional details about this task..."
            rows={4}
            disabled={isLoading}
            className="border-2 focus:border-blue-500 focus:ring-0 resize-none"
          />
        </div>

        {/* Priority and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label
              htmlFor="priority"
              className="text-sm font-semibold text-gray-900"
            >
              Priority Level
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value: "low" | "medium" | "high") =>
                handleInputChange("priority", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      formData.priority === "high"
                        ? "bg-red-500"
                        : formData.priority === "medium"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high" className="text-red-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>High Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium" className="text-yellow-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Medium Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="low" className="text-green-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Low Priority</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="status"
              className="text-sm font-semibold text-gray-900"
            >
              Current Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value: "todo" | "in-progress" | "done") =>
                handleInputChange("status", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger className="h-12 border-2 focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Deadline and Hours Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label
              htmlFor="deadline"
              className="text-sm font-semibold text-gray-900 flex items-center"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Deadline <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange("deadline", e.target.value)}
              required
              disabled={isLoading}
              className="h-12 border-2 focus:border-blue-500 focus:ring-0"
            />
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="estimatedHours"
              className="text-sm font-semibold text-gray-900 flex items-center"
            >
              <Clock className="w-4 h-4 mr-1" />
              Estimated Hours
            </Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedHours}
              onChange={(e) =>
                handleInputChange(
                  "estimatedHours",
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="0"
              disabled={isLoading}
              className="h-12 border-2 focus:border-blue-500 focus:ring-0"
            />
          </div>
        </div>

        {/* Tags Section */}
        <Card className="border-2 border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-900 flex items-center">
                <Tag className="w-4 h-4 mr-1" />
                Tags
              </Label>

              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag and press Enter"
                  disabled={isLoading}
                  className="flex-1 border-2 focus:border-blue-500 focus:ring-0"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={isLoading || !tagInput.trim()}
                  className="px-4 border-2"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-blue-900"
                        disabled={isLoading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="bg-gray-50 border-2 border-gray-200">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Preview
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(formData.priority)}>
                  {formData.priority} priority
                </Badge>
                <Badge className={getStatusColor(formData.status)}>
                  {formData.status === "in-progress"
                    ? "In Progress"
                    : formData.status === "todo"
                    ? "To Do"
                    : "Done"}
                </Badge>
                {selectedProject && (
                  <Badge variant="outline" className="text-xs">
                    {selectedProject.name}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {formData.title || "Task title will appear here"}
              </p>
              {formData.deadline && (
                <p className="text-xs text-gray-500">
                  Due: {new Date(formData.deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="pt-6 border-t border-gray-200">
          <Button
            type="submit"
            disabled={
              isLoading ||
              isLoadingProjects ||
              !formData.title.trim() ||
              !formData.deadline ||
              (!currentProject && !formData.projectId) ||
              (showProjectSelection && availableProjects.length === 0)
            }
            className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" />
                {initialData ? "Updating Task..." : "Creating Task..."}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {initialData ? "Update Task" : "Create Task"}
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Also export as default for compatibility
export default TaskForm;
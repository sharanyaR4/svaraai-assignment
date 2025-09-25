"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  FolderOpen,
  CheckSquare,
  Clock,
  TrendingUp,
  Plus,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { projectAPI, taskAPI } from "@/lib/api";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatDate,
  formatRelativeTime,
  getStatusColor,
  getPriorityColor,
  isOverdue,
} from "@/lib/utils";
import Link from "next/link";

const COLORS = {
  todo: "#3b82f6",
  "in-progress": "#f59e0b",
  done: "#10b981",
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function DashboardPage() {
  // Fetch projects to calculate stats
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectAPI.getProjects({ limit: 100 }),
    staleTime: 30000,
  });

  // Fetch tasks to calculate stats
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => taskAPI.getTasks({ limit: 1000 }),
    staleTime: 30000,
  });

  // Fallback to original API calls if they exist
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: projectAPI.getProjectStats,
    enabled: false, // Disable by default, enable if needed
  });

  const { data: taskStatsData, isLoading: taskStatsLoading } = useQuery({
    queryKey: ["task-stats"],
    queryFn: taskAPI.getTaskStats,
    enabled: false, // Disable by default, enable if needed
  });

  const { data: recentProjectsData } = useQuery({
    queryKey: ["recent-projects"],
    queryFn: () => projectAPI.getRecentProjects?.(5) || projectAPI.getProjects({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
    staleTime: 30000,
  });

  const { data: upcomingTasksData } = useQuery({
    queryKey: ["upcoming-tasks"],
    queryFn: () => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return taskAPI.getUpcomingTasks?.(7) || 
             taskAPI.getTasks({ 
               status: 'todo,in-progress',
               sortBy: 'deadline',
               sortOrder: 'asc',
               limit: 10 
             });
    },
    staleTime: 30000,
  });

  const isLoading = projectsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Extract projects and tasks with fallbacks
  const projects = projectsData?.data?.data || projectsData?.data || [];
  const tasks = tasksData?.data?.data || tasksData?.data || [];
  
  // Calculate stats from actual data
  const totalProjects = projects.length || 0;
  const activeProjects = projects.filter(p => p.status === 'active').length || 0;
  const totalTasks = tasks.length || 0;
  const todoTasks = tasks.filter(t => t.status === 'todo').length || 0;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length || 0;
  const doneTasks = tasks.filter(t => t.status === 'done').length || 0;
  
  // Calculate overdue tasks
  const now = new Date();
  const overdueTasks = tasks.filter(task => 
    task.status !== 'done' && new Date(task.deadline) < now
  );
  const overdueCount = overdueTasks.length || 0;

  // Prepare chart data
  const taskStatusData = [
    { name: 'To Do', value: todoTasks, color: COLORS.todo },
    { name: 'In Progress', value: inProgressTasks, color: COLORS['in-progress'] },
    { name: 'Done', value: doneTasks, color: COLORS.done },
  ].filter(item => item.value > 0);

  const projectPriorityData = [
    { name: 'Low', value: projects.filter(p => p.priority === 'low').length, fill: COLORS.low },
    { name: 'Medium', value: projects.filter(p => p.priority === 'medium').length, fill: COLORS.medium },
    { name: 'High', value: projects.filter(p => p.priority === 'high').length, fill: COLORS.high },
  ].filter(item => item.value > 0);

  // Get recent projects
  const recentProjects = recentProjectsData?.data?.data || recentProjectsData?.data || projects.slice(0, 5) || [];

  // Get upcoming tasks (next 7 days)
  const upcomingTasks = upcomingTasksData?.data?.data || upcomingTasksData?.data || 
    tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return taskDate <= sevenDaysFromNow && task.status !== 'done';
    }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline)).slice(0, 5) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>
        <div className="flex space-x-3">
          <Link href="/projects">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {activeProjects} active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {inProgressTasks} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Tasks
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doneTasks}</div>
            <p className="text-xs text-muted-foreground">
              {todoTasks} pending tasks
            </p>
          </CardContent>
        </Card>

        <Card className={overdueCount > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : ""}`}>
              {overdueCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>
              Distribution of tasks across different statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {taskStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {taskStatusData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm capitalize">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects by Priority</CardTitle>
            <CardDescription>
              Priority distribution of your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectPriorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projectPriorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No projects available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Your latest project activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div
                    key={project._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color || '#6b7280' }}
                      />
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          {project.createdAt ? formatRelativeTime(project.createdAt) : 'Recently created'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        project.status === "active" ? "primary" : "default"
                      }
                    >
                      {project.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent projects</p>
              )}
            </div>
            <div className="mt-4">
              <Link href="/projects">
                <Button variant="outline" size="sm" className="w-full">
                  View All Projects
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center mt-1">
                        <span
                          className={`text-xs ${
                            isOverdue(task.deadline, task.status)
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          Due {formatDate(task.deadline)}
                        </span>
                        <Badge
                          size="sm"
                          variant={
                            task.priority === "high"
                              ? "danger"
                              : task.priority === "medium"
                              ? "warning"
                              : "success"
                          }
                          className="ml-2"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No upcoming tasks</p>
              )}
            </div>
            <div className="mt-4">
              <Link href="/tasks">
                <Button variant="outline" size="sm" className="w-full">
                  View All Tasks
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Overdue Tasks Require Attention
            </CardTitle>
            <CardDescription className="text-red-600">
              {overdueTasks.length} task
              {overdueTasks.length > 1 ? "s are" : " is"} overdue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueTasks.slice(0, 3).map((task) => (
                <div key={task._id} className="text-sm text-red-800">
                  • {task.title} - Due {formatDate(task.deadline)}
                </div>
              ))}
              {overdueTasks.length > 3 && (
                <p className="text-sm text-red-600 font-medium">
                  +{overdueTasks.length - 3} more overdue task
                  {overdueTasks.length - 3 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
};

export const formatRelativeTime = (date: string) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (deadline: string, status: string) => {
  if (status === 'done') return false;
  return isBefore(new Date(deadline), new Date());
};

export const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'medium':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'low':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'todo':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'in-progress':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'completed':
    case 'done':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'on-hold':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'cancelled':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const truncateText = (text: string, length: number = 100) => {
  return text.length > length ? `${text.substring(0, length)}...` : text;
};

export const generateColors = () => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
// Task statuses
const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done'
};

// Task priorities
const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Project statuses
const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on-hold',
  CANCELLED: 'cancelled'
};

// Project priorities
const PROJECT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// User roles (for future expansion)
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Pagination defaults
const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

// Sort orders
const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// Priority colors for frontend
const PRIORITY_COLORS = {
  low: '#10B981',      // Green
  medium: '#F59E0B',   // Yellow
  high: '#EF4444'      // Red
};

// Status colors for frontend
const STATUS_COLORS = {
  todo: '#6B7280',           // Gray
  'in-progress': '#3B82F6',  // Blue
  done: '#10B981'            // Green
};

// Project colors
const PROJECT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899'  // Pink
];

// Date formats
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  DISPLAY: 'MMM DD, YYYY',
  FULL: 'MMMM DD, YYYY HH:mm'
};

// Validation limits
const VALIDATION_LIMITS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 6,
  PROJECT_NAME_MIN_LENGTH: 2,
  PROJECT_NAME_MAX_LENGTH: 100,
  PROJECT_DESCRIPTION_MIN_LENGTH: 5,
  PROJECT_DESCRIPTION_MAX_LENGTH: 500,
  TASK_TITLE_MIN_LENGTH: 3,
  TASK_TITLE_MAX_LENGTH: 200,
  TASK_DESCRIPTION_MAX_LENGTH: 1000,
  TAG_MIN_LENGTH: 1,
  TAG_MAX_LENGTH: 50,
  MAX_ESTIMATED_HOURS: 1000
};

// Error messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User already exists with this email',
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_EXISTS: 'Project with this name already exists',
  TASK_NOT_FOUND: 'Task not found',
  ACCESS_DENIED: 'Access denied',
  INVALID_TOKEN: 'Invalid or expired token',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  PROJECT_HAS_TASKS: 'Cannot delete project with existing tasks',
  DEADLINE_PAST: 'Deadline cannot be in the past',
  ACCOUNT_DEACTIVATED: 'Account has been deactivated'
};

// Success messages
const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  TASK_MOVED: 'Task moved successfully',
  STATUS_UPDATED: 'Status updated successfully'
};

module.exports = {
  TASK_STATUS,
  TASK_PRIORITY,
  PROJECT_STATUS,
  PROJECT_PRIORITY,
  USER_ROLES,
  PAGINATION_DEFAULTS,
  SORT_ORDER,
  HTTP_STATUS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  PROJECT_COLORS,
  DATE_FORMATS,
  VALIDATION_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};
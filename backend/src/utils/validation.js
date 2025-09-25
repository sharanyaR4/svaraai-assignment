const { VALIDATION_LIMITS } = require('./constants');

/**
 * Validate user registration data
 * @param {object} userData - User data to validate
 * @returns {array} - Array of validation errors
 */
const validateUserRegistration = (userData) => {
  const errors = [];
  const { name, email, password } = userData;

  // Name validation
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
  } else if (name.trim().length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
    errors.push(`Name must be at least ${VALIDATION_LIMITS.NAME_MIN_LENGTH} characters long`);
  } else if (name.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
    errors.push(`Name cannot exceed ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters`);
  }

  // Email validation
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      errors.push('Please provide a valid email address');
    } else if (email.length > VALIDATION_LIMITS.EMAIL_MAX_LENGTH) {
      errors.push(`Email cannot exceed ${VALIDATION_LIMITS.EMAIL_MAX_LENGTH} characters`);
    }
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} characters long`);
  }

  return errors;
};

/**
 * Validate project data
 * @param {object} projectData - Project data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {array} - Array of validation errors
 */
const validateProjectData = (projectData, isUpdate = false) => {
  const errors = [];
  const { name, description, priority, status, endDate } = projectData;

  // Name validation
  if (!isUpdate && (!name || typeof name !== 'string')) {
    errors.push('Project name is required');
  } else if (name) {
    if (name.trim().length < VALIDATION_LIMITS.PROJECT_NAME_MIN_LENGTH) {
      errors.push(`Project name must be at least ${VALIDATION_LIMITS.PROJECT_NAME_MIN_LENGTH} characters long`);
    } else if (name.length > VALIDATION_LIMITS.PROJECT_NAME_MAX_LENGTH) {
      errors.push(`Project name cannot exceed ${VALIDATION_LIMITS.PROJECT_NAME_MAX_LENGTH} characters`);
    }
  }

  // Description validation
  if (!isUpdate && (!description || typeof description !== 'string')) {
    errors.push('Project description is required');
  } else if (description) {
    if (description.trim().length < VALIDATION_LIMITS.PROJECT_DESCRIPTION_MIN_LENGTH) {
      errors.push(`Description must be at least ${VALIDATION_LIMITS.PROJECT_DESCRIPTION_MIN_LENGTH} characters long`);
    } else if (description.length > VALIDATION_LIMITS.PROJECT_DESCRIPTION_MAX_LENGTH) {
      errors.push(`Description cannot exceed ${VALIDATION_LIMITS.PROJECT_DESCRIPTION_MAX_LENGTH} characters`);
    }
  }

  // Priority validation
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    errors.push('Priority must be one of: low, medium, high');
  }

  // Status validation
  if (status && !['active', 'completed', 'on-hold', 'cancelled'].includes(status)) {
    errors.push('Status must be one of: active, completed, on-hold, cancelled');
  }

  // End date validation
  if (endDate) {
    const date = new Date(endDate);
    if (isNaN(date.getTime())) {
      errors.push('End date must be a valid date');
    } else if (date < new Date()) {
      errors.push('End date cannot be in the past');
    }
  }

  return errors;
};

/**
 * Validate task data
 * @param {object} taskData - Task data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {array} - Array of validation errors
 */
const validateTaskData = (taskData, isUpdate = false) => {
  const errors = [];
  const { title, description, status, priority, deadline, estimatedHours, tags } = taskData;

  // Title validation
  if (!isUpdate && (!title || typeof title !== 'string')) {
    errors.push('Task title is required');
  } else if (title) {
    if (title.trim().length < VALIDATION_LIMITS.TASK_TITLE_MIN_LENGTH) {
      errors.push(`Task title must be at least ${VALIDATION_LIMITS.TASK_TITLE_MIN_LENGTH} characters long`);
    } else if (title.length > VALIDATION_LIMITS.TASK_TITLE_MAX_LENGTH) {
      errors.push(`Task title cannot exceed ${VALIDATION_LIMITS.TASK_TITLE_MAX_LENGTH} characters`);
    }
  }

  // Description validation
  if (description && description.length > VALIDATION_LIMITS.TASK_DESCRIPTION_MAX_LENGTH) {
    errors.push(`Description cannot exceed ${VALIDATION_LIMITS.TASK_DESCRIPTION_MAX_LENGTH} characters`);
  }

  // Status validation
  if (status && !['todo', 'in-progress', 'done'].includes(status)) {
    errors.push('Status must be one of: todo, in-progress, done');
  }

  // Priority validation
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    errors.push('Priority must be one of: low, medium, high');
  }

  // Deadline validation
  if (!isUpdate && !deadline) {
    errors.push('Deadline is required');
  } else if (deadline) {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      errors.push('Deadline must be a valid date');
    } else if (date < new Date() && status !== 'done') {
      errors.push('Deadline cannot be in the past for active tasks');
    }
  }

  // Estimated hours validation
  if (estimatedHours !== undefined) {
    if (typeof estimatedHours !== 'number' || estimatedHours < 0) {
      errors.push('Estimated hours must be a positive number');
    } else if (estimatedHours > VALIDATION_LIMITS.MAX_ESTIMATED_HOURS) {
      errors.push(`Estimated hours cannot exceed ${VALIDATION_LIMITS.MAX_ESTIMATED_HOURS}`);
    }
  }

  // Tags validation
  if (tags) {
    if (!Array.isArray(tags)) {
      errors.push('Tags must be an array');
    } else {
      tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          errors.push(`Tag at index ${index} must be a string`);
        } else if (tag.trim().length < VALIDATION_LIMITS.TAG_MIN_LENGTH) {
          errors.push(`Tag at index ${index} must be at least ${VALIDATION_LIMITS.TAG_MIN_LENGTH} character long`);
        } else if (tag.length > VALIDATION_LIMITS.TAG_MAX_LENGTH) {
          errors.push(`Tag at index ${index} cannot exceed ${VALIDATION_LIMITS.TAG_MAX_LENGTH} characters`);
        }
      });
    }
  }

  return errors;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with score and suggestions
 */
const validatePasswordStrength = (password) => {
  const result = {
    score: 0,
    suggestions: [],
    isValid: false
  };

  if (!password || typeof password !== 'string') {
    result.suggestions.push('Password is required');
    return result;
  }

  if (password.length < VALIDATION_LIMITS.PASSWORD_MIN_LENGTH) {
    result.suggestions.push(`Password must be at least ${VALIDATION_LIMITS.PASSWORD_MIN_LENGTH} characters long`);
  } else {
    result.score += 1;
  }

  if (password.length >= 8) {
    result.score += 1;
  } else {
    result.suggestions.push('Use at least 8 characters for better security');
  }

  if (/[a-z]/.test(password)) {
    result.score += 1;
  } else {
    result.suggestions.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    result.score += 1;
  } else {
    result.suggestions.push('Include uppercase letters');
  }

  if (/\d/.test(password)) {
    result.score += 1;
  } else {
    result.suggestions.push('Include numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.score += 1;
  } else {
    result.suggestions.push('Include special characters');
  }

  result.isValid = result.score >= 3; // Minimum acceptable score

  return result;
};

/**
 * Validate ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate hex color format
 * @param {string} color - Color to validate
 * @returns {boolean} - True if valid hex color
 */
const isValidHexColor = (color) => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Validate pagination parameters
 * @param {object} params - Pagination parameters
 * @returns {object} - Validated and sanitized parameters
 */
const validatePaginationParams = (params) => {
  const { page, limit } = params;
  
  let validatedPage = parseInt(page) || 1;
  let validatedLimit = parseInt(limit) || 10;

  // Ensure positive values
  validatedPage = Math.max(1, validatedPage);
  validatedLimit = Math.max(1, Math.min(100, validatedLimit)); // Max 100 items per page

  return {
    page: validatedPage,
    limit: validatedLimit
  };
};

/**
 * Validate sort parameters
 * @param {object} params - Sort parameters
 * @param {array} allowedFields - Allowed fields for sorting
 * @returns {object} - Validated sort parameters
 */
const validateSortParams = (params, allowedFields = []) => {
  const { sortBy, sortOrder } = params;
  
  let validatedSortBy = 'createdAt';
  let validatedSortOrder = 'desc';

  if (sortBy && allowedFields.includes(sortBy)) {
    validatedSortBy = sortBy;
  }

  if (sortOrder && ['asc', 'desc'].includes(sortOrder.toLowerCase())) {
    validatedSortOrder = sortOrder.toLowerCase();
  }

  return {
    sortBy: validatedSortBy,
    sortOrder: validatedSortOrder
  };
};

module.exports = {
  validateUserRegistration,
  validateProjectData,
  validateTaskData,
  validatePasswordStrength,
  isValidObjectId,
  isValidHexColor,
  validatePaginationParams,
  validateSortParams
};
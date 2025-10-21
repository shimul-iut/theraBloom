/**
 * Error Handler Utility
 * Provides consistent error handling and user-friendly messages
 */

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

/**
 * Extract error information from API response
 */
export function extractApiError(error: any): ApiError {
  // Check if it's an axios error with response
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // Check if it's a direct error object
  if (error.error) {
    return error.error;
  }

  // Fallback to generic error
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred',
  };
}

/**
 * Get user-friendly error message based on error code
 */
export function getUserFriendlyMessage(errorCode: string, defaultMessage?: string): string {
  const messages: Record<string, string> = {
    // Authentication errors
    INVALID_CREDENTIALS: 'Invalid phone number or password',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    TOKEN_EXPIRED: 'Your session has expired. Please login again',

    // Validation errors
    VALIDATION_ERROR: 'Please check your input and try again',
    INVALID_INPUT: 'The provided information is invalid',

    // Session scheduling errors
    THERAPIST_NOT_AVAILABLE: 'The therapist is not available at the selected time',
    THERAPIST_SCHEDULING_CONFLICT:
      'The therapist already has a session scheduled at this time. Please choose a different time slot.',
    PATIENT_SCHEDULING_CONFLICT:
      'The patient already has a session scheduled at this time. Please choose a different time slot.',
    SCHEDULING_CONFLICT: 'There is a scheduling conflict. Please choose a different time slot.',

    // Resource not found errors
    PATIENT_NOT_FOUND: 'Patient not found',
    THERAPIST_NOT_FOUND: 'Therapist not found',
    THERAPY_TYPE_NOT_FOUND: 'Therapy type not found',
    SESSION_NOT_FOUND: 'Session not found',

    // Business logic errors
    INSUFFICIENT_CREDIT: 'Patient does not have sufficient credit balance',
    INVALID_SESSION_STATUS: 'Cannot perform this action on the session in its current status',

    // Generic errors
    FETCH_FAILED: 'Failed to load data. Please try again.',
    CREATE_FAILED: 'Failed to create. Please try again.',
    UPDATE_FAILED: 'Failed to update. Please try again.',
    DELETE_FAILED: 'Failed to delete. Please try again.',
  };

  return messages[errorCode] || defaultMessage || 'An error occurred. Please try again.';
}

/**
 * Check if error is a scheduling conflict
 */
export function isSchedulingConflict(error: any): boolean {
  const apiError = extractApiError(error);
  return (
    apiError.code === 'THERAPIST_SCHEDULING_CONFLICT' ||
    apiError.code === 'PATIENT_SCHEDULING_CONFLICT' ||
    apiError.code === 'SCHEDULING_CONFLICT'
  );
}

/**
 * Check if error is a therapist conflict
 */
export function isTherapistConflict(error: any): boolean {
  const apiError = extractApiError(error);
  return apiError.code === 'THERAPIST_SCHEDULING_CONFLICT';
}

/**
 * Check if error is a patient conflict
 */
export function isPatientConflict(error: any): boolean {
  const apiError = extractApiError(error);
  return apiError.code === 'PATIENT_SCHEDULING_CONFLICT';
}

/**
 * Get detailed conflict information
 */
export function getConflictDetails(error: any): {
  type: 'therapist' | 'patient' | 'unknown';
  message: string;
} {
  const apiError = extractApiError(error);

  if (apiError.code === 'THERAPIST_SCHEDULING_CONFLICT') {
    return {
      type: 'therapist',
      message: getUserFriendlyMessage(apiError.code, apiError.message),
    };
  }

  if (apiError.code === 'PATIENT_SCHEDULING_CONFLICT') {
    return {
      type: 'patient',
      message: getUserFriendlyMessage(apiError.code, apiError.message),
    };
  }

  return {
    type: 'unknown',
    message: apiError.message,
  };
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: any): string {
  const apiError = extractApiError(error);
  return getUserFriendlyMessage(apiError.code, apiError.message);
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  const apiError = extractApiError(error);
  return apiError.code === 'VALIDATION_ERROR' || apiError.code === 'INVALID_INPUT';
}

/**
 * Get validation error details
 */
export function getValidationErrors(error: any): Array<{ path: string[]; message: string }> {
  const apiError = extractApiError(error);
  return apiError.details || [];
}

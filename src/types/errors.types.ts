/**
 * Error Types
 */

/** Application error codes */
export type ErrorCode =
  // General
  | 'UNKNOWN'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'PERMISSION_DENIED'

  // Claude CLI
  | 'CLAUDE_CLI_NOT_FOUND'
  | 'CLAUDE_CLI_ERROR'
  | 'CLAUDE_CLI_TIMEOUT'
  | 'CLAUDE_CLI_AUTH_REQUIRED'

  // Database
  | 'DATABASE_ERROR'
  | 'DATABASE_CONSTRAINT'
  | 'DATABASE_NOT_FOUND'

  // File System
  | 'FILE_NOT_FOUND'
  | 'FILE_ACCESS_DENIED'
  | 'FILE_ALREADY_EXISTS'
  | 'DIRECTORY_NOT_FOUND'

  // Network
  | 'NETWORK_ERROR'
  | 'TIMEOUT';

/** Application error structure */
export interface AppError {
  code: ErrorCode;
  message: string;
  details?: string;
}

/** Check if an error is an AppError */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as AppError).code === 'string' &&
    typeof (error as AppError).message === 'string'
  );
}

/** User-friendly error messages */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNKNOWN: 'An unexpected error occurred',
  NOT_FOUND: 'The requested resource was not found',
  INVALID_INPUT: 'Invalid input provided',
  PERMISSION_DENIED: 'Permission denied',

  CLAUDE_CLI_NOT_FOUND: 'Claude CLI is not installed or not in PATH',
  CLAUDE_CLI_ERROR: 'Claude CLI encountered an error',
  CLAUDE_CLI_TIMEOUT: 'Claude CLI request timed out',
  CLAUDE_CLI_AUTH_REQUIRED: 'Claude CLI requires authentication',

  DATABASE_ERROR: 'Database error occurred',
  DATABASE_CONSTRAINT: 'Database constraint violation',
  DATABASE_NOT_FOUND: 'Database record not found',

  FILE_NOT_FOUND: 'File not found',
  FILE_ACCESS_DENIED: 'File access denied',
  FILE_ALREADY_EXISTS: 'File already exists',
  DIRECTORY_NOT_FOUND: 'Directory not found',

  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT: 'Request timed out',
};

/** Get user-friendly error message */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return ERROR_MESSAGES[error.code] || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return ERROR_MESSAGES.UNKNOWN;
}

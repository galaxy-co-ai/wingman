/**
 * ID Generation Utilities
 * Uses nanoid for generating unique identifiers
 */

import { nanoid } from 'nanoid';

/**
 * Generate a unique ID with an optional prefix
 * @param prefix - Optional prefix for the ID (e.g., 'sess', 'msg', 'task')
 * @param length - Length of the random part (default: 12)
 * @returns A unique string ID
 * @example
 *   generateId('sess') => 'sess_V1StGXR8_Z5j'
 *   generateId('msg') => 'msg_Xk3jn2Lm9pQr'
 *   generateId() => 'Ab3Kj9Xm2Pqr'
 */
export function generateId(prefix?: string, length = 12): string {
  const id = nanoid(length);
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return generateId('sess');
}

/**
 * Generate a message ID
 */
export function generateMessageId(): string {
  return generateId('msg');
}

/**
 * Generate a project ID
 */
export function generateProjectId(): string {
  return generateId('proj');
}

/**
 * Generate a task ID
 */
export function generateTaskId(): string {
  return generateId('task');
}

/**
 * Generate a sprint ID
 */
export function generateSprintId(): string {
  return generateId('sprint');
}

/**
 * Generate a milestone ID
 */
export function generateMilestoneId(): string {
  return generateId('mile');
}

/**
 * Generate an activity entry ID
 */
export function generateActivityId(): string {
  return generateId('act');
}

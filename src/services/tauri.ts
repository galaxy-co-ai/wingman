/**
 * Tauri IPC Service
 * Base utilities for communicating with the Rust backend
 */

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { AppError } from '@/types';

/**
 * Invoke a Tauri command with type-safe parameters and return type
 * @param command - The command name (matches Rust #[tauri::command])
 * @param args - Command arguments
 * @returns Promise resolving to the command result
 * @throws AppError on failure
 */
export async function invokeCommand<T>(
  command: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any
): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    // Tauri returns errors as strings or objects
    throw error as AppError;
  }
}

/**
 * Subscribe to a Tauri event
 * @param event - The event name
 * @param handler - Callback function for event payloads
 * @returns Promise resolving to an unlisten function
 */
export async function subscribeToEvent<T>(
  event: string,
  handler: (payload: T) => void
): Promise<UnlistenFn> {
  return listen<T>(event, (e) => handler(e.payload));
}

/**
 * Subscribe to multiple events with a single cleanup function
 * @param subscriptions - Array of [eventName, handler] tuples
 * @returns Promise resolving to a cleanup function that unsubscribes all
 */
export async function subscribeToEvents<T extends Record<string, unknown>>(
  subscriptions: Array<[keyof T, (payload: T[keyof T]) => void]>
): Promise<() => void> {
  const unlisteners: UnlistenFn[] = [];

  for (const [event, handler] of subscriptions) {
    const unlisten = await listen(event as string, (e) => handler(e.payload as T[keyof T]));
    unlisteners.push(unlisten);
  }

  return () => {
    unlisteners.forEach((unlisten) => unlisten());
  };
}

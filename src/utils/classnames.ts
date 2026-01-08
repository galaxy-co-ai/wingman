/**
 * Utility for conditionally joining CSS class names
 * Similar to clsx/classnames but simpler
 */

type ClassValue = string | undefined | null | false | 0 | Record<string, unknown>;

/**
 * Combines class names, filtering out falsy values
 * @example cn('base', isActive && 'active', { 'error': hasError })
 */
export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];

  for (const cls of classes) {
    if (!cls) continue;

    if (typeof cls === 'string') {
      result.push(cls);
    } else if (typeof cls === 'object') {
      for (const [key, value] of Object.entries(cls)) {
        if (value) {
          result.push(key);
        }
      }
    }
  }

  return result.join(' ');
}

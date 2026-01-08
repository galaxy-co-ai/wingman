/**
 * Path Formatting Utilities
 */

/**
 * Get the filename from a full path
 */
export function getFileName(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] || '';
}

/**
 * Get the directory from a full path
 */
export function getDirectory(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');
  parts.pop();
  return parts.join('/') || '/';
}

/**
 * Get file extension (without dot)
 */
export function getExtension(path: string): string {
  const fileName = getFileName(path);
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return fileName.slice(lastDot + 1).toLowerCase();
}

/**
 * Truncate a path from the left if it exceeds maxLength
 * @example truncatePath('/very/long/path/to/file.txt', 20) => '...path/to/file.txt'
 */
export function truncatePath(path: string, maxLength: number): string {
  if (path.length <= maxLength) return path;

  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/');

  let result = parts.pop() || '';

  while (parts.length > 0 && result.length < maxLength - 4) {
    const next = parts.pop();
    if (!next) break;
    const newResult = `${next}/${result}`;
    if (newResult.length > maxLength - 4) break;
    result = newResult;
  }

  return `.../${result}`;
}

/**
 * Get a relative path from a base directory
 * @example relativePath('/home/user/project', '/home/user/project/src/file.ts') => 'src/file.ts'
 */
export function relativePath(basePath: string, fullPath: string): string {
  const normalizedBase = basePath.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedFull = fullPath.replace(/\\/g, '/');

  if (normalizedFull.startsWith(normalizedBase)) {
    const relative = normalizedFull.slice(normalizedBase.length);
    return relative.startsWith('/') ? relative.slice(1) : relative;
  }

  return fullPath;
}

/**
 * Check if a path is within a directory
 */
export function isPathWithin(basePath: string, testPath: string): boolean {
  const normalizedBase = basePath.replace(/\\/g, '/').replace(/\/$/, '');
  const normalizedTest = testPath.replace(/\\/g, '/');
  return normalizedTest.startsWith(normalizedBase + '/') || normalizedTest === normalizedBase;
}

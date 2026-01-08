/**
 * Date Formatting Utilities
 */

/**
 * Format a date relative to now (e.g., "5 minutes ago", "Yesterday")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Just now';
  }

  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }

  if (diffDay === 1) {
    return 'Yesterday';
  }

  if (diffDay < 7) {
    return `${diffDay}d ago`;
  }

  // For older dates, show the actual date
  return formatDate(target);
}

/**
 * Format a date as a short date string (e.g., "Jan 5, 2024")
 */
export function formatDate(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date as a time string (e.g., "3:45 PM")
 */
export function formatTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return target.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a date as date and time (e.g., "Jan 5, 2024 at 3:45 PM")
 */
export function formatDateTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(target)} at ${formatTime(target)}`;
}

/**
 * Format a date as a timestamp (e.g., "3:45 PM" for today, "Jan 5 at 3:45 PM" for this year)
 */
export function formatTimestamp(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;

  const isToday =
    target.getDate() === now.getDate() &&
    target.getMonth() === now.getMonth() &&
    target.getFullYear() === now.getFullYear();

  if (isToday) {
    return formatTime(target);
  }

  const isThisYear = target.getFullYear() === now.getFullYear();

  if (isThisYear) {
    return target.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return formatDateTime(target);
}

/**
 * Format a duration in milliseconds to a human-readable string
 * @example formatDuration(125000) => "2m 5s"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
}

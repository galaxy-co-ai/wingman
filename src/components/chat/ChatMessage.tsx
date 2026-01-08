/**
 * ChatMessage Component
 * Renders a single chat message (user, assistant, or system)
 */

import { memo, useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils';
import { formatDate } from '@/utils/format-date';
import { Icon, User, Bot, Copy, Check } from '@/components/shared';
import { ToolUsageChip } from './ToolUsageChip';
import { CodeBlock } from './CodeBlock';
import styles from './ChatMessage.module.css';
import type { Message } from '@/types';
import type { ComponentPropsWithoutRef } from 'react';

export interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onCopy?: () => void;
  onFileClick?: (path: string) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming = false,
  onCopy,
  onFileClick,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  }, [message.content, onCopy]);

  const roleLabel = isUser ? 'You' : 'Claude';
  const RoleIcon = isUser ? User : Bot;

  return (
    <article
      className={cn(
        styles.container,
        isUser && styles.user,
        isAssistant && styles.assistant,
        isStreaming && styles.streaming
      )}
      aria-label={`${message.role} message`}
    >
      <header className={styles.header}>
        <span className={styles.role}>
          <Icon icon={RoleIcon} size="sm" className={styles.roleIcon} />
          {roleLabel}
        </span>
        <time className={styles.timestamp} dateTime={message.createdAt}>
          {formatDate(message.createdAt)}
        </time>
      </header>

      <div className={styles.content}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const isInline = !match;

              if (isInline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }

              return (
                <CodeBlock
                  code={String(children).replace(/\n$/, '')}
                  language={match[1]}
                />
              );
            },
            // Ensure links open externally
            a: ({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
        {isStreaming && <span className={styles.cursor} aria-hidden="true" />}
      </div>

      {message.toolUsage && message.toolUsage.length > 0 && (
        <div className={styles.toolUsages} role="list" aria-label="Tool usage">
          {message.toolUsage.map((usage) => (
            <ToolUsageChip
              key={usage.id}
              usage={usage}
              onClick={() => onFileClick?.(usage.input?.path as string ?? '')}
            />
          ))}
        </div>
      )}

      {!isStreaming && (
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy message'}
          >
            <Icon icon={copied ? Check : Copy} size="xs" />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
    </article>
  );
});

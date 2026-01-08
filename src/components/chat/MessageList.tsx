/**
 * MessageList Component
 * Renders a scrollable list of chat messages with auto-scroll
 */

import { memo, useEffect, useRef, useCallback, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { Icon, MessageSquare, ChevronDown, Bot } from '@/components/shared';
import { Skeleton } from '@/components/shared';
import styles from './MessageList.module.css';
import type { Message } from '@/types';

export interface MessageListProps {
  messages: Message[];
  streamingMessageId?: string | null;
  isLoading?: boolean;
  isTyping?: boolean;
  onFileClick?: (path: string) => void;
}

export const MessageList = memo(function MessageList({
  messages,
  streamingMessageId,
  isLoading = false,
  isTyping = false,
  onFileClick,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const shouldAutoScroll = useRef(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length, streamingMessageId]);

  // Detect user scroll to disable auto-scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    shouldAutoScroll.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      shouldAutoScroll.current = true;
      setShowScrollButton(false);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Skeleton height="80px" />
        <Skeleton height="120px" />
        <Skeleton height="60px" />
      </div>
    );
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Icon icon={MessageSquare} size="xl" className={styles.emptyIcon} />
        <h3>Start a conversation</h3>
        <p>Send a message to begin working with Claude</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.container}
        onScroll={handleScroll}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={message.id === streamingMessageId}
            onFileClick={onFileClick}
          />
        ))}

        {isTyping && !streamingMessageId && (
          <div className={styles.typingIndicator}>
            <Icon icon={Bot} size="sm" />
            <span>Claude is thinking</span>
            <div className={styles.typingDots}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        )}
      </div>

      {showScrollButton && (
        <button
          className={styles.scrollButton}
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <Icon icon={ChevronDown} size="sm" className={styles.scrollIcon} />
        </button>
      )}
    </div>
  );
});

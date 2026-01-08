/**
 * InputArea Component
 * Message input with send button and keyboard shortcuts
 */

import { memo, useCallback, useRef, useState, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { cn } from '@/utils';
import { Icon, Send, Square } from '@/components/shared';
import styles from './InputArea.module.css';
import type { ClaudeStatus } from '@/types';

export interface InputAreaProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  status?: ClaudeStatus;
  disabled?: boolean;
  placeholder?: string;
}

const statusLabels: Record<ClaudeStatus, string> = {
  starting: 'Starting...',
  ready: 'Ready',
  busy: 'Processing...',
  stopped: 'Disconnected',
  error: 'Error',
};

export const InputArea = memo(function InputArea({
  onSend,
  onCancel,
  status = 'stopped',
  disabled = false,
  placeholder = 'Send a message...',
}: InputAreaProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBusy = status === 'busy';
  const isDisabled = disabled || status === 'stopped' || status === 'error';
  const canSend = message.trim().length > 0 && !isBusy && !isDisabled;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSend) return;

    onSend(message.trim());
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [canSend, message, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter without shift sends message
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
        return;
      }

      // Escape cancels current response if busy
      if (e.key === 'Escape' && isBusy && onCancel) {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, isBusy, onCancel]
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.inputRow}>
        <div className={styles.textareaWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={1}
            aria-label="Message input"
          />
        </div>

        {isBusy ? (
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
            aria-label="Cancel response"
          >
            <Icon icon={Square} size="md" />
          </button>
        ) : (
          <button
            type="button"
            className={styles.sendButton}
            onClick={handleSubmit}
            disabled={!canSend}
            aria-label="Send message"
          >
            <Icon icon={Send} size="md" />
          </button>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.shortcut}>
          <kbd className={styles.kbd}>Enter</kbd>
          <span>to send,</span>
          <kbd className={styles.kbd}>Shift</kbd>
          <span>+</span>
          <kbd className={styles.kbd}>Enter</kbd>
          <span>for new line</span>
        </div>

        <div className={styles.status}>
          <span className={cn(styles.statusDot, styles[status])} />
          <span>{statusLabels[status]}</span>
        </div>
      </div>
    </div>
  );
});

/**
 * ChatSession Component
 * Container component managing a single chat session
 */

import { memo, useCallback } from 'react';
import { useSessionsStore, selectSessionStatus } from '@/stores';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { Icon, Folder, MoreVertical, Sparkles } from '@/components/shared';
import { Button } from '@/components/shared';
import styles from './ChatSession.module.css';
import type { Session, Message, ClaudeStatus } from '@/types';

export interface ChatSessionProps {
  session: Session | null;
  messages: Message[];
  streamingMessageId?: string | null;
  isLoading?: boolean;
  onSend: (message: string) => void;
  onCancel?: () => void;
  onNewSession?: () => void;
  onFileClick?: (path: string) => void;
}

export const ChatSession = memo(function ChatSession({
  session,
  messages,
  streamingMessageId,
  isLoading = false,
  onSend,
  onCancel,
  onNewSession,
  onFileClick,
}: ChatSessionProps) {
  // Get session status from store
  const status = useSessionsStore(
    session ? selectSessionStatus(session.id) : () => 'stopped' as ClaudeStatus
  );

  const handleSend = useCallback(
    (content: string) => {
      onSend(content);
    },
    [onSend]
  );

  // No session state
  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.noSession}>
          <Icon icon={Sparkles} size="xl" className={styles.noSessionIcon} />
          <h2>No active session</h2>
          <p>Create a new session to start chatting with Claude</p>
          {onNewSession && (
            <Button variant="primary" onClick={onNewSession}>
              New Session
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{session.title}</h1>
          <span className={styles.workingDir} title={session.workingDirectory}>
            <Icon icon={Folder} size="xs" />
            {formatPath(session.workingDirectory)}
          </span>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            aria-label="Session options"
          >
            <Icon icon={MoreVertical} size="sm" />
          </button>
        </div>
      </header>

      <div className={styles.messages}>
        <MessageList
          messages={messages}
          streamingMessageId={streamingMessageId}
          isLoading={isLoading}
          isTyping={status === 'busy' && !streamingMessageId}
          onFileClick={onFileClick}
        />
      </div>

      <div className={styles.input}>
        <InputArea
          onSend={handleSend}
          onCancel={onCancel}
          status={status}
          disabled={!session}
        />
      </div>
    </div>
  );
});

// Helper to format path for display
function formatPath(path: string): string {
  // Show only last 2-3 parts of the path
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  if (parts.length <= 3) {
    return parts.join('/');
  }
  return '.../' + parts.slice(-2).join('/');
}

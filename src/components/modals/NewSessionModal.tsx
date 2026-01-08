/**
 * NewSessionModal Component
 * Modal for creating a new chat session
 */

import { memo, useState, useCallback } from 'react';
import { Modal } from './Modal';
import { Button, Input } from '@/components/shared';
import { Icon, Folder } from '@/components/shared';
import { systemService } from '@/services/system';
import styles from './NewSessionModal.module.css';

export interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { workingDirectory: string; title?: string; projectId?: string }) => void;
  defaultDirectory?: string;
  isSubmitting?: boolean;
}

export const NewSessionModal = memo(function NewSessionModal({
  isOpen,
  onClose,
  onSubmit,
  defaultDirectory = '',
  isSubmitting = false,
}: NewSessionModalProps) {
  const [workingDirectory, setWorkingDirectory] = useState(defaultDirectory);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Handle directory selection
  const handleSelectDirectory = useCallback(async () => {
    try {
      const selected = await systemService.selectDirectory('Select working directory');
      if (selected) {
        setWorkingDirectory(selected);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to select directory:', err);
      setError('Failed to open directory picker');
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!workingDirectory.trim()) {
        setError('Please select a working directory');
        return;
      }

      onSubmit({
        workingDirectory: workingDirectory.trim(),
        title: title.trim() || undefined,
      });
    },
    [workingDirectory, title, onSubmit]
  );

  // Reset form when modal closes
  const handleClose = useCallback(() => {
    setWorkingDirectory(defaultDirectory);
    setTitle('');
    setError(null);
    onClose();
  }, [defaultDirectory, onClose]);

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </Button>
      <Button
        variant="primary"
        type="submit"
        form="new-session-form"
        disabled={!workingDirectory.trim() || isSubmitting}
        loading={isSubmitting}
      >
        Create Session
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New Session"
      footer={footer}
      size="md"
    >
      <form id="new-session-form" onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="working-directory" className={styles.label}>
            Working Directory <span className={styles.required}>*</span>
          </label>
          <div className={styles.directoryInput}>
            <Input
              id="working-directory"
              value={workingDirectory}
              onChange={(e) => {
                setWorkingDirectory(e.target.value);
                setError(null);
              }}
              placeholder="Select or enter a directory path"
              className={styles.directoryField}
              aria-describedby={error ? 'directory-error' : undefined}
            />
            <Button
              variant="secondary"
              type="button"
              onClick={handleSelectDirectory}
              aria-label="Browse for directory"
              className={styles.browseButton}
            >
              <Icon icon={Folder} size="sm" />
              Browse
            </Button>
          </div>
          {error && (
            <p id="directory-error" className={styles.error}>
              {error}
            </p>
          )}
          <p className={styles.hint}>
            This is where Claude will execute commands and access files.
          </p>
        </div>

        <div className={styles.field}>
          <label htmlFor="session-title" className={styles.label}>
            Session Title <span className={styles.optional}>(optional)</span>
          </label>
          <Input
            id="session-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Add user authentication"
            maxLength={100}
          />
          <p className={styles.hint}>
            Give your session a descriptive name for easy reference.
          </p>
        </div>
      </form>
    </Modal>
  );
});

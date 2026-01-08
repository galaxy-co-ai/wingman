import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  size?: InputSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    size = 'md',
    icon,
    iconRight,
    fullWidth = false,
    className,
    id,
    disabled,
    ...props
  },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const hasError = !!error;

  return (
    <div className={cn(styles.wrapper, { [styles.fullWidth]: fullWidth }, className)}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div
        className={cn(styles.inputWrapper, styles[size], {
          [styles.hasError]: hasError,
          [styles.disabled]: disabled,
        })}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={styles.input}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {iconRight && <span className={styles.iconRight}>{iconRight}</span>}
      </div>
      {error && (
        <p id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
});

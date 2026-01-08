/**
 * CodeBlock Component
 * Renders syntax-highlighted code with copy functionality
 */

import { memo, useCallback, useState, useEffect } from 'react';
import { codeToHtml } from 'shiki';
import { cn } from '@/utils';
import { Icon, Copy, Check } from '@/components/shared';
import styles from './CodeBlock.module.css';

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock = memo(function CodeBlock({
  code,
  language = 'text',
  filename,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Highlight code with shiki
  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const html = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        });
        if (!cancelled) {
          setHighlightedHtml(html);
          setIsLoading(false);
        }
      } catch {
        // Fallback to plain text if language not supported
        if (!cancelled) {
          setHighlightedHtml(`<pre><code>${escapeHtml(code)}</code></pre>`);
          setIsLoading(false);
        }
      }
    }

    highlight();

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className={cn(styles.container, showLineNumbers && styles.withLineNumbers)}>
      <div className={styles.header}>
        <div>
          {filename && <span className={styles.filename}>{filename}</span>}
          {!filename && language && <span className={styles.language}>{language}</span>}
        </div>
        <button
          className={cn(styles.copyButton, copied && styles.copied)}
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy code'}
        >
          <Icon icon={copied ? Check : Copy} size="xs" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className={styles.code}>
        {isLoading ? (
          <code>{code}</code>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: extractCodeContent(highlightedHtml) }} />
        )}
      </div>
    </div>
  );
});

// Helper to escape HTML entities
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Extract just the code content from shiki's output
function extractCodeContent(html: string): string {
  // Shiki wraps code in <pre><code>...</code></pre>
  // We just want the inner content since we have our own styling
  const match = html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
  if (match) {
    return `<code>${match[1]}</code>`;
  }
  return html;
}

import React, { useEffect } from 'react';
import './drawerAndSupport.css';

export default function SjToast({
  message = '',
  isVisible = false,
  isError = false,
  onDismiss,
  duration = 2600,
}) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`sj-toast ${isVisible ? 'sj-toast-show' : ''} ${isError ? 'sj-toast-err' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="sj-toast-icon">
        {isError ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span>{message}</span>
    </div>
  );
}


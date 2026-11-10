import React, { useState, useEffect, useRef } from 'react';
import './jobFeed.css';
import SjButton from './primitives/SjButton';

export default function SjSearchModal({
  isOpen,
  onClose,
  initialValues = { q: '', exp: '', loc: '' },
  onSearch,
  onClear,
}) {
  const [q, setQ] = useState(initialValues.q || '');
  const [exp, setExp] = useState(initialValues.exp || '');
  const [loc, setLoc] = useState(initialValues.loc || '');

  const qInputRef = useRef(null);
  const panelRef = useRef(null);

  // Sync initial values on open
  useEffect(() => {
    if (isOpen) {
      setQ(initialValues.q || '');
      setExp(initialValues.exp || '');
      setLoc(initialValues.loc || '');
      setTimeout(() => {
        if (qInputRef.current) qInputRef.current.focus();
      }, 50);
    }
  }, [isOpen, initialValues]);

  // Lock body scroll and listen for Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSearch) {
      onSearch({
        q: q.trim(),
        exp: exp,
        loc: loc.trim(),
      });
    }
    onClose();
  };

  const handleClear = () => {
    setQ('');
    setExp('');
    setLoc('');
    if (onClear) onClear();
    if (onSearch) onSearch({ q: '', exp: '', loc: '' });
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div
      className="sj-search-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Search jobs"
      onClick={(e) => {
        if (panelRef.current && !panelRef.current.contains(e.target)) {
          onClose();
        }
      }}
    >
      <div ref={panelRef} className="sj-search-panel">
        <button
          type="button"
          className="sj-modal-close-btn"
          onClick={onClose}
          aria-label="Close search"
        >
          &times;
        </button>

        <small>Search jobs</small>

        <form onSubmit={handleSubmit}>
          <div className="sj-sentence">
            Show me{' '}
            <input
              ref={qInputRef}
              id="sj-modal-q"
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="keyword / designation / company"
              aria-label="Keyword, designation or company"
              autoComplete="off"
              style={{ width: '10.5em' }}
            />{' '}
            jobs for{' '}
            <select
              id="sj-modal-exp"
              value={exp}
              onChange={(e) => setExp(e.target.value)}
              aria-label="Experience requirement"
            >
              <option value="">any experience</option>
              <option value="0">Fresher</option>
              <option value="1">1 year</option>
              <option value="2">2 years</option>
              <option value="3">3 years</option>
              <option value="4">4 years</option>
              <option value="5">5 years</option>
              <option value="7">7 years</option>
              <option value="10">10+ years</option>
            </select>{' '}
            in{' '}
            <input
              id="sj-modal-loc"
              type="text"
              value={loc}
              onChange={(e) => setLoc(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="any location"
              aria-label="Location"
              autoComplete="off"
              style={{ width: '6.5em' }}
            />
            .
          </div>

          <div className="sj-search-actions">
            <SjButton
              type="submit"
              variant="primary"
              size="lg"
            >
              Show jobs &rarr;
            </SjButton>

            <button
              type="button"
              className="sj-btn sj-btn-link"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


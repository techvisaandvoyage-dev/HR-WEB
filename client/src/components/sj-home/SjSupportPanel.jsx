import React, { useState } from 'react';
import './drawerAndSupport.css';
import SjButton from './primitives/SjButton';

export default function SjSupportPanel({
  isOpen = false,
  onToggle,
  onClose,
  onSubmitRequest,
}) {
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'updates'
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic || !message) return;
    if (onSubmitRequest) {
      onSubmitRequest({ fullName, email, mobile, topic, message });
    }
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setStep(1);
    setTopic('');
    setMessage('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="sfab"
        type="button"
        className="sj-support-fab"
        onClick={onToggle}
        aria-label="Support Assistant"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
              <rect x="3" y="14" width="4" height="6" rx="2" />
              <rect x="17" y="14" width="4" height="6" rx="2" />
            </>
          )}
        </svg>
        <span className="sj-support-badge-dot" />
      </button>

      {/* Flyout Panel */}
      {isOpen && (
        <aside id="sup" className="sj-support-flyout" role="dialog" aria-label="SahiJob Support">
          {/* Header */}
          <div className="sj-support-head">
            <span className="w-10 h-10 rounded-xl bg-[var(--sj-acc)] text-[var(--sj-ink)] grid place-items-center shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <b className="text-base leading-tight block">SahiJob Support</b>
              <div className="text-xs opacity-75">Quick resolution assistance</div>
            </div>
            <button
              type="button"
              className="text-white hover:opacity-75 transition-opacity"
              onClick={onClose}
              aria-label="Close support"
            >
              &times;
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="sj-support-tabs">
            <button
              type="button"
              className={activeTab === 'new' ? 'sj-on' : ''}
              onClick={() => setActiveTab('new')}
            >
              New request
            </button>
            <button
              type="button"
              className={activeTab === 'updates' ? 'sj-on' : ''}
              onClick={() => setActiveTab('updates')}
            >
              Updates &amp; chat
            </button>
          </div>

          {/* Body */}
          <div className="sj-support-body">
            {activeTab === 'new' ? (
              submitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-14 h-14 bg-[var(--sj-accS)] text-[var(--sj-ok)] rounded-2xl mx-auto grid place-items-center font-bold text-2xl">
                    &check;
                  </div>
                  <h4 className="font-bold text-lg text-[var(--sj-ink)]">Request submitted</h4>
                  <p className="text-xs text-[var(--sj-mute)] max-w-xs mx-auto">
                    We will reply on your registered email shortly. Check Updates &amp; chat anytime.
                  </p>
                  <SjButton variant="primary" size="sm" onClick={handleReset}>
                    New request
                  </SjButton>
                </div>
              ) : step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <b className="text-sm text-[var(--sj-ink)]">Your contact details</b>
                    <p className="text-xs text-[var(--sj-mute)]">Fill in your details to get resolution</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--sj-ink)] block">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      className="sj-input sj-input-box"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--sj-ink)] block">
                      Email ID *
                    </label>
                    <input
                      type="email"
                      className="sj-input sj-input-box"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--sj-ink)] block">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      className="sj-input sj-input-box"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <SjButton
                      variant="primary"
                      className="w-full"
                      disabled={!fullName || !email || !mobile}
                      onClick={() => setStep(2)}
                    >
                      Continue &rarr;
                    </SjButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <b className="text-sm text-[var(--sj-ink)]">How can we help?</b>
                    <p className="text-xs text-[var(--sj-mute)]">Choose a topic and describe the issue</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--sj-ink)] block">
                      Topic *
                    </label>
                    <select
                      className="sj-input sj-input-box"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      required
                    >
                      <option value="">Select a topic</option>
                      <option value="account">Login or account issue</option>
                      <option value="apply">Applying to jobs</option>
                      <option value="employer">Employer / Job posting</option>
                      <option value="other">Other question</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--sj-ink)] block">
                      Message *
                    </label>
                    <textarea
                      rows={4}
                      className="sj-input sj-input-box h-auto py-3"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what happened..."
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <SjButton
                      variant="outline"
                      type="button"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </SjButton>
                    <SjButton
                      variant="primary"
                      type="submit"
                      className="flex-1"
                      disabled={!topic || !message}
                    >
                      Submit request
                    </SjButton>
                  </div>
                </form>
              )
            ) : (
              <div className="text-center py-10 space-y-2 text-[var(--sj-mute)]">
                <svg className="w-10 h-10 mx-auto text-[var(--sj-mute)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <b className="text-sm text-[var(--sj-ink)] block">No open chats</b>
                <p className="text-xs">Once you submit a ticket, live conversation replies will appear here.</p>
              </div>
            )}
          </div>
        </aside>
      )}
    </>
  );
}


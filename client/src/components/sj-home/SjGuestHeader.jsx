import React from 'react';
import './headers.css';

export default function SjGuestHeader({
  onOpenEmployeeLogin,
  onOpenEmployerLogin,
  onOpenConsultantLogin,
  onLogoClick,
}) {
  return (
    <header className="sj-header" id="gh">
      <div className="sj-nav-inner">
        <a
          href="/"
          className="sj-logo mr-auto"
          onClick={(e) => {
            if (onLogoClick) {
              e.preventDefault();
              onLogoClick();
            }
          }}
          aria-label="SahiJob Home"
        >
          Sahi<b>Job</b>.com
        </a>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="sj-guest-btn-pill sj-guest-btn-employee"
            onClick={onOpenEmployeeLogin}
          >
            Employee Login
          </button>

          <button
            type="button"
            className="sj-guest-btn-pill sj-guest-btn-employer"
            onClick={onOpenEmployerLogin}
          >
            Employer Login
          </button>

          <button
            type="button"
            className="sj-guest-btn-pill sj-guest-btn-consultant"
            onClick={onOpenConsultantLogin}
          >
            Consultant Login
          </button>
        </div>
      </div>
    </header>
  );
}


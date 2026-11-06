import React from 'react';

const SUPPORT_EMAIL = 'contact@sahijob.com';

export default function BlockedAccountPage({ reason }) {
  const contactSubject = encodeURIComponent('Help with blocked SahiJob account');

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4.5 6v5.5c0 4.4 3.2 7.8 7.5 9.5 4.3-1.7 7.5-5.1 7.5-9.5V6L12 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 3h.01" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-black tracking-tight text-gray-900">Your account is blocked</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          You can no longer access your account. Contact our support team if you think this is a mistake.
        </p>
        {reason && (
          <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-left">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-rose-700">Reason</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-rose-900">{reason}</p>
          </div>
        )}
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${contactSubject}`}
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m4 7 8 6 8-6" />
          </svg>
          Contact support
        </a>
        <p className="mt-4 text-xs text-gray-500">{SUPPORT_EMAIL}</p>
      </section>
    </main>
  );
}

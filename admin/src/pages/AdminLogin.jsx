import React, { useState } from 'react';

const configuredEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@jobs.com';
const configuredPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@123';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (email.trim().toLowerCase() !== configuredEmail.toLowerCase() || password !== configuredPassword) {
      setError('Invalid email or password.');
      return;
    }

    sessionStorage.setItem('adminAuthenticated', 'true');
    onLogin();
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <section className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
            Admin Portal
          </h1>
          <p className="text-gray-500 mt-2">Sign in to manage your website footer.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setError(''); }}
              placeholder="admin@example.com"
              autoComplete="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => { setPassword(event.target.value); setError(''); }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-green-700 hover:text-green-800"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button type="submit" className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
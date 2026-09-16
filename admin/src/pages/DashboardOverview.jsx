import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  ArrowUpRight, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone,
  RefreshCw,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function DashboardOverview({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/admin/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to fetch dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Unable to connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totals = stats?.totals || {
    totalEmployees: 0,
    totalEmployers: 0,
    totalJobs: 0,
    activeJobs: 0,
    closedJobs: 0,
    totalApplications: 0
  };

  const trends = stats?.registrationTrends || [];
  const maxTrend = Math.max(...trends.map(t => Math.max(t.employees, t.employers, 1)), 5);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">sahijob.com Portal Overview</h1>
          <p className="text-gray-500 mt-1">Real-time statistics for registered employers, job seekers, and portal activity.</p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchStats} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Total Registered Employers */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('employers')}
          className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              Companies <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              {loading ? '...' : totals.totalEmployers}
            </h3>
            <p className="text-sm font-medium text-gray-500 mt-1">Total Registered Employers</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Hiring organizations</span>
            <span className="font-semibold text-blue-600">View list &rarr;</span>
          </div>
        </div>

        {/* 2. Total Jobs Posted */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('employers')}
          className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-purple-300"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              {totals.activeJobs} Active
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              {loading ? '...' : totals.totalJobs}
            </h3>
            <p className="text-sm font-medium text-gray-500 mt-1">Total Jobs Posted</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{totals.closedJobs} closed / expired</span>
            <span className="font-semibold text-purple-600">{totals.activeJobs} live vacancies</span>
          </div>
        </div>

        {/* 3. Total Registered Employees */}
        <div 
          onClick={() => onNavigateTab && onNavigateTab('employees')}
          className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-emerald-300"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              Job Seekers <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              {loading ? '...' : totals.totalEmployees}
            </h3>
            <p className="text-sm font-medium text-gray-500 mt-1">Total Registered Employees</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Candidates looking for jobs</span>
            <span className="font-semibold text-emerald-600">View list &rarr;</span>
          </div>
        </div>

        {/* 4. Total Applications Submitted */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              Applications
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              {loading ? '...' : totals.totalApplications}
            </h3>
            <p className="text-sm font-medium text-gray-500 mt-1">Total Applications Submitted</p>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Candidate submissions</span>
            <span className="font-semibold text-amber-600">Platform activity</span>
          </div>
        </div>
      </div>

      {/* Registration Trends Chart (Last 7 Days) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">User Signups & Registration Activity</h2>
            <p className="text-xs text-gray-500 mt-0.5">Daily breakdown of employees and employers joining sahijob.com</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500"></div>
              <span className="text-gray-600">Employees ({totals.totalEmployees})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
              <span className="text-gray-600">Employers ({totals.totalEmployers})</span>
            </div>
          </div>
        </div>

        {trends.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No activity recorded for this period.</div>
        ) : (
          <div className="grid grid-cols-7 gap-2 pt-6 items-end h-48 border-b border-gray-100">
            {trends.map((item, idx) => {
              const empHeight = Math.max((item.employees / maxTrend) * 120, 4);
              const emprHeight = Math.max((item.employers / maxTrend) * 120, 4);
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="flex items-end gap-1.5 w-full justify-center">
                    {/* Employee Bar */}
                    <div 
                      style={{ height: `${empHeight}px` }} 
                      className="w-4 sm:w-6 bg-emerald-500 rounded-t-md group-hover:bg-emerald-600 transition-all relative"
                      title={`${item.employees} Employees on ${item.date}`}
                    >
                      {item.employees > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.employees}
                        </span>
                      )}
                    </div>
                    {/* Employer Bar */}
                    <div 
                      style={{ height: `${emprHeight}px` }} 
                      className="w-4 sm:w-6 bg-blue-500 rounded-t-md group-hover:bg-blue-600 transition-all relative"
                      title={`${item.employers} Employers on ${item.date}`}
                    >
                      {item.employers > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.employers}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-gray-500">{item.date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Side-by-Side Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employers */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Recently Registered Employers</h3>
                  <p className="text-xs text-gray-500">Latest companies and recruiters joining</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('employers')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {(!stats?.recentEmployers || stats.recentEmployers.length === 0) ? (
                <div className="py-8 text-center text-gray-400 text-sm">No employers registered yet.</div>
              ) : (
                stats.recentEmployers.map((empr) => (
                  <div key={empr._id} className="py-3.5 flex items-center justify-between hover:bg-gray-50/70 rounded-xl px-2.5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {empr.companyName ? empr.companyName.charAt(0).toUpperCase() : (empr.fullName ? empr.fullName.charAt(0).toUpperCase() : 'C')}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{empr.companyName || empr.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{empr.email}</p>
                        {empr.industry && (
                          <p className="text-[11px] text-blue-700 font-medium truncate mt-0.5">{empr.industry}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-[11px] text-gray-400 block">
                        {new Date(empr.createdAt).toLocaleDateString()}
                      </span>
                      {empr.location && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {empr.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Employees */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Recently Registered Employees</h3>
                  <p className="text-xs text-gray-500">Latest job seekers who signed up</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('employees')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {(!stats?.recentEmployees || stats.recentEmployees.length === 0) ? (
                <div className="py-8 text-center text-gray-400 text-sm">No employees registered yet.</div>
              ) : (
                stats.recentEmployees.map((emp) => (
                  <div key={emp._id} className="py-3.5 flex items-center justify-between hover:bg-gray-50/70 rounded-xl px-2.5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{emp.name || 'Unnamed User'}</p>
                        <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                        {emp.designation && (
                          <p className="text-[11px] text-emerald-700 font-medium truncate mt-0.5">{emp.designation}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="text-[11px] text-gray-400 block">
                        {new Date(emp.createdAt).toLocaleDateString()}
                      </span>
                      {emp.location && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {emp.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

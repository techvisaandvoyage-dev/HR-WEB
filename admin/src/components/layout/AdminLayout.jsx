import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  SlidersHorizontal, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout({ children, activeTab, onSelectTab, onLogout }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Platform analytics'
    },
    {
      id: 'employers',
      label: 'Employers',
      icon: Building2,
      description: 'Companies & Job Posts'
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: Users,
      description: 'Job seekers directory'
    },
    {
      id: 'footer',
      label: 'Footer Editor',
      icon: SlidersHorizontal,
      description: 'Content & Page links'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/20 shrink-0">
            sj
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight leading-none">
              sahijob<span className="text-emerald-600">.com</span>
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 border border-emerald-100">
              <ShieldCheck className="w-3 h-3" /> Admin Portal
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Management</p>
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all text-left ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-200/80 font-bold'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="leading-tight">{item.label}</p>
                      <p className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-emerald-600/80' : 'text-gray-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign Out Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-bold text-gray-800">Master Admin</p>
            <p className="text-[11px] text-gray-400">admin@sahijob.com</p>
          </div>
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50/70 border border-red-100 hover:bg-red-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-50/50">
        {children}
      </main>
    </div>
  );
}

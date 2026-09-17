import React from 'react';
import BrandLogo from '../common/BrandLogo';
import { 
  Home, 
  SlidersHorizontal, 
  LayoutDashboard, 
  Building2, 
  Users, 
  LogOut, 
  Settings,
  ShieldCheck
} from 'lucide-react';

/**
 * AdminLayout Component
 * Top Navigation Bar layout modeled after Redash Admin CMS,
 * featuring horizontal primary tabs and admin profile controls.
 */
export default function AdminLayout({ children, activeTab, onSelectTab, onLogout }) {
  const topNavTabs = [
    {
      id: 'homepage',
      label: 'Homepage',
      icon: Home,
      badge: 'CMS'
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: Users
    },
    {
      id: 'footer',
      label: 'Footer & Icons',
      icon: SlidersHorizontal
    },
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      id: 'employers',
      label: 'Employers',
      icon: Building2
    }
  ];

  return (
    <div className="h-screen bg-gray-100/70 text-gray-900 font-sans antialiased flex flex-col selection:bg-green-100 selection:text-green-900 overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-50 shadow-xs h-16">
        <div className="w-full px-4 sm:px-8 lg:px-10 h-full flex items-center justify-between gap-4">
          
          {/* Brand / Logo */}
          <div className="flex items-center shrink-0">
            <BrandLogo onClick={() => onSelectTab('homepage')} defaultHeight={32} />
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {topNavTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-green-50 text-green-800 border border-green-200/90 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-green-700' : 'text-gray-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Admin Profile & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
              <div className="w-6 h-6 rounded-full bg-green-700 text-white flex items-center justify-center text-xs font-black">
                A
              </div>
              <span className="text-xs font-bold text-gray-800">Admin User</span>
            </div>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200 cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-hidden flex flex-col min-h-0">
        {children}
      </main>

    </div>
  );
}

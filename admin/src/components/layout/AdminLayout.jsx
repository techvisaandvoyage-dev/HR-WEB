import React, { useState, useRef, useEffect } from 'react';
import BrandLogo from '../common/BrandLogo';
import { 
  Home, 
  SlidersHorizontal, 
  LayoutDashboard, 
  Building2, 
  Briefcase,
  Users, 
  LogOut, 
  Settings,
  ShieldCheck,
  Database,
  LifeBuoy,
  Mail
} from 'lucide-react';

/**
 * AdminLayout Component
 * Top Navigation Bar layout modeled after Redash Admin CMS,
 * featuring horizontal primary tabs and admin profile controls.
 */
export default function AdminLayout({ children, activeTab, onSelectTab, onLogout }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  const adminEmail = sessionStorage.getItem('adminEmail') || localStorage.getItem('adminEmail') || 'Admin User';
  const initialChar = (adminEmail && adminEmail !== 'Admin User' ? adminEmail[0] : 'A').toUpperCase();

  // Close dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileMenuOpen]);

  const topNavTabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      id: 'homepage',
      label: 'Homepage',
      icon: Home,
      badge: 'CMS'
    },
    {
      id: 'employees',
      label: 'Candidates',
      icon: Users
    },
    {
      id: 'employers',
      label: 'Employers',
      icon: Building2
    },
    {
      id: 'consultants',
      label: 'Consultants',
      icon: Briefcase
    },
    {
      id: 'support',
      label: 'Support',
      icon: LifeBuoy
    },
    {
      id: 'footer',
      label: 'Footer & Icons',
      icon: SlidersHorizontal
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  return (
    <div className="h-screen bg-gray-100/70 text-gray-900 font-sans antialiased flex flex-col selection:bg-green-100 selection:text-green-900 overflow-hidden">
      
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-50 shadow-xs h-16">
        <div className="w-full px-4 sm:px-8 lg:px-10 h-full flex items-center justify-between gap-4">
          
          {/* Brand / Logo */}
          <div className="flex items-center shrink-0">
            <BrandLogo onClick={() => onSelectTab('overview')} defaultHeight={32} />
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

          {/* Right Admin Round Profile with Click Dropdown */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-sm text-white bg-gradient-to-br from-green-600 to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border-2 ${
                profileMenuOpen
                  ? 'ring-2 ring-green-600 ring-offset-2 border-white'
                  : 'border-white hover:ring-2 hover:ring-green-400/60 hover:ring-offset-1'
              }`}
              title="Admin Account Profile"
              aria-expanded={profileMenuOpen}
              aria-label="Admin Profile Menu"
            >
              {initialChar}
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Admin Info Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-600 to-emerald-700 text-white flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
                    {initialChar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Admin Portal
                      </span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Active Session" />
                    </div>
                    <p className="text-xs font-bold text-gray-900 truncate" title={adminEmail}>
                      {adminEmail}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer group"
                  >
                    <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-700 transition-colors" />
                    <span>Sign Out / Logout</span>
                  </button>
                </div>
              </div>
            )}
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

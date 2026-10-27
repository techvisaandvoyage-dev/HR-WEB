import React, { useState, useEffect } from 'react';
import AdminLayout from './components/layout/AdminLayout';
import HomepageCMS from './pages/homepage-cms/HomepageCMS';
import DashboardOverview from './pages/DashboardOverview';
import EmployeesTab from './pages/EmployeesTab';
import EmployersTab from './pages/EmployersTab';
import ConsultantsTab from './pages/ConsultantsTab';
import FooterEditor from './pages/FooterEditor';
import SettingsTab from './pages/SettingsTab';
import AdminLogin from './pages/AdminLogin';
import SupportTab from './pages/SupportTab';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('adminAuthenticated') === 'true');
  
  const VALID_TABS = ['overview', 'homepage', 'employees', 'employers', 'consultants', 'support', 'footer', 'backup', 'settings', 'seo'];

  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    if (urlTab === 'all-jobs' || urlTab === 'jobs') {
      params.set('tab', 'overview');
      params.set('subtab', 'jobs');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
      return 'overview';
    }
    if (urlTab === 'applications') {
      params.set('tab', 'overview');
      params.set('subtab', 'applications');
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
      return 'overview';
    }
    if (urlTab === 'candidate' || urlTab === 'candidates') {
      return 'employees';
    }
    if (urlTab && VALID_TABS.includes(urlTab)) {
      return urlTab;
    }
    const saved = localStorage.getItem('adminActiveTab');
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
    return 'overview';
  });

  const handleSelectTab = (newTab) => {
    // Gracefully route jobs & applications to overview subtabs so screen never goes blank
    if (newTab === 'all-jobs' || newTab === 'jobs') {
      setActiveTab('overview');
      localStorage.setItem('adminActiveTab', 'overview');
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'overview');
      params.set('subtab', 'jobs');
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ isSentinel: false, adminApp: true, tab: 'overview', subtab: 'jobs' }, '', newUrl);
      return;
    }
    if (newTab === 'applications') {
      setActiveTab('overview');
      localStorage.setItem('adminActiveTab', 'overview');
      const params = new URLSearchParams(window.location.search);
      params.set('tab', 'overview');
      params.set('subtab', 'applications');
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState({ isSentinel: false, adminApp: true, tab: 'overview', subtab: 'applications' }, '', newUrl);
      return;
    }

    const safeTab = VALID_TABS.includes(newTab) ? newTab : 'overview';
    setActiveTab(safeTab);
    localStorage.setItem('adminActiveTab', safeTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', safeTab);
    
    // Clean up specific sub-keys when changing main tabs
    if (safeTab !== 'employees' && safeTab !== 'employers' && safeTab !== 'consultants') {
      params.delete('section');
      params.delete('step');
      params.delete('authSub');
    }
    if (safeTab !== 'employers' && safeTab !== 'consultants' && safeTab !== 'footer' && safeTab !== 'homepage' && safeTab !== 'overview') {
      params.delete('subtab');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ isSentinel: false, adminApp: true, tab: safeTab }, '', newUrl);
  };

  useEffect(() => {
    // Normalize URL query params
    const params = new URLSearchParams(window.location.search);
    let tabFromUrl = params.get('tab');
    if (!tabFromUrl || !VALID_TABS.includes(tabFromUrl)) {
      tabFromUrl = activeTab || 'overview';
      params.set('tab', tabFromUrl);
    }
    if (params.get('subtab') === 'overview') {
      params.delete('subtab');
    }
    const currentUrl = `${window.location.pathname}?${params.toString()}`;

    // Establish multi-layer Sentinel history barriers so browser back button NEVER exits Admin
    try {
      window.history.replaceState({ isSentinel: true, adminApp: true }, '', currentUrl);
      window.history.pushState({ isSentinel: true, adminApp: true }, '', currentUrl);
      window.history.pushState({ isSentinel: false, adminApp: true, tab: tabFromUrl }, '', currentUrl);
    } catch (_) {}

    const handlePopState = (e) => {
      // If user hit the sentinel barrier or state outside admin:
      if (!e.state || e.state.isSentinel || !e.state.adminApp) {
        const curParams = new URLSearchParams(window.location.search);
        let curTab = curParams.get('tab');
        if (!curTab || !VALID_TABS.includes(curTab)) {
          curTab = 'overview';
          curParams.set('tab', 'overview');
          curParams.delete('subtab');
        }
        if (curParams.get('subtab') === 'overview') {
          curParams.delete('subtab');
        }
        const safeUrl = `${window.location.pathname}?${curParams.toString()}`;
        // Re-push usable state on top of the sentinel barrier to keep user inside Admin
        window.history.pushState({ isSentinel: false, adminApp: true, tab: curTab }, '', safeUrl);
        setActiveTab(curTab);
        localStorage.setItem('adminActiveTab', curTab);
        return;
      }

      // Normal internal back-navigation between tabs
      const currentParams = new URLSearchParams(window.location.search);
      const tab = currentParams.get('tab');
      if (tab === 'candidate' || tab === 'candidates') {
        setActiveTab('employees');
        localStorage.setItem('adminActiveTab', 'employees');
      } else if (tab && VALID_TABS.includes(tab)) {
        setActiveTab(tab);
        localStorage.setItem('adminActiveTab', tab);
      } else {
        setActiveTab('overview');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dynamically apply site favicon to Admin browser tab
  useEffect(() => {
    const syncFavicon = async () => {
      try {
        // Fast local cache check
        const cached = localStorage.getItem('sahijob_favicon_cache');
        if (cached) {
          const link = document.getElementById('admin-favicon') || document.querySelector("link[rel*='icon']");
          if (link) link.href = cached;
        }

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/seo/public`);
        const json = await res.json();
        if (json.success && json.data?.favicon) {
          localStorage.setItem('sahijob_favicon_cache', json.data.favicon);
          const link = document.getElementById('admin-favicon') || document.querySelector("link[rel*='icon']");
          if (link) link.href = json.data.favicon;
        }
      } catch (_) {}
    };
    syncFavicon();
  }, []);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AdminLayout 
      activeTab={activeTab} 
      onSelectTab={handleSelectTab}
      onLogout={() => {
        sessionStorage.removeItem('adminAuthenticated');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminEmail');
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
      }}
    >
      {activeTab === 'homepage' && (
        <HomepageCMS />
      )}
      {activeTab === 'footer' && (
        <div className="flex-1 w-full h-full overflow-y-auto">
          <FooterEditor />
        </div>
      )}
      {activeTab === 'overview' && (
        <div className="flex-1 w-full h-full overflow-y-auto">
          <DashboardOverview onNavigateTab={handleSelectTab} />
        </div>
      )}
      {activeTab === 'employees' && (
        <EmployeesTab />
      )}
      {activeTab === 'employers' && (
        <EmployersTab />
      )}
      {activeTab === 'consultants' && (
        <ConsultantsTab />
      )}
      {activeTab === 'support' && (
        <SupportTab />
      )}
      {(activeTab === 'backup' || activeTab === 'settings' || activeTab === 'seo') && (
        <SettingsTab initialSubTab={activeTab === 'seo' ? 'seo' : undefined} />
      )}
    </AdminLayout>
  );
}

export default App;

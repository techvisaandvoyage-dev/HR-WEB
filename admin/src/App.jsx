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
    setActiveTab(newTab);
    localStorage.setItem('adminActiveTab', newTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    
    // Clean up specific sub-keys when changing main tabs
    if (newTab !== 'employees' && newTab !== 'employers' && newTab !== 'consultants') {
      params.delete('section');
      params.delete('step');
      params.delete('authSub');
    }
    if (newTab !== 'employers' && newTab !== 'consultants' && newTab !== 'footer' && newTab !== 'homepage' && newTab !== 'overview') {
      params.delete('subtab');
    }
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  useEffect(() => {
    // Sync URL initially
    const params = new URLSearchParams(window.location.search);
    if (!params.get('tab')) {
      params.set('tab', activeTab);
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    }

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const tabFromUrl = currentParams.get('tab');
      if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
        localStorage.setItem('adminActiveTab', tabFromUrl);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

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

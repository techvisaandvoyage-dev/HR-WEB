import React, { useState, useEffect } from 'react';
import AdminLayout from './components/layout/AdminLayout';
import DashboardOverview from './pages/DashboardOverview';
import EmployeesTab from './pages/EmployeesTab';
import EmployersTab from './pages/EmployersTab';
import FooterEditor from './pages/FooterEditor';
import AdminLogin from './pages/AdminLogin';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('adminAuthenticated') === 'true');
  
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    if (urlTab && ['overview', 'employees', 'employers', 'footer'].includes(urlTab)) {
      return urlTab;
    }
    const saved = localStorage.getItem('adminActiveTab');
    if (saved && ['overview', 'employees', 'employers', 'footer'].includes(saved)) {
      return saved;
    }
    return 'overview';
  });

  const handleSelectTab = (newTab) => {
    setActiveTab(newTab);
    localStorage.setItem('adminActiveTab', newTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', newTab);
    // If switching main tab, clear old subtab if it's not relevant
    if (newTab !== 'employers' && newTab !== 'footer') {
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
      if (tabFromUrl && ['overview', 'employees', 'employers', 'footer'].includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
        localStorage.setItem('adminActiveTab', tabFromUrl);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AdminLayout 
      activeTab={activeTab} 
      onSelectTab={handleSelectTab}
      onLogout={() => {
        sessionStorage.removeItem('adminAuthenticated');
        setIsAuthenticated(false);
      }}
    >
      {activeTab === 'overview' && (
        <DashboardOverview onNavigateTab={handleSelectTab} />
      )}
      {activeTab === 'employees' && (
        <EmployeesTab />
      )}
      {activeTab === 'employers' && (
        <EmployersTab />
      )}
      {activeTab === 'footer' && (
        <FooterEditor />
      )}
    </AdminLayout>
  );
}

export default App;

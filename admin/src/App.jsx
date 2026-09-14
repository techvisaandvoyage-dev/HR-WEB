import React from 'react';
import AdminLayout from './components/layout/AdminLayout';
import FooterEditor from './pages/FooterEditor';
import AdminLogin from './pages/AdminLogin';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(() => sessionStorage.getItem('adminAuthenticated') === 'true');

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AdminLayout onLogout={() => {
      sessionStorage.removeItem('adminAuthenticated');
      setIsAuthenticated(false);
    }}>
      <FooterEditor />
    </AdminLayout>
  );
}

export default App;

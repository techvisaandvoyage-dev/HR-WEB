import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import ContentForm from '../components/footer-editor/ContentForm';
import SocialLinksForm from '../components/footer-editor/SocialLinksForm';
import PagesLibrary from '../components/footer-editor/PagesLibrary';
import PageEditor from '../components/footer-editor/PageEditor';

export default function FooterEditor() {
  const [activeTab, setActiveTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('subtab');
    if (sub && ['content', 'social', 'library'].includes(sub)) return sub;
    const saved = localStorage.getItem('adminFooterSubtab');
    if (saved && ['content', 'social', 'library'].includes(saved)) return saved;
    return 'content';
  });

  const setActiveTab = (newSubTab) => {
    setActiveTabState(newSubTab);
    localStorage.setItem('adminFooterSubtab', newSubTab);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'footer');
    params.set('subtab', newSubTab);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const sub = params.get('subtab');
      if (sub && ['content', 'social', 'library'].includes(sub)) {
        setActiveTabState(sub);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [editingPage, setEditingPage] = useState(null);

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  React.useEffect(() => {
    if (!toast) return undefined;

    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  // Fetch pages from backend
  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/pages`);
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (error) {
      console.error('Failed to fetch pages', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPages();
  }, []);

  const handleSavePage = async (pageData) => {
    try {
      const pageId = pageData._id || pageData.id;
      const url = pageId ? `${API_URL}/api/pages/${pageId}` : `${API_URL}/api/pages`;
      const method = pageId ? 'PUT' : 'POST';
      
      const payload = { ...pageData };
      if (!pageId) {
        delete payload._id;
        delete payload.id;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchPages(); // Refresh list
        setToast({ type: 'success', message: 'Page saved successfully.' });
        setEditingPage(null);
      } else {
        const data = await res.json().catch(() => null);
        console.error('Failed to save page', data);
        const errorMsg = data?.message?.includes('duplicate key')
          ? 'A page with this URL slug already exists.'
          : (data?.message || 'Could not save the page.');
        setToast({ type: 'error', message: errorMsg });
      }
    } catch (error) {
      console.error('Error saving page', error);
      setToast({ type: 'error', message: 'Could not save the page. Check the server connection.' });
    }
  };

  const toastMessage = toast && (
    <div
      role="status"
      className={`fixed right-6 top-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
        toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`}
    >
      <span>{toast.type === 'success' ? '✓' : '!'}</span>
      {toast.message}
    </div>
  );

  const handleDeletePage = async (id) => {
    if (window.confirm("Are you sure you want to delete this page?")) {
      try {
        const res = await fetch(`${API_URL}/api/pages/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setPages(pages.filter(p => p._id !== id && p.id !== id));
        }
      } catch (error) {
        console.error('Error deleting page', error);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    const page = pages.find(p => p._id === id || p.id === id);
    if (!page) return;
    
    const newStatus = page.status === 'Published' ? 'Draft' : 'Published';
    
    try {
      const res = await fetch(`${API_URL}/api/pages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setPages(pages.map(p => p._id === id || p.id === id ? { ...p, status: newStatus } : p));
      }
    } catch (error) {
      console.error('Error toggling status', error);
    }
  };

  // If editingPage is set, we show the editor instead of tabs
  if (editingPage !== null) {
    return (
      <>
        {toastMessage}
        <PageEditor onBack={() => setEditingPage(null)} page={editingPage} onSave={handleSavePage} />
      </>
    );
  }

  return (
    <>
      {toastMessage}
      <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Footer Configuration</h2>
          <p className="text-gray-500 mt-2">Manage the content, social links, and static pages displayed in the website footer.</p>
        </div>
        {activeTab === 'library' && (
          <button 
            onClick={() => setEditingPage({})} 
            className="px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            + Create Page
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="border-b border-gray-100">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'content' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              General Content
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'social' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Social Links
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'library' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Pages Library
            </button>
          </nav>
        </div>

        {activeTab !== 'library' && (
          <div className="p-6">
            {activeTab === 'content' && <ContentForm />}
            {activeTab === 'social' && <SocialLinksForm />}
          </div>
        )}
      </div>

      {activeTab === 'library' && (
        <PagesLibrary 
          pages={pages} 
          onEditPage={(page) => setEditingPage(page)} 
          onDeletePage={handleDeletePage}
          onToggleStatus={handleToggleStatus}
        />
      )}
      </div>
    </>
  );
}

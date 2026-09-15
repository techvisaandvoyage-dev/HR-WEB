import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from './Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const StaticPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [status, setStatus] = useState('loading');

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const fetchPage = async () => {
      try {
        setLoadingState();
        const response = await fetch(`${API_URL}/api/pages?status=Published`);
        if (!response.ok) throw new Error('Failed to load page');

        const pages = await response.json();
        const currentPath = location.pathname.toLowerCase().replace(/\/$/, '');
        const matchingPage = pages.find((item) => {
          const itemSlug = (item.slug || '').toLowerCase().replace(/\/$/, '');
          return itemSlug === currentPath || itemSlug === `/page${currentPath}` || `/page/${itemSlug}` === currentPath;
        });

        setPage(matchingPage || null);
        setStatus(matchingPage ? 'ready' : 'not-found');
      } catch (error) {
        console.error('Failed to fetch static page:', error);
        setStatus('error');
      }
    };

    const setLoadingState = () => {
      setStatus('loading');
    };

    fetchPage();
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header / Navigation Bar */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-emerald-600 tracking-tight flex items-center">
              <span className="text-emerald-600 text-xl leading-none mt-0.5 mr-0.5 font-serif">'</span>
              Job
              <span className="text-emerald-600 text-xl leading-none mt-0.5 ml-0.5 font-serif">'</span>
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 transition-all duration-150 shadow-xs active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors group cursor-pointer"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to previous page</span>
          </button>
        </div>
        {status === 'loading' && (
          <div className="py-24 text-center text-gray-500 font-medium">
            <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Loading page...
          </div>
        )}

        {status === 'not-found' && (
          <div className="py-24 text-center bg-white rounded-3xl p-12 border border-gray-200/80 shadow-sm">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Page Not Found</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              The page you're looking for doesn't exist or has been unpublished.
            </p>
            <Link 
              to="/" 
              className="px-6 py-3 bg-green-700 text-white rounded-full font-bold hover:bg-green-800 transition-colors shadow-sm inline-block"
            >
              Return Home
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-24 text-center bg-white rounded-3xl p-12 border border-red-100 shadow-sm">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Page</h2>
            <p className="text-gray-500 mb-6">Could not connect to the server. Please try again later.</p>
            <Link to="/" className="text-green-700 font-semibold hover:underline">&larr; Go to Home</Link>
          </div>
        )}

        {status === 'ready' && page && (
          <article className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200/70 shadow-sm">
            {page.footer && (
              <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
                {page.footer}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 tracking-tight">
              {page.title}
            </h1>
            <div 
              className="prose prose-slate prose-green max-w-none text-gray-700 leading-relaxed space-y-4" 
              dangerouslySetInnerHTML={{ __html: page.content || '<p>No content available for this page yet.</p>' }} 
            />
          </article>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default StaticPage;
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Footer from './Footer';
import BrandLogo from './BrandLogo';
import 'react-quill-new/dist/quill.snow.css';

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
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between">
          <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <BrandLogo />
          </Link>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-emerald-50 border border-gray-200 transition-all duration-150 shadow-xs active:scale-95 cursor-pointer"
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
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
          <article className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 border border-gray-200/80 shadow-xs">
            {page.footer && (
              <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
                {page.footer}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">
              {page.title}
            </h1>
            <div className="ql-snow">
              <div 
                className="ql-editor static-page-content !p-0 !min-h-0 text-gray-800 leading-relaxed font-sans" 
                dangerouslySetInnerHTML={{ __html: page.content || '<p>No content available for this page yet.</p>' }} 
              />
            </div>
          </article>
        )}
      </main>

      <style>{`
        .static-page-content {
          font-family: inherit;
          color: #374151;
          font-size: 15px;
          line-height: 1.7;
        }
        .static-page-content p {
          margin-bottom: 0.75rem;
        }
        .static-page-content p:last-child {
          margin-bottom: 0;
        }
        .static-page-content ul,
        .ql-snow .ql-editor.static-page-content ul {
          list-style-type: disc !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.75rem !important;
          padding-left: 1.75rem !important;
        }
        .static-page-content ol,
        .ql-snow .ql-editor.static-page-content ol {
          list-style-type: decimal !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.75rem !important;
          padding-left: 1.75rem !important;
        }
        .static-page-content li,
        .ql-snow .ql-editor.static-page-content li {
          display: list-item !important;
          margin-bottom: 0.35rem !important;
          padding-left: 0.25rem !important;
        }
        /* Quill alignment classes support */
        .static-page-content .ql-align-center,
        .ql-snow .ql-editor.static-page-content .ql-align-center,
        .static-page-content [style*="text-align: center"],
        .static-page-content [style*="text-align:center"] {
          text-align: center !important;
        }
        .static-page-content .ql-align-right,
        .ql-snow .ql-editor.static-page-content .ql-align-right,
        .static-page-content [style*="text-align: right"],
        .static-page-content [style*="text-align:right"] {
          text-align: right !important;
        }
        .static-page-content .ql-align-justify,
        .ql-snow .ql-editor.static-page-content .ql-align-justify {
          text-align: justify !important;
        }
        /* Headings */
        .static-page-content h1 {
          font-size: 1.875rem !important;
          font-weight: 800 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.75rem !important;
          color: #111827 !important;
        }
        .static-page-content h2 {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          margin-top: 1.25rem !important;
          margin-bottom: 0.5rem !important;
          color: #111827 !important;
        }
        .static-page-content h3 {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
          margin-top: 1rem !important;
          margin-bottom: 0.5rem !important;
          color: #111827 !important;
        }
        /* Text styling */
        .static-page-content strong,
        .static-page-content b {
          font-weight: 700 !important;
          color: #111827 !important;
        }
        .static-page-content em,
        .static-page-content i {
          font-style: italic !important;
        }
        .static-page-content u {
          text-decoration: underline !important;
        }
        .static-page-content s {
          text-decoration: line-through !important;
        }
        .static-page-content blockquote {
          border-left: 4px solid #10b981 !important;
          padding-left: 1rem !important;
          font-style: italic !important;
          color: #4b5563 !important;
          margin: 1rem 0 !important;
        }
        .static-page-content pre {
          background-color: #f3f4f6 !important;
          border-radius: 0.5rem !important;
          padding: 1rem !important;
          overflow-x: auto !important;
          font-family: monospace !important;
          margin: 1rem 0 !important;
        }
        .static-page-content a {
          color: #059669 !important;
          text-decoration: underline !important;
          font-weight: 600 !important;
        }
        .static-page-content a:hover {
          color: #047857 !important;
        }
        .static-page-content .ql-size-small {
          font-size: 0.75em !important;
        }
        .static-page-content .ql-size-large {
          font-size: 1.35em !important;
        }
        .static-page-content .ql-size-huge {
          font-size: 2em !important;
        }
      `}</style>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default StaticPage;
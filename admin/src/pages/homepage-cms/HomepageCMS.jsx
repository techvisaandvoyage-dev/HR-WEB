import React, { useState, useEffect } from 'react';
import LogoSectionEditor from './components/LogoSectionEditor';
import HeroSectionEditor from './components/HeroSectionEditor';
import SearchBarEditor from './components/SearchBarEditor';
import JobCardsEditor from './components/JobCardsEditor';
import TypographySectionEditor from './components/TypographySectionEditor';

/**
 * HomepageCMS Component
 * Main orchestrator for Homepage CMS with 2-tier sub-navigation sidebar,
 * managing Logo, Typography & Fonts, Hero, Search Bar, and Job Cards configurations.
 */
const VALID_SECTIONS = ['logo', 'typography', 'hero', 'search', 'jobCards'];

const HomepageCMS = () => {
  const [activeSection, setActiveSectionState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get('section') || params.get('subtab');
    if (sec && VALID_SECTIONS.includes(sec)) return sec;
    const saved = localStorage.getItem('adminHomepageSection');
    if (saved && VALID_SECTIONS.includes(saved)) return saved;
    return 'logo';
  });

  const setActiveSection = (newSec) => {
    setActiveSectionState(newSec);
    localStorage.setItem('adminHomepageSection', newSec);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'homepage');
    params.set('section', newSec);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'homepage');
    params.set('section', activeSection);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);

    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      const sec = p.get('section') || p.get('subtab');
      if (sec && VALID_SECTIONS.includes(sec)) {
        setActiveSectionState(sec);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeSection]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');

  const [cmsData, setCmsData] = useState({
    logo: {
      type: 'text',
      text: 'sahijob',
      accentText: '.com',
      imageUrl: '',
      altText: 'sahijob.com',
      height: 36
    },
    typography: {
      primaryFont: {
        source: 'google',
        family: 'Inter',
        customUrl: '',
        appliedTo: 'Body text, UI elements, buttons, form inputs, and tables'
      },
      headingFont: {
        source: 'google',
        family: 'Plus Jakarta Sans',
        customUrl: '',
        appliedTo: 'H1-H6 titles, section headers, card titles, and modal headers'
      },
      secondaryFont: {
        source: 'google',
        family: 'Roboto',
        customUrl: '',
        appliedTo: 'Hero highlights, badges, chips, tags, and stats'
      }
    },
    hero: {
      titlePrefix: 'Find Your',
      titleHighlight: 'Dream Job',
      subtitle: 'Discover opportunities that align with your passion and expertise.'
    },
    searchBar: {
      jobPlaceholder: 'Job title...',
      locationPlaceholder: 'City, state, or country...',
      buttonText: 'Search Jobs',
      showArrow: true
    },
    jobCards: {
      heading: 'Latest Opportunities',
      showSparkleIcon: true,
      subtextTemplate: 'Showing {count} jobs',
      viewAllButtonText: 'View All Jobs',
      initialCount: 6,
      showMoreCount: 6
    }
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch Homepage Config from backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/api/homepage`);
        const json = await res.json();
        if (json.success && json.data) {
          setCmsData(prev => ({
            ...prev,
            ...json.data
          }));
        }
      } catch (err) {
        console.error('Error fetching homepage CMS data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [API_URL]);

  // Handler for updating child section state
  const handleSectionChange = (sectionKey, updatedSectionData) => {
    setCmsData(prev => ({
      ...prev,
      [sectionKey]: updatedSectionData
    }));
  };

  // Save changes to backend
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccessMessage('');
      setSaveErrorMessage('');

      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        },
        body: JSON.stringify(cmsData)
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccessMessage('Homepage & Typography settings saved successfully!');
        setTimeout(() => setSaveSuccessMessage(''), 4000);
      } else {
        setSaveErrorMessage(json.message || 'Failed to save changes.');
      }
    } catch (err) {
      console.error('Error saving homepage config:', err);
      setSaveErrorMessage('Network error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Sub-navigation sections definition
  const sections = [
    {
      id: 'logo',
      label: 'Upload Logo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'typography',
      label: 'Typography & Fonts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      )
    },
    {
      id: 'hero',
      label: 'Hero Section',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      id: 'search',
      label: 'Search Bar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      id: 'jobCards',
      label: 'Job Cards Section',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-green-700" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm font-semibold text-gray-500">Loading Homepage CMS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-[#f8fafc]">
      
      {/* Left Sub-navigation Sidebar (Fixed & Stationary) */}
      <aside className="w-full md:w-72 lg:w-80 shrink-0 bg-white border-r border-gray-200 p-6 lg:p-8 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Homepage Sections</h2>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">Update all homepage text & content</p>
        </div>

        <nav className="space-y-2 flex-1">
          {sections.map(section => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? 'bg-green-50/90 text-green-800 border border-green-200/90 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <span className={`transition-colors ${isActive ? 'text-green-700' : 'text-gray-400'}`}>
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Floating Global Toast Notifications */}
      {saveSuccessMessage && (
        <div className="fixed top-20 right-6 sm:right-10 z-[100] max-w-md bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-900/30 flex items-center gap-3.5 animate-bounce-short border border-emerald-500/50 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-extrabold leading-none text-white">Success!</h4>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">{saveSuccessMessage}</p>
          </div>
          <button 
            onClick={() => setSaveSuccessMessage('')} 
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-base"
          >
            ✕
          </button>
        </div>
      )}

      {saveErrorMessage && (
        <div className="fixed top-20 right-6 sm:right-10 z-[100] max-w-md bg-rose-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-rose-900/30 flex items-center gap-3.5 animate-bounce-short border border-rose-500/50 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-extrabold leading-none text-white">Upload / Save Error</h4>
            <p className="text-xs text-rose-100 font-medium mt-0.5">{saveErrorMessage}</p>
          </div>
          <button 
            onClick={() => setSaveErrorMessage('')} 
            className="text-rose-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* Right Active Section Editor (Independent Scroll Container) */}
      <main className="flex-1 h-full overflow-y-auto p-6 sm:p-8 lg:p-12 min-h-0">
        <div className="max-w-[1600px] mx-auto pb-12">
          {activeSection === 'logo' && (
            <LogoSectionEditor
              data={cmsData}
              onChange={handleSectionChange}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}

          {activeSection === 'typography' && (
            <TypographySectionEditor
              data={cmsData}
              onChange={handleSectionChange}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}

          {activeSection === 'hero' && (
            <HeroSectionEditor
              data={cmsData}
              onChange={handleSectionChange}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}

          {activeSection === 'search' && (
            <SearchBarEditor
              data={cmsData}
              onChange={handleSectionChange}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}

          {activeSection === 'jobCards' && (
            <JobCardsEditor
              data={cmsData}
              onChange={handleSectionChange}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}
        </div>
      </main>

    </div>
  );
};

export default HomepageCMS;

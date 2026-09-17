import React, { useState, useEffect } from 'react';
import LogoSectionEditor from './components/LogoSectionEditor';
import HeroSectionEditor from './components/HeroSectionEditor';
import SearchBarEditor from './components/SearchBarEditor';
import JobCardsEditor from './components/JobCardsEditor';

/**
 * HomepageCMS Component
 * Main orchestrator for Homepage CMS with 2-tier sub-navigation sidebar,
 * managing Logo, Hero, Search Bar, and Job Cards configurations.
 */
const HomepageCMS = () => {
  const [activeSection, setActiveSection] = useState('logo');
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
        setSaveSuccessMessage('Homepage settings saved successfully!');
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
      <div className="flex items-center justify-center min-h-[60vh]">
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
    <div className="w-full min-h-[calc(100vh-64px)] flex flex-col md:flex-row bg-[#f8fafc]">
      
      {/* Left Sub-navigation Sidebar (Edge to Edge) */}
      <aside className="w-full md:w-72 lg:w-80 shrink-0 bg-white border-r border-gray-200 p-6 lg:p-8 flex flex-col gap-6 md:min-h-[calc(100vh-64px)]">
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

      {/* Right Active Section Editor (Edge to Edge) */}
      <main className="flex-1 w-full p-6 sm:p-8 lg:p-12 overflow-y-auto max-w-[1600px]">
        {/* Toast Alerts */}
        {saveSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-5 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              {saveSuccessMessage}
            </div>
            <button onClick={() => setSaveSuccessMessage('')} className="text-green-600 hover:text-green-800 cursor-pointer">✕</button>
          </div>
        )}

        {saveErrorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-5 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {saveErrorMessage}
            </div>
            <button onClick={() => setSaveErrorMessage('')} className="text-red-600 hover:text-red-800 cursor-pointer">✕</button>
          </div>
        )}

        {activeSection === 'logo' && (
          <LogoSectionEditor
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
      </main>

    </div>
  );
};

export default HomepageCMS;

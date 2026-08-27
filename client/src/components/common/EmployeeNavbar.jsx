import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LocationAutocomplete from './LocationAutocomplete';

const NavbarDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative font-sans h-full flex items-center border-r border-gray-300" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-1.5 h-full flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 bg-transparent"
      >
        <span className="truncate max-w-[90px] text-left">{value === 'All' || value === 'Any time' ? placeholder : value}</span>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {isOpen && (
        <div className="absolute top-[120%] left-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-[110]">
          {options.map(opt => (
            <div 
              key={opt.value} 
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EmployeeNavbar = ({ jobs = [], refreshUnread = false }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [experience, setExperience] = useState('All');
  const [postingDate, setPostingDate] = useState('Any time');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!localStorage.getItem('employeeToken')) return;
      try {
        const res = await fetch(`\${import.meta.env.VITE_API_URL}/api/employee/messages/unread-count`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` }
        });
        const data = await res.json();
        if (data.success) {
          setTotalUnread(data.count);
        }
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };
    fetchUnreadCount();
    
    // Optional: could poll every minute, or rely on socket/refresh. Just fetching once on mount for now.
    // const interval = setInterval(fetchUnreadCount, 60000);
    // return () => clearInterval(interval);
  }, [refreshUnread]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutsideSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideSearch);
    return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
  }, []);

  const filteredJobs = searchTerm 
    ? jobs.filter(job => job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        
        {/* Logo / Brand */}
        <div 
          className="text-xl font-black text-palette-900 w-48 cursor-pointer" 
          onClick={() => navigate('/employee')}
        >
          DreamJob
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-4xl flex items-center bg-gray-100 rounded-full focus-within:ring-2 focus-within:ring-palette-400 focus-within:bg-white transition-all hidden lg:flex relative h-[44px]" ref={searchRef}>
          
          <NavbarDropdown 
            placeholder="Experience"
            value={experience}
            onChange={setExperience}
            options={[
              { label: 'Any Experience', value: 'All' },
              { label: '0 - 1 Yrs', value: '0 - 1 Yrs' },
              { label: '2 - 3 Yrs', value: '2 - 3 Yrs' },
              { label: '4 - 6 Yrs', value: '4 - 6 Yrs' },
              { label: '7 - 10 Yrs', value: '7 - 10 Yrs' },
              { label: '11 - 15 Yrs', value: '11 - 15 Yrs' },
              { label: '16 - 20 Yrs', value: '16 - 20 Yrs' },
              { label: '21 - 25 Yrs', value: '21 - 25 Yrs' },
              { label: '25+ yrs', value: '25+ yrs' }
            ]}
          />
          
          <NavbarDropdown 
            placeholder="Date Posted"
            value={postingDate}
            onChange={setPostingDate}
            options={[
              { label: 'Any time', value: 'Any time' },
              { label: 'Past 24 hours', value: 'Past 24 hours' },
              { label: 'Past week', value: 'Past week' },
              { label: 'Past month', value: 'Past month' }
            ]}
          />

          <div className="flex-1 flex items-center px-3 border-r border-gray-300 relative h-full">
            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Find your perfect job" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500"
            />
            {showSuggestions && searchTerm && (
              <div className="absolute top-[200%] left-0 w-[120%] bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] max-h-64 overflow-y-auto">
                {filteredJobs.length > 0 ? filteredJobs.slice(0, 5).map(job => (
                  <div key={job.id} onClick={() => { setSearchTerm(job.title); setShowSuggestions(false); }} className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-600 text-xs shrink-0">
                      {job.companyInitial}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{job.title}</div>
                      <div className="text-xs text-gray-500">{job.company} • {job.location}</div>
                    </div>
                  </div>
                )) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">No jobs found for "{searchTerm}"</div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 flex items-center px-3 h-full">
            <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <LocationAutocomplete 
              value={searchLocation}
              onChange={(val) => setSearchLocation(val?.label || val)}
              placeholder="City, state, region or remote" 
              className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Right Icons */}
        <div className="flex items-center justify-end gap-4 md:gap-6 w-auto ml-4">
          {/* My Jobs (Bookmark) */}
          <button onClick={() => navigate('/my-jobs')} className="hidden md:block text-gray-700 hover:text-black transition-colors" title="My jobs">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            </svg>
          </button>

          {/* Messages (Chat) */}
          <button onClick={() => navigate('/employee/messages')} className="hidden md:block text-gray-700 hover:text-black transition-colors relative" title="Messages">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>

          {/* Notifications (Bell) */}
          <button className="text-gray-700 hover:text-black transition-colors relative" title="Notifications">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>

          {/* Profile Dropdown Toggle */}
          <div className="relative hidden md:block" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="text-gray-700 hover:text-black transition-colors flex items-center justify-center focus:outline-none"
              title="Account"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="p-5 border-b border-gray-200">
                  <p className="text-base font-bold text-gray-900 truncate">yashrajsingh28359@gmail.com</p>
                </div>
                
                <div className="py-2 border-b border-gray-200">
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                    <span className="text-[15px] text-gray-800">Profile</span>
                  </button>
                </div>

                <div className="p-4 border-b border-gray-200 flex justify-center text-xs text-gray-600">
                  <p>
                    © 2026 DreamJob - <span className="hover:underline cursor-pointer">Terms</span> - <span className="hover:underline cursor-pointer">Accessibility</span>
                  </p>
                </div>

                <div className="py-2">
                  <button 
                    onClick={() => {
                      localStorage.removeItem('employeeToken');
                      localStorage.removeItem('hasProfile');
                      localStorage.removeItem('userProfile');
                      window.location.href = '/';
                    }}
                    className="w-full text-center py-2 text-[15px] font-bold text-blue-700 hover:underline transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-[72px] z-[100] pb-safe">
        {/* Home */}
        <button onClick={() => navigate('/employee')} className={`flex flex-col items-center justify-center w-full h-full relative ${currentPath === '/employee' || currentPath === '/' ? 'text-green-600' : 'text-gray-500'}`}>
          {(currentPath === '/employee' || currentPath === '/') && <div className="absolute top-0 left-0 right-0 h-[3px] bg-green-600"></div>}
          <svg className="w-6 h-6 mb-1" fill={(currentPath === '/employee' || currentPath === '/') ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={(currentPath === '/employee' || currentPath === '/') ? '0' : '1.5'}>
            {(currentPath === '/employee' || currentPath === '/') ? (
              <path fillRule="evenodd" d="M11.47 3.84a.75.75 0 011.06 0l8.99 9a.75.75 0 11-1.06 1.06l-1.46-1.46V20.25a.75.75 0 01-.75.75H14.5a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-2a.75.75 0 00-.75.75v4.5a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V12.44L3.03 13.9a.75.75 0 11-1.06-1.06l8.99-9z" clipRule="evenodd" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            )}
          </svg>
          <span className="text-[11px] font-medium">Home</span>
        </button>

        {/* My Jobs */}
        <button onClick={() => navigate('/my-jobs')} className={`flex flex-col items-center justify-center w-full h-full relative ${currentPath === '/my-jobs' ? 'text-green-600' : 'text-gray-500'}`}>
          {currentPath === '/my-jobs' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-green-600"></div>}
          <svg className="w-6 h-6 mb-1" fill={currentPath === '/my-jobs' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={currentPath === '/my-jobs' ? '0' : '2'}>
            {currentPath === '/my-jobs' ? (
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            )}
          </svg>
          <span className="text-[11px] font-medium">My Jobs</span>
        </button>

        {/* Messages */}
        <button onClick={() => navigate('/employee/messages')} className={`flex flex-col items-center justify-center w-full h-full relative ${currentPath === '/employee/messages' ? 'text-green-600' : 'text-gray-500'}`}>
          {currentPath === '/employee/messages' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-green-600"></div>}
          <div className="relative">
            <svg className="w-6 h-6 mb-1" fill={currentPath === '/employee/messages' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={currentPath === '/employee/messages' ? '0' : '2'}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium">Messages</span>
        </button>

        {/* Profile */}
        <button onClick={() => navigate('/profile')} className={`flex flex-col items-center justify-center w-full h-full relative ${currentPath === '/profile' ? 'text-green-600' : 'text-gray-500'}`}>
          {currentPath === '/profile' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-green-600"></div>}
          <svg className="w-6 h-6 mb-1" fill={currentPath === '/profile' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={currentPath === '/profile' ? '0' : '2'}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-[11px] font-medium">Profile</span>
        </button>
      </div>
    </>
  );
};

export default EmployeeNavbar;

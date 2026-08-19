import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const EmployerMessages = ({ candidates = [], triggerNavRefresh, updateCandidateStatus }) => {
  const location = useLocation();
  const initialEmployeeData = location.state?.initialEmployee;

  const [backendConversations, setBackendConversations] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEmployeeDetailsOpen, setIsEmployeeDetailsOpen] = useState(false);
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const getStatusBadgeStyles = (status) => {
    const map = {
      'new': 'bg-blue-50 text-blue-600 border-blue-100',
      'applied': 'bg-blue-50 text-blue-600 border-blue-100',
      'viewed': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'under review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'shortlisted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'interview scheduled': 'bg-purple-50 text-purple-700 border-purple-200',
      'technical round': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'hr round': 'bg-pink-50 text-pink-700 border-pink-200',
      'offer sent': 'bg-teal-50 text-teal-700 border-teal-200',
      'hired': 'bg-green-100 text-green-800 border-green-300',
      'rejected': 'bg-red-50 text-red-600 border-red-100',
      'withdrawn': 'bg-stone-100 text-stone-600 border-stone-200',
    };
    const key = status?.toLowerCase() || 'new';
    return map[key] || map['new'];
  };

  const statusOptions = ['Shortlisted', 'Hired', 'Rejected'];

  // 1. Fetch conversations (unread counts and last messages grouped by applicationId)
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/employer/messages/conversations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setBackendConversations(data.data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle initial employee selection from route state
  useEffect(() => {
    if (initialEmployeeData && candidates.length > 0 && !selectedEmployee) {
      const emp = candidates.find(c => c.id === initialEmployeeData.id) || initialEmployeeData;
      setSelectedEmployee(emp);
      // Auto-select their first application if they have any
      if (emp.history && emp.history.length > 0) {
        setSelectedApplication(emp.history[0]);
      }
    }
  }, [initialEmployeeData, candidates, selectedEmployee]);

  // 3. Fetch messages when an application is selected
  useEffect(() => {
    if (selectedApplication) {
      fetchMessages(selectedApplication.appId);
      
      // Pre-fill message if came from route
      if (initialEmployeeData && selectedEmployee?.id === initialEmployeeData.id) {
        setNewMessage(`Hey ${selectedEmployee.name.split(' ')[0]}, `);
      } else {
        setNewMessage('');
      }
    } else {
      setMessages([]);
    }
  }, [selectedApplication]);

  const fetchMessages = async (appId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/employer/messages/applications/${appId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('employerToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        // Clear unread count for this app in backendConversations
        setBackendConversations(prev => prev.map(c => 
          c.applicationId === appId ? { ...c, unreadCount: 0 } : c
        ));
        if (triggerNavRefresh) triggerNavRefresh();
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedApplication) return;
    
    try {
      const res = await fetch(`http://localhost:5000/api/employer/messages/applications/${selectedApplication.appId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('employerToken')}`
        },
        body: JSON.stringify({ content: newMessage })
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage('');
        
        // Update last message in backendConversations
        setBackendConversations(prev => {
          const exists = prev.find(c => c.applicationId === selectedApplication.appId);
          if (exists) {
            return prev.map(c => 
              c.applicationId === selectedApplication.appId 
                ? { ...c, lastMessage: data.data.content, lastMessageTime: data.data.createdAt }
                : c
            );
          } else {
            return [{
              applicationId: selectedApplication.appId,
              lastMessage: data.data.content,
              lastMessageTime: data.data.createdAt,
              unreadCount: 0
            }, ...prev];
          }
        });
      } else {
        alert("Failed to send message: " + data.message);
        console.error("Backend error:", data);
      }
    } catch (err) {
      alert("Network error sending message.");
      console.error("Error sending message:", err);
    }
  };

  // Derived state for filtering
  const filteredCandidates = candidates.filter(c => {
    const term = employeeSearch.toLowerCase();
    return c.name?.toLowerCase().includes(term) || 
           c.email?.toLowerCase().includes(term) || 
           c.phone?.toLowerCase().includes(term);
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 font-medium animate-pulse">Loading Messages...</div>;
  }

  return (
    <div className="h-[calc(100vh-80px)] flex gap-4 overflow-hidden bg-[#FAFAFA] -m-8 p-6 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* Column 1 - Employees */}
      <div className="w-[300px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col shrink-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Employees</h2>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="Search employees..." 
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#29953f] focus:bg-white transition-all text-gray-800 placeholder-gray-400"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-1">
          {filteredCandidates.length === 0 ? (
            <div className="text-center p-6 text-gray-400 text-sm">No employees found.</div>
          ) : (
            filteredCandidates.map(cand => {
              const appCount = cand.history?.length || 0;
              const isSelected = selectedEmployee?.id === cand.id;
              
              const candUnreadCount = cand.history?.reduce((total, app) => {
                const conv = backendConversations.find(c => c.applicationId === app.appId || c.applicationId === app.id); // appId or id depending on how history is shaped
                return total + (conv?.unreadCount || 0);
              }, 0) || 0;
              
              return (
                <div 
                  key={cand.id}
                  onClick={() => {
                    setSelectedEmployee(cand);
                    setSelectedApplication(null); // Reset app when switching employees
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[#f0fdf4] border-[#bbf7d0] shadow-sm' : 'border-transparent hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${cand.bg || 'bg-[#29953f]'}`}>
                      {cand.initials || cand.name?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-sm truncate ${isSelected ? 'font-bold text-[#166534]' : 'font-semibold text-gray-900'}`}>{cand.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{cand.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    {candUnreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1">
                        {candUnreadCount} new
                      </span>
                    )}
                    <span className={`text-xs font-bold ${isSelected ? 'text-[#29953f]' : 'text-gray-400'}`}>{appCount} Applications</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Column 2 - Applications */}
      <div className="w-[320px] bg-[#FAFAFA] flex flex-col shrink-0 overflow-hidden">
        {selectedEmployee ? (
          <>
            <div className="p-2 shrink-0 mb-2">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{selectedEmployee.name}</h2>
              <p className="text-sm text-gray-500">{selectedEmployee.email}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[#dcfce7] text-[#166534] text-xs font-bold rounded-full border border-[#bbf7d0]">
                {selectedEmployee.history?.length || 0} Applications
              </div>
            </div>
            
            <div className="p-2 shrink-0">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Applications</h3>
              <p className="text-xs text-gray-500">Select an application to view conversation</p>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-3 custom-scrollbar">
              {(selectedEmployee.history || []).length === 0 ? (
                <div className="text-center p-6 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">No applications yet.</div>
              ) : (
                selectedEmployee.history.map(app => {
                  const isSelected = selectedApplication?.appId === app.appId;
                  const convState = backendConversations.find(c => c.applicationId === app.appId);
                  
                  return (
                    <div 
                      key={app.appId}
                      onClick={() => setSelectedApplication(app)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border bg-white shadow-sm ${isSelected ? 'border-[#29953f] ring-1 ring-[#29953f]' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-xl shrink-0 border border-gray-100">
                            💼
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>{app.title}</h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{selectedEmployee.skills?.[0] || 'Role'}</p>
                          </div>
                        </div>
                        <svg className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#29953f]' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        {convState?.unreadCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#29953f]"></div>
                            <span className="text-xs font-bold text-[#29953f]">{convState.unreadCount} new messages</span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-gray-500 truncate max-w-[150px]">
                            {convState?.lastMessage || 'No messages yet'}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-gray-400">
                          {convState?.lastMessageTime 
                            ? new Date(convState.lastMessageTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            : new Date(app.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                          }
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <h3 className="text-gray-900 font-bold mb-1">Select an Employee</h3>
            <p className="text-sm text-gray-500">Choose an employee from the list to view their job applications.</p>
          </div>
        )}
      </div>

      {/* Column 3 - Job Specific Chat */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden relative min-w-[350px]">
        {selectedApplication ? (
          <>
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-white shrink-0 flex justify-between items-center z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 shadow-sm">
                  💼
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg leading-tight">{selectedApplication.title}</h2>
                  <p className="text-sm text-gray-500 font-medium">{selectedEmployee.skills?.[0] || 'Role'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${selectedApplication.color || 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                  {selectedApplication.status || 'Under Review'}
                </div>
                <button 
                  onClick={() => setIsAppDetailsOpen(!isAppDetailsOpen)}
                  className={`p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border ${isAppDetailsOpen ? 'bg-gray-50 border-gray-200 text-gray-700' : 'border-transparent'}`}
                  title={isAppDetailsOpen ? "Hide Application Details" : "Show Application Details"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isAppDetailsOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA] flex flex-col gap-6 custom-scrollbar">
              <div className="text-center mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Applied on {selectedApplication.date}
                </span>
              </div>
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  </div>
                  <h3 className="text-gray-900 font-bold mb-1">No messages yet</h3>
                  <p className="text-sm text-gray-500">Start the conversation with this applicant.</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg._id} className={`flex flex-col ${msg.senderModel === 'Employer' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.senderModel === 'Employer' ? 'bg-[#e8f5e9] text-gray-900 rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}`}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 px-1 text-xs text-gray-400 font-medium">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.senderModel === 'Employer' && (
                        <svg className={`w-3.5 h-3.5 ${msg.isRead ? 'text-[#29953f]' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
              <div className="flex items-end gap-3 bg-[#FAFAFA] rounded-xl p-2 border border-gray-200 focus-within:border-[#29953f] focus-within:ring-1 focus-within:ring-[#29953f] transition-all">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                </button>
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  className="w-full flex-1 resize-none bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 py-2.5 max-h-[120px]"
                  placeholder="Type a message..."
                  rows="1"
                ></textarea>
                <button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim()}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all shrink-0 ${!newMessage.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#29953f] text-white hover:bg-[#207a32] shadow-sm'}`}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#FAFAFA]">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
              <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Employer Messages</h3>
            <p className="text-gray-500">Select an application to view its conversation.</p>
          </div>
        )}
      </div>

      {/* Column 4 - Application Details */}
      {isAppDetailsOpen && (
        <div className="w-[300px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col shrink-0 overflow-y-auto animate-in slide-in-from-right-8 fade-in duration-300">
          {selectedApplication ? (
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Application Details</h2>
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${selectedEmployee.bg || 'bg-[#29953f]'}`}>
                  {selectedEmployee.initials || selectedEmployee.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{selectedEmployee.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{selectedEmployee.email}</p>
                </div>
              </div>
              
              <button 
                className="text-[#29953f] text-sm font-bold flex items-center gap-1 hover:text-[#207a32] transition-colors mb-8"
                onClick={() => setIsEmployeeDetailsOpen(true)}
              >
                View full profile
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              </button>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Job Position</p>
                  <p className="text-sm font-bold text-[#29953f]">{selectedApplication.title}</p>
                  <p className="text-xs text-gray-600 font-medium">{selectedEmployee.skills?.[0] || 'Role'}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Application ID</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">APP-{selectedApplication.appId.substring(selectedApplication.appId.length - 4).toUpperCase()}</p>
                    <button className="text-gray-400 hover:text-gray-600" title="Copy ID">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Applied On
                  </p>
                  <p className="text-sm font-bold text-gray-900">{selectedApplication.date}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <select 
                    className={`appearance-none cursor-pointer outline-none transition-all inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusBadgeStyles(selectedApplication?.status || 'Under Review')}`}
                    value={selectedApplication?.status || 'Under Review'}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setSelectedApplication(prev => ({ ...prev, status: newStatus, color: getStatusBadgeStyles(newStatus) }));
                      if (updateCandidateStatus) {
                        updateCandidateStatus(selectedApplication.appId, newStatus);
                      }
                    }}
                  >
                    {!statusOptions.includes(selectedApplication?.status || 'Under Review') && (
                      <option value={selectedApplication?.status || 'Under Review'} disabled>
                        {selectedApplication?.status || 'Under Review'}
                      </option>
                    )}
                    {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>


                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                    Location
                  </p>
                  <p className="text-sm font-bold text-gray-900 leading-snug">{selectedEmployee.location || 'Not specified'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-400 text-sm">
              Select an application to view its details.
            </div>
          )}
        </div>
      )}

      {/* Modal Overlay for Application + Candidate Profile */}
      {isEmployeeDetailsOpen && selectedEmployee && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300" onClick={() => setIsEmployeeDetailsOpen(false)}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <div className="w-full max-w-[850px] h-full max-h-[90vh] bg-white rounded-2xl shadow-2xl flex overflow-hidden pointer-events-auto animate-in zoom-in-95 duration-300 font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
              
              {/* Left Column: Application Details */}
              <div className="w-[300px] bg-gray-50/50 border-r border-gray-100 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">Application Details</h2>
                
                <div className="flex items-center gap-3 mb-8">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${selectedEmployee.bg || 'bg-[#29953f]'}`}>
                    {selectedEmployee.initials || selectedEmployee.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{selectedEmployee.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{selectedEmployee.email}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Job Position</p>
                    <p className="text-sm font-bold text-[#29953f]">{selectedApplication?.title || 'Unknown'}</p>
                    <p className="text-xs text-gray-600 font-medium">{selectedEmployee.skills?.[0] || 'Role'}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Application ID</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-gray-900">APP-{(selectedApplication?.appId || 'XXXX').substring((selectedApplication?.appId || 'XXXX').length - 4).toUpperCase()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      Applied On
                    </p>
                    <p className="text-sm font-bold text-gray-900">{selectedApplication?.date || selectedEmployee.date || 'Recently'}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                    <select 
                      className={`appearance-none cursor-pointer outline-none transition-all inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${getStatusBadgeStyles(selectedApplication?.status || 'Under Review')}`}
                      value={selectedApplication?.status || 'Under Review'}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setSelectedApplication(prev => ({ ...prev, status: newStatus, color: getStatusBadgeStyles(newStatus) }));
                        if (updateCandidateStatus) {
                          updateCandidateStatus(selectedApplication.appId, newStatus);
                        }
                      }}
                    >
                      {!statusOptions.includes(selectedApplication?.status || 'Under Review') && (
                        <option value={selectedApplication?.status || 'Under Review'} disabled>
                          {selectedApplication?.status || 'Under Review'}
                        </option>
                      )}
                      {statusOptions.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>


                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                      Location
                    </p>
                    <p className="text-sm font-bold text-gray-900 leading-snug">{selectedEmployee.location || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Candidate Profile */}
              <div className="flex-1 flex flex-col p-6 sm:p-8 bg-white relative">
                <div className="flex justify-between items-start mb-6 shrink-0">
                  <h3 className="font-bold text-gray-900 text-lg">Candidate Profile</h3>
                  <button 
                    onClick={() => setIsEmployeeDetailsOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                  <div className="flex flex-col items-center text-center border-b border-[#ECECEC] pb-6">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-sm ring-4 ring-white ${selectedEmployee.bg || 'bg-[#29953f]'}`}>
                      {selectedEmployee.initials || selectedEmployee.name?.charAt(0)}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedEmployee.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedEmployee.email}</p>
                    <p className="text-xs font-semibold text-gray-400 mt-1">{selectedEmployee.phone || '+91 98765 43210'} • {selectedEmployee.location || 'Bangalore, India'}</p>
                  </div>

                  <div className="flex flex-col gap-4 border-b border-[#ECECEC] pb-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Current {selectedEmployee.salaryType === 'Monthly' ? 'Monthly' : 'Annual'} Salary
                        </h4>
                        <p className="text-sm font-bold text-gray-900">{selectedEmployee.currentCTC || 'Not specified'}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Expected {selectedEmployee.salaryType === 'Monthly' ? 'Monthly' : 'Annual'} Salary
                        </h4>
                        <p className="text-sm font-bold text-gray-900">{selectedEmployee.expectedCTC || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <hr className="border-gray-100" />
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Applied On</h4>
                        <p className="text-sm font-bold text-gray-900">{selectedApplication?.date || selectedEmployee.date || 'Recently'}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resume</h4>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => alert('Preview not available here')}
                            className="text-sm font-bold text-[#29953f] hover:text-green-700 flex items-center gap-1.5 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Preview
                          </button>
                          <button 
                            onClick={() => alert('Downloading Resume...')}
                            className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Professional Summary</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {selectedEmployee.summary || <span className="text-gray-400 italic">No professional summary provided.</span>}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployee.skills?.length > 0 ? selectedEmployee.skills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-semibold border border-gray-100">
                          {skill}
                        </span>
                      )) : (
                        <span className="text-gray-400 italic text-sm">No skills provided.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Work Experience</h4>
                    <div className="space-y-4 ml-2">
                      {selectedEmployee.experience?.length > 0 && selectedEmployee.experience[0].companyName ? (
                        selectedEmployee.experience.map((exp, i) => (
                          <div key={i} className="mb-4">
                            <h5 className="font-bold text-gray-900 text-sm mb-2">{exp.companyName || 'Company'}</h5>
                            <div className="border-l-2 border-[#29953f] ml-1.5 space-y-4 py-1">
                              {(exp.roles && exp.roles.length > 0 ? exp.roles : [{}]).map((role, rIndex) => {
                                const formatDate = (dateStr) => {
                                  if (!dateStr) return '';
                                  const d = new Date(dateStr);
                                  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                };
                                const startDate = role.joiningDate ? formatDate(role.joiningDate) : 'Start';
                                const endDate = role.leavingDate ? formatDate(role.leavingDate) : 'Present';
                                
                                return (
                                  <div key={rIndex} className="relative pl-4">
                                    <div className="absolute w-2 h-2 bg-[#29953f] rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                                    <h5 className="font-bold text-gray-900 text-sm">{role.jobTitle || 'Role'}</h5>
                                    <p className="text-[13px] text-gray-500 font-medium mb-1">
                                      {startDate} - {endDate} <span className="text-gray-300 mx-1">|</span> {role.employmentType || 'Full-time'}
                                    </p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{role.roleDescription || 'No description provided.'}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">No work experience provided.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Education</h4>
                    <div className="space-y-4 ml-2">
                      {selectedEmployee.education?.length > 0 ? (
                        selectedEmployee.education.map((edu, i) => (
                          <div key={i} className="relative pl-4">
                            <div className="absolute w-2 h-2 bg-[#29953f] rounded-full -left-[5px] top-1.5 ring-4 ring-white"></div>
                            <h5 className="font-bold text-gray-900 text-sm">{edu.degree || 'Degree'}</h5>
                            <p className="text-xs text-[#29953f] font-semibold mb-1">{edu.year || 'Year'}</p>
                            <p className="text-xs text-gray-500 leading-relaxed">{edu.institution || 'Institution'}</p>
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-400 italic text-sm">No education details provided.</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployerMessages;

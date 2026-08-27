import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeNavbar from '../../common/EmployeeNavbar';

const EmployeeMessages = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isJobDetailsOpen, setIsJobDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshNav, setRefreshNav] = useState(false);

  // Auto-scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/messages/conversations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.applicationId);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  const fetchMessages = async (applicationId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/messages/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('employeeToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data);
        // Clear unread count for this app in conversations
        setConversations(prev => prev.map(c => 
          c.applicationId === applicationId ? { ...c, unreadCount: 0 } : c
        ));
        setRefreshNav(prev => !prev); // Trigger navbar update
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/employee/messages/applications/${selectedChat.applicationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('employeeToken')}`
        },
        body: JSON.stringify({ content: newMessage })
      });
      
      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage('');
        
        // Update last message in conversations
        setConversations(prev => prev.map(c => 
          c.applicationId === selectedChat.applicationId 
            ? { ...c, lastMessage: data.data.content, lastMessageTime: data.data.createdAt }
            : c
        ));
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      <EmployeeNavbar refreshUnread={refreshNav} />
      
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 flex gap-6 h-[calc(100vh-80px)] mt-4 mb-20 md:mb-4">
        
        {/* Left Sidebar - Chat List */}
        <div className="w-full md:w-[350px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden shrink-0 hidden md:flex">
          
          <div className="p-5 border-b border-gray-100 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-gray-50/30">
            {isLoading ? (
              <div className="text-center p-6 text-gray-400 text-sm animate-pulse">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-6 text-gray-400 text-sm">No messages yet.</div>
            ) : (
              conversations.map(chat => (
                <div 
                  key={chat.applicationId} 
                  className={`p-5 border-b border-gray-100 cursor-pointer transition-colors flex gap-4 ${selectedChat?.applicationId === chat.applicationId ? 'bg-[#f0fdf4] border-l-4 border-l-[#29953f]' : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#29953f] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                    {chat.companyName?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{chat.companyName}</h3>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2 font-medium">
                        {new Date(chat.lastMessageTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#29953f] font-semibold mb-1 truncate">{chat.jobTitle}</p>
                    <p className={`text-xs truncate leading-relaxed ${chat.unreadCount > 0 ? 'font-bold text-[#166534]' : 'text-gray-500'}`}>
                      {chat.lastMessage}
                    </p>
                    {chat.unreadCount > 0 && (
                      <div className="mt-1 flex justify-end">
                        <span className="bg-[#29953f] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{chat.unreadCount} new</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area - Active Chat or Empty State */}
        {selectedChat ? (
          <div className="flex-1 hidden md:flex min-w-0">
            {/* Middle Column - Chat Interface */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden min-w-0 mr-6">
              
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#29953f] flex items-center justify-center text-white font-bold shrink-0">
                    {selectedChat.companyName?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-gray-900 text-sm truncate">{selectedChat.jobTitle || 'Job Title'}</h2>
                    <p className="text-xs text-gray-500 truncate">{selectedChat.companyName}</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 flex flex-col gap-6">
                {messages.length > 0 ? messages.map(msg => (
                  <div key={msg._id} className={`flex flex-col ${msg.senderModel === 'Employee' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.senderModel === 'Employee' ? 'bg-[#e8f5e9] text-gray-900 rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2 mt-2 px-1 text-xs text-gray-500 font-medium">
                      {msg.senderModel !== 'Employee' && (
                        <div className="w-5 h-5 bg-[#29953f] rounded-sm flex items-center justify-center text-white text-[10px]">
                          {selectedChat.companyName?.charAt(0) || 'C'}
                        </div>
                      )}
                      <span className="font-bold text-gray-700">{msg.senderModel === 'Employee' ? 'You' : selectedChat.companyName}</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    </div>
                    <h3 className="text-gray-900 font-bold mb-1">No messages yet</h3>
                    <p className="text-sm text-gray-500">Start the conversation with {selectedChat.companyName}.</p>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                <div className="flex flex-col gap-3 min-h-[120px]">
                  <textarea 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    className="w-full flex-1 resize-none bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500 p-2"
                    placeholder="Write your message"
                  ></textarea>
                  <div className="flex justify-between items-end px-2">
                    <button className="text-gray-500 hover:text-gray-700 p-1">
                      <svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                    </button>
                    <div className="flex items-center gap-3">
                      <button className="text-gray-500 hover:text-gray-700 p-1 hidden sm:block">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                      </button>
                      <button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        className={`font-bold px-6 py-2 rounded-xl text-sm transition-colors ${!newMessage.trim() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#29953f] text-white hover:bg-[#207a32] shadow-sm'}`}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column - Job Details */}
            <div className="w-[300px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col shrink-0 overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                  {selectedChat.jobTitle || 'Job Title'}
                </h2>
                <div className="flex items-center gap-1 text-sm font-semibold text-[#166534] mb-1">
                  {selectedChat.companyName}
                </div>
                <p className="text-sm text-gray-500 border-b border-gray-400 border-dashed inline-block pb-0.5 mb-6 cursor-pointer hover:text-gray-800">
                  {selectedChat.location || 'Location'}
                </p>

                <h3 className="font-bold text-gray-900 text-sm mb-3">Job type</h3>
                <ul className="space-y-3 mb-6">
                  {selectedChat.jobType && selectedChat.jobType.length > 0 ? selectedChat.jobType.map((type, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-gray-800 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-800"></div>
                      {type}
                    </li>
                  )) : (
                    <li className="flex items-center gap-3 text-sm text-gray-800 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-800"></div>
                      Full-time
                    </li>
                  )}
                </ul>

                <button 
                  className="text-[#29953f] text-sm font-semibold hover:underline"
                  onClick={() => setIsJobDetailsOpen(true)}
                >
                  View full application details
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 hidden md:flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="max-w-md w-full flex flex-col items-center relative z-10">
              <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-32 bg-[#f5d5b3] rounded-lg transform -rotate-6 opacity-90 shadow-sm translate-x-4 translate-y-4"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-[#f0a47f] rounded-full transform translate-x-14 -translate-y-6 shadow-sm"></div>
                </div>
                
                <div className="relative z-10 w-32 h-20 bg-[#29953f] rounded-xl shadow-xl flex items-center justify-center transform -translate-x-6 translate-y-2 rounded-bl-sm">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-white rounded-full opacity-90"></div>
                    <div className="w-3 h-3 bg-white rounded-full opacity-90"></div>
                    <div className="w-3 h-3 bg-white rounded-full opacity-90"></div>
                  </div>
                  <div className="absolute -bottom-3 left-0 w-6 h-6 bg-[#29953f] transform rotate-45 -z-10 origin-top-left"></div>
                </div>
                
                <div className="absolute w-8 h-8 bg-[#f0a47f] transform rotate-45 translate-x-24 translate-y-6 -z-0"></div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Welcome to Messages</h2>
              <p className="text-gray-500 text-[15px] font-medium">Select a conversation to view and respond.</p>
            </div>
          </div>
        )}

        {/* Mobile View */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden md:hidden">
          <div className="p-5 border-b border-gray-100 bg-white z-10">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="text-center p-6 text-gray-400 text-sm animate-pulse">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center p-6 text-gray-400 text-sm">No messages yet.</div>
            ) : conversations.map(chat => (
              <div key={chat.applicationId} className="p-5 border-b border-gray-100 flex gap-4 active:bg-gray-50 cursor-pointer" onClick={() => setSelectedChat(chat)}>
                <div className="w-12 h-12 rounded-xl bg-[#29953f] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                  {chat.companyName?.charAt(0) || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{chat.companyName}</h3>
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2 font-medium">
                      {new Date(chat.lastMessageTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#29953f] font-semibold mb-1 truncate">{chat.jobTitle}</p>
                  <p className={`text-xs truncate leading-relaxed ${chat.unreadCount > 0 ? 'font-bold text-[#166534]' : 'text-gray-500'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right Side Bar Slide-over for Job Details */}
      {isJobDetailsOpen && selectedChat && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsJobDetailsOpen(false)}
          ></div>
          
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform translate-x-0 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white shrink-0">
              <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
              <button 
                onClick={() => setIsJobDetailsOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm mb-6">
                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2">
                  {selectedChat.jobTitle || 'Job Title'}
                </h3>
                <div className="flex items-center gap-1 text-sm font-semibold text-[#166534] mb-3">
                  {selectedChat.companyName}
                </div>
                <p className="text-sm text-gray-600 mb-6 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  {selectedChat.location || 'Location'}
                </p>
                
                <h4 className="font-bold text-gray-900 text-sm mb-3">Job Type</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedChat.jobType && selectedChat.jobType.length > 0 ? selectedChat.jobType.map((type, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                      {type}
                    </span>
                  )) : (
                    <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full">
                      Full-time
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                 <h4 className="font-bold text-gray-900 text-base mb-4">Application Details</h4>
                 <div className="text-sm text-gray-600 leading-relaxed space-y-4">
                   <p>You have applied for the <strong>{selectedChat.jobTitle}</strong> position at <strong>{selectedChat.companyName}</strong>.</p>
                   <p>You can communicate directly with the recruiter through this chat window to discuss the role, schedule interviews, or ask any questions.</p>
                 </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-white shrink-0 flex gap-3">
              <button onClick={() => navigate('/employee/profile')} className="flex-1 bg-gray-100 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors">
                View My Profile
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeMessages;

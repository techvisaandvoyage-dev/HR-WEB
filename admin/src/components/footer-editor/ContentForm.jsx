import React, { useState, useEffect } from 'react';

export default function ContentForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    logoText: '',
    description: '',
    phone: '',
    email: '',
    copyright: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchFooterConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/footer');
        if (res.ok) {
          const data = await res.json();
          setFormData({
            companyName: data.companyName || '',
            logoText: data.logoText || 'Jobs',
            description: data.description || '',
            phone: data.phone || '',
            email: data.email || '',
            copyright: data.copyright || ''
          });
        }
      } catch (err) {
        console.error('Failed to load footer config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterConfig();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch('http://localhost:5000/api/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Footer content updated successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update footer content.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Connection error while saving footer.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500 font-medium">Loading footer content...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl animate-in slide-in-from-bottom-2 fade-in duration-300">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <span>{message.type === 'success' ? '✓' : '!'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brand Logo Text</label>
          <input 
            type="text" 
            name="logoText" 
            value={formData.logoText} 
            onChange={handleChange} 
            placeholder="e.g. Jobs"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow text-sm" 
          />
          <p className="text-xs text-gray-500 mt-1">Displayed as the styled main brand text in the footer header.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company / App Name</label>
          <input 
            type="text" 
            name="companyName" 
            value={formData.companyName} 
            onChange={handleChange} 
            placeholder="e.g. sahijobs.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow text-sm" 
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Short Brand Description</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            rows="3" 
            placeholder="A brief tagline or statement about your platform..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow text-sm"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Email Address</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            placeholder="support@jobs.com"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow text-sm" 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Phone Number</label>
          <input 
            type="text" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            placeholder="+1 (555) 234-5678"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow text-sm" 
          />
        </div>


        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Copyright Notice</label>
          <input 
            type="text" 
            name="copyright" 
            value={formData.copyright} 
            onChange={handleChange} 
            placeholder="© 2026 Jobs. All rights reserved."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow text-sm" 
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button 
          type="submit" 
          disabled={saving}
          className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Content'}
        </button>
      </div>
    </form>
  );
}

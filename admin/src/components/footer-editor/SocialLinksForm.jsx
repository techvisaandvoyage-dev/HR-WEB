import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEFAULT_PLATFORMS = [
  { platform: 'Facebook', url: 'https://facebook.com', isActive: true },
  { platform: 'Twitter', url: 'https://twitter.com', isActive: true },
  { platform: 'Instagram', url: 'https://instagram.com', isActive: true },
  { platform: 'LinkedIn', url: 'https://linkedin.com', isActive: true },
  { platform: 'YouTube', url: 'https://youtube.com', isActive: false },
];

export default function SocialLinksForm() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [newPlatform, setNewPlatform] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/footer`);
        if (res.ok) {
          const data = await res.json();
          if (data.socialLinks && data.socialLinks.length > 0) {
            setLinks(data.socialLinks);
          } else {
            setLinks(DEFAULT_PLATFORMS);
          }
        }
      } catch (err) {
        console.error('Failed to load social links:', err);
        setLinks(DEFAULT_PLATFORMS);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, []);

  const handleUrlChange = (index, newUrl) => {
    const updated = [...links];
    updated[index].url = newUrl;
    setLinks(updated);
  };

  const handleToggleActive = (index) => {
    const updated = [...links];
    updated[index].isActive = !updated[index].isActive;
    setLinks(updated);
  };

  const handleDelete = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newPlatform.trim() || !newUrl.trim()) return;
    setLinks([...links, { platform: newPlatform.trim(), url: newUrl.trim(), isActive: true }]);
    setNewPlatform('');
    setNewUrl('');
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch(`${API_URL}/api/footer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialLinks: links })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Social links saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update social links.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Server connection error.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-gray-500 font-medium">Loading social links...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl animate-in slide-in-from-bottom-2 fade-in duration-300">
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <span>{message.type === 'success' ? '✓' : '!'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-gray-800">Social Media Profiles</h3>
          <p className="text-xs text-gray-500 mt-0.5">Toggle visibility or update links to appear in the footer.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Platform
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Platform Name</label>
            <input
              type="text"
              placeholder="e.g. YouTube, Discord, TikTok"
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-green-500"
            />
          </div>
          <div className="flex-2 w-full">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Profile / Channel URL</label>
            <input
              type="url"
              placeholder="https://..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-green-500"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddLink}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3.5">
        {links.map((link, index) => (
          <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors shadow-sm">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-800">{link.platform}</span>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${link.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {link.isActive ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <input
                type="url"
                value={link.url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow text-sm"
                placeholder={`https://${link.platform.toLowerCase()}.com/yourpage`}
              />
            </div>
            <div className="pt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggleActive(index)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${link.isActive ? 'bg-green-600' : 'bg-gray-300'}`}
                role="switch"
                aria-checked={link.isActive}
                title={link.isActive ? 'Disable link' : 'Enable link'}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${link.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                title="Remove platform"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-8 flex justify-end">
        <button 
          type="submit" 
          disabled={saving}
          className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save Links'}
        </button>
      </div>
    </form>
  );
}

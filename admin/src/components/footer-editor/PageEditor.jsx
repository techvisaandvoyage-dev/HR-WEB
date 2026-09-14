import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, ArrowLeft, Plus, Check, X } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const editorToolbar = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean']
];

export default function PageEditor({ onBack, page, onSave }) {
  // Page Data State
  const [title, setTitle] = useState(page?.title || '');
  const [slug, setSlug] = useState(page?.slug || '');
  const [status, setStatus] = useState(page?.status || 'Draft');
  const [content, setContent] = useState(page?.content || '');
  const [metaTitle, setMetaTitle] = useState(page?.metaTitle || '');
  const [canonicalUrl, setCanonicalUrl] = useState(page?.canonicalUrl || '');
  const [metaDescription, setMetaDescription] = useState(page?.metaDescription || '');
  const [keywords, setKeywords] = useState(page?.keywords || '');
  
  // Dynamic columns state
  const [columns, setColumns] = useState(['Company', 'Services', 'Support', 'Legal', 'Information']);
  const [selectedColumn, setSelectedColumn] = useState(page?.footer || 'Company');
  
  // Ensure the page's footer is in the columns list
  useEffect(() => {
    if (page?.footer && !columns.includes(page.footer)) {
      setColumns(prev => [...prev, page.footer]);
    }
  }, [page]);

  // Add column state
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  
  // Edit column state
  const [editingColumn, setEditingColumn] = useState(null);
  const [editColumnName, setEditColumnName] = useState('');

  const handleAddColumn = () => {
    const trimmed = newColumnName.trim();
    if (trimmed && !columns.includes(trimmed)) {
      setColumns([...columns, trimmed]);
      setSelectedColumn(trimmed);
      setNewColumnName('');
      setIsAddingColumn(false);
    }
  };

  const handleSaveEdit = (oldName) => {
    const trimmed = editColumnName.trim();
    if (trimmed && !columns.includes(trimmed)) {
      setColumns(columns.map(c => c === oldName ? trimmed : c));
      if (selectedColumn === oldName) setSelectedColumn(trimmed);
    }
    setEditingColumn(null);
  };

  const handleDeleteColumn = (name) => {
    if (window.confirm(`Are you sure you want to delete the column "${name}"?`)) {
      setColumns(columns.filter(c => c !== name));
      if (selectedColumn === name) {
        setSelectedColumn(columns.length > 1 ? columns.find(c => c !== name) : '');
      }
    }
  };

  const handleSaveClick = () => {
    const normalizedTitle = title.trim();
    const normalizedSlug = slug.trim() || `/page/${normalizedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}`;

    if (!normalizedTitle || normalizedSlug === '/page/') {
      window.alert('Please enter a page title before saving.');
      return;
    }

    onSave({
      _id: page?._id,
      id: page?.id,
      title: normalizedTitle,
      slug: normalizedSlug,
      summary: metaDescription || 'No summary yet.',
      footer: selectedColumn || 'Company',
      status,
      metaTitle,
      canonicalUrl,
      metaDescription,
      keywords,
      content
    });
  };
  


  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6 animate-in slide-in-from-right-2 duration-300">
      <div className="p-6 border-b border-gray-100 flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-xl font-bold text-gray-900">{page?._id || page?.id ? 'Edit page' : 'Create static page'}</h2>
      </div>

      <div className="p-8 max-w-5xl mx-auto space-y-10">
        
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold text-gray-700">Footer Section</label>
            </div>
            
            <select 
              value={selectedColumn}
              onChange={(e) => {
                if (e.target.value === 'ADD_NEW_SECTION') {
                  setIsAddingColumn(true);
                  setNewColumnName('');
                } else {
                  setSelectedColumn(e.target.value);
                  setIsAddingColumn(false);
                }
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white appearance-none"
            >
              {columns.length === 0 && <option value="" disabled>No columns available</option>}
              {columns.map(col => <option key={col} value={col}>{col}</option>)}
              <option value="ADD_NEW_SECTION">+ Add custom section</option>
            </select>
            
            {/* Columns Management Tags */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {columns.map((col) => (
                <div key={col} className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                  {editingColumn === col ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={editColumnName}
                        onChange={(e) => setEditColumnName(e.target.value)}
                        className="px-2 py-0.5 border border-gray-300 rounded outline-none text-sm w-28 focus:border-green-500 bg-white"
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(col)} className="text-green-600 hover:text-green-700"><Check className="w-3 h-3" /></button>
                      <button onClick={() => setEditingColumn(null)} className="text-red-500 hover:text-red-600"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-gray-700">{col}</span>
                      <div className="flex gap-1 border-l border-gray-200 pl-2">
                        <button 
                          onClick={() => { setEditingColumn(col); setEditColumnName(col); }} 
                          className="text-gray-400 hover:text-green-600 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteColumn(col)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {isAddingColumn && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <input 
                    type="text" 
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Column name"
                    className="px-2 py-0.5 border border-green-300 rounded outline-none text-sm w-28 focus:border-green-500 bg-white"
                    autoFocus
                  />
                  <button onClick={handleAddColumn} className="text-green-600 hover:text-green-700"><Check className="w-3 h-3" /></button>
                  <button onClick={() => setIsAddingColumn(false)} className="text-red-500 hover:text-red-600"><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-gray-50 appearance-none"
            >
              <option>Draft</option>
              <option>Published</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Page Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="About Us"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Page Name (Slug)</label>
            <input 
              type="text" 
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="/page/about-us"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors" 
            />
          </div>
        </div>

        {/* Rich Text Editor */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-sm font-bold text-gray-800">Page Content</h3>
            <p className="text-xs text-gray-500 font-medium">Tables, links, headings, and images are supported.</p>
          </div>
          
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
            <ReactQuill
              value={content} 
              onChange={setContent}
              placeholder="Write your page content here..."
              theme="snow"
              modules={{ toolbar: editorToolbar }}
              className="page-content-editor"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 pb-8">
          <button 
            onClick={handleSaveClick}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            {page?._id || page?.id ? 'Save changes' : '+ Publish / save draft'}
          </button>
        </div>

      </div>
    </div>
  );
}

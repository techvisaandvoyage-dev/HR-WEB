import React, { useState, useEffect } from 'react';
import { GripVertical, ArrowLeft, ArrowRight, Plus, Trash2, Edit3, Check, X, Layers, FileText, CheckCircle2, Eye } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FooterColumnsManager({ pages = [], onRefreshPages }) {
  const [columnsOrder, setColumnsOrder] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // New Column state
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');

  // Edit Column state
  const [editingColumn, setEditingColumn] = useState(null);
  const [editColumnName, setEditColumnName] = useState('');

  // Fetch current column order from footer config
  useEffect(() => {
    const fetchFooterConfig = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/footer`);
        if (res.ok) {
          const config = await res.json();
          let order = config.columnOrder || ['Company', 'Services', 'Support', 'Legal'];
          
          // Also incorporate any custom columns that exist across current pages
          const pageColumns = Array.from(new Set(pages.map(p => p.footer).filter(Boolean)));
          pageColumns.forEach(c => {
            if (!order.includes(c)) {
              order.push(c);
            }
          });

          setColumnsOrder(order);
        }
      } catch (err) {
        console.error('Failed to fetch footer column config:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFooterConfig();
  }, [pages]);

  // Save Column Order to backend
  const saveColumnsOrder = async (newOrder) => {
    const orderToSave = newOrder || columnsOrder;
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/footer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnOrder: orderToSave })
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save columns order:', err);
    } finally {
      setSaving(false);
    }
  };

  // Move column left or right
  const moveColumn = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= columnsOrder.length) return;

    const newOrder = [...columnsOrder];
    const [movedItem] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, movedItem);

    setColumnsOrder(newOrder);
    saveColumnsOrder(newOrder);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const newOrder = [...columnsOrder];
    const [draggedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);

    setColumnsOrder(newOrder);
    handleDragEnd();
    saveColumnsOrder(newOrder);
  };

  // Add new Column
  const handleAddColumn = async () => {
    const trimmed = newColumnName.trim();
    if (!trimmed) return;
    if (columnsOrder.includes(trimmed)) {
      alert('This column name already exists.');
      return;
    }

    const newOrder = [...columnsOrder, trimmed];
    setColumnsOrder(newOrder);
    setNewColumnName('');
    setIsAddingColumn(false);
    await saveColumnsOrder(newOrder);
  };

  // Rename column
  const handleRenameColumn = async (oldName) => {
    const trimmed = editColumnName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingColumn(null);
      return;
    }
    if (columnsOrder.includes(trimmed)) {
      alert('A column with this name already exists.');
      return;
    }

    const newOrder = columnsOrder.map(c => (c === oldName ? trimmed : c));
    setColumnsOrder(newOrder);
    setEditingColumn(null);

    // Update backend footer config
    await saveColumnsOrder(newOrder);

    // Update all pages that were in the old column
    try {
      await fetch(`${API_URL}/api/pages/rename-column`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldColumnName: oldName, newColumnName: trimmed })
      });
      if (onRefreshPages) onRefreshPages();
    } catch (err) {
      console.error('Failed to update pages with renamed column:', err);
    }
  };

  // Delete column
  const handleDeleteColumn = async (colName) => {
    const pagesInCol = pages.filter(p => p.footer === colName);
    const confirmMsg = pagesInCol.length > 0
      ? `Column "${colName}" has ${pagesInCol.length} page(s). Are you sure you want to remove it from the footer order?`
      : `Are you sure you want to delete column "${colName}"?`;

    if (!window.confirm(confirmMsg)) return;

    const newOrder = columnsOrder.filter(c => c !== colName);
    setColumnsOrder(newOrder);
    await saveColumnsOrder(newOrder);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium">
        Loading footer columns...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-6 rounded-2xl border border-emerald-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Footer Columns Position & Ordering
            </h3>
          </div>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            Drag cards left or right, or use the arrow buttons to position how your footer columns appear on the live website.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAddingColumn(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Column
          </button>
          <button
            onClick={() => saveColumnsOrder(columnsOrder)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Order Saved!
              </>
            ) : (
              'Save Positions'
            )}
          </button>
        </div>
      </div>

      {/* Add Column Popup Form */}
      {isAddingColumn && (
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md flex items-center gap-3">
          <input
            type="text"
            placeholder="Enter new column name (e.g. Solutions, Resources)..."
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddColumn(); }}
            autoFocus
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
          />
          <button
            onClick={handleAddColumn}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => { setIsAddingColumn(false); setNewColumnName(''); }}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Drag & Drop Horizontal Columns Board */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Live Footer Sequence (Left to Right)
          </label>
          <span className="text-xs text-gray-400 font-medium">
            {columnsOrder.length} Columns Total
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {columnsOrder.map((colName, index) => {
            const pagesInCol = pages.filter(p => p.footer === colName);
            const isEditing = editingColumn === colName;
            const isDragging = draggedIndex === index;
            const isOver = dragOverIndex === index;

            return (
              <div
                key={colName}
                draggable={!isEditing}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={`group bg-white rounded-2xl border transition-all duration-200 select-none flex flex-col justify-between overflow-hidden ${
                  isDragging
                    ? 'opacity-40 border-dashed border-emerald-500 scale-95'
                    : isOver
                    ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Column Card Header */}
                <div className="p-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700 p-1 rounded transition-colors"
                      title="Drag to reorder position"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editColumnName}
                          onChange={(e) => setEditColumnName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRenameColumn(colName); }}
                          autoFocus
                          className="px-2 py-1 text-xs border border-emerald-500 rounded-md outline-none w-full bg-white font-bold"
                        />
                        <button
                          onClick={() => handleRenameColumn(colName)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Save"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingColumn(null)}
                          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {colName}
                      </h4>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingColumn(colName); setEditColumnName(colName); }}
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded transition-colors"
                        title="Rename column"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteColumn(colName)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Column Pages List */}
                <div className="p-4 flex-1 space-y-2 min-h-[140px] max-h-[220px] overflow-y-auto custom-scrollbar">
                  {pagesInCol.length > 0 ? (
                    pagesInCol.map((page) => (
                      <div
                        key={page._id || page.id || page.slug}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-gray-50 rounded-lg text-xs border border-gray-100"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-semibold text-gray-800 truncate">{page.title}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${page.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                          {page.status || 'Published'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-3 text-gray-400 text-xs italic">
                      No pages assigned yet
                    </div>
                  )}
                </div>

                {/* Card Footer: Left & Right Shift Arrows */}
                <div className="p-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => moveColumn(index, -1)}
                    disabled={index === 0}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    title="Move column to left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Left</span>
                  </button>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {pagesInCol.length} {pagesInCol.length === 1 ? 'Page' : 'Pages'}
                  </span>
                  <button
                    onClick={() => moveColumn(index, 1)}
                    disabled={index === columnsOrder.length - 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200/70 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                    title="Move column to right"
                  >
                    <span>Right</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Visual Preview Frame */}
      <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-sm border border-gray-800">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
          <Eye className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-300">
            Live Preview on Website Footer
          </h4>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {columnsOrder.map((colName) => {
            const colPages = pages.filter(p => p.footer === colName && p.status === 'Published');
            return (
              <div key={colName} className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {colName}
                </h5>
                <ul className="space-y-1 text-xs text-gray-400">
                  {colPages.length > 0 ? (
                    colPages.map(p => (
                      <li key={p.slug} className="truncate hover:text-white transition-colors cursor-pointer">
                        • {p.title}
                      </li>
                    ))
                  ) : (
                    <li className="italic text-gray-600">(Empty)</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

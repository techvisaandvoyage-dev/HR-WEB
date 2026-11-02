import React, { useState } from 'react';
import { createPortal } from 'react-dom';

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  docUrl,
  docName = 'Document Preview',
  docMeta = null
}) {
  const [viewerMode, setViewerMode] = useState('direct'); // 'direct' | 'google'

  if (!isOpen || !docUrl) return null;

  const isImage = /\.(jpe?g|png|webp|gif|bmp|svg)(\?.*)?$/i.test(docUrl) || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(docName);
  const isDoc = /\.(docx?|odt|rtf)(\?.*)?$/i.test(docUrl) || /\.(docx?|odt|rtf)$/i.test(docName);

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`;
  const iframeSrc = (isDoc || viewerMode === 'google') ? googleViewerUrl : docUrl;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = docUrl;
    a.download = docName || 'document';
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      style={{ overscrollBehavior: 'contain' }}
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-gray-200 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0 truncate">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight truncate">
                {docName || 'Uploaded Document'}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                {docMeta?.compressedSize ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    ⚡ {docMeta.compressedSize} {docMeta.savedPercent > 0 ? `(-${docMeta.savedPercent}%)` : ''}
                  </span>
                ) : docMeta?.size ? (
                  <span className="text-[11px] text-gray-500 font-medium">{docMeta.size}</span>
                ) : null}
                <span className="text-[11px] text-gray-400">In-App Preview</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!isImage && (
              <button
                type="button"
                onClick={() => setViewerMode(prev => prev === 'direct' ? 'google' : 'direct')}
                className="hidden sm:inline-flex px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Switch between Direct Viewer and Google Docs Viewer"
              >
                {viewerMode === 'direct' ? 'Google Viewer' : 'Direct Viewer'}
              </button>
            )}

            <button
              type="button"
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download</span>
            </button>

            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
              title="Open in new window"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
              title="Close Preview"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 bg-gray-100 overflow-hidden relative flex items-center justify-center">
          {isImage ? (
            <div className="w-full h-full p-4 overflow-auto flex items-center justify-center bg-gray-900/5">
              <img 
                src={docUrl} 
                alt={docName} 
                className="max-w-full max-h-full object-contain rounded-xl shadow-md border border-gray-200" 
              />
            </div>
          ) : (
            <iframe
              src={iframeSrc}
              title={docName}
              className="w-full h-full border-0 bg-white"
              style={{ border: 'none', width: '100%', height: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}


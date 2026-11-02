import React, { useState, useRef } from 'react';
import { compressFile, formatFileSize, calculateSavedPercent } from '../../utils/fileCompressor';

export default function FileCompressorModal({
  isOpen,
  onClose,
  targetField = 'resume', // 'resume' | 'coverLetter' | 'document'
  onApplyCompressedFile
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [compressedResult, setCompressedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const targetLabel = targetField === 'resume' ? 'Resume' : targetField === 'coverLetter' ? 'Cover Letter' : 'Document';

  const handleProcessFile = async (file) => {
    if (!file) return;
    setErrorMessage('');
    setSelectedFile(file);
    setCompressedResult(null);
    setIsProcessing(true);

    try {
      const TARGET_LIMIT = 300 * 1024; // 300KB
      const res = await compressFile(file, TARGET_LIMIT);
      
      const compSize = res.size;
      const origSize = file.size;
      const savedPct = calculateSavedPercent(origSize, compSize);
      const isUnderLimit = compSize <= TARGET_LIMIT;

      setCompressedResult({
        file: res,
        originalSize: origSize,
        compressedSize: compSize,
        savedPercent: savedPct,
        isUnderLimit
      });

      if (!isUnderLimit && !file.name.match(/\.(pdf|jpe?g|png)$/i)) {
        setErrorMessage(`Word/DOCX files cannot be further compressed client-side. Please convert to PDF or use one of the tools below.`);
      } else if (!isUnderLimit) {
        setErrorMessage(`File was reduced from ${formatFileSize(origSize)} to ${formatFileSize(compSize)}, but still exceeds 300KB. For scanned PDFs, try an online PDF compressor below.`);
      }
    } catch (err) {
      console.error('Compression error:', err);
      setErrorMessage('Could not compress this file. You can try a free online compressor below.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleApply = () => {
    if (compressedResult?.file && onApplyCompressedFile) {
      onApplyCompressedFile(compressedResult.file, targetField);
      handleClose();
    }
  };

  const handleDownload = () => {
    if (!compressedResult?.file) return;
    const url = URL.createObjectURL(compressedResult.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${compressedResult.file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setCompressedResult(null);
    setErrorMessage('');
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shadow-xs">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                File Compressor
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Optimize {targetLabel} to fit under 300KB
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleClose}
            className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Target Requirement Badge */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Target Upload Size:</span>
            <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
              ≤ 300 KB
            </span>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver 
                ? 'border-emerald-500 bg-emerald-50/60' 
                : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50/60'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={onFileInputChange} 
              className="hidden" 
            />

            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <p className="text-sm font-bold text-gray-800">
              {selectedFile ? 'Choose another file' : 'Click or drag file here to compress'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports PDF, DOCX, DOC, JPG, PNG
            </p>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-pulse">
              <svg className="animate-spin w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Compressing and optimizing document...
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Optimizing streams & embedded media without compromising quality
                </p>
              </div>
            </div>
          )}

          {/* Compression Results */}
          {compressedResult && !isProcessing && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-800 truncate max-w-[200px]">
                  {selectedFile?.name}
                </span>
                {compressedResult.isUnderLimit ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>✓</span> Under 300KB
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Exceeds 300KB
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-gray-200/80">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Original</p>
                  <p className="text-xs font-bold text-gray-700 mt-0.5">
                    {formatFileSize(compressedResult.originalSize)}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-emerald-200 bg-emerald-50/30">
                  <p className="text-[10px] text-emerald-600 font-semibold uppercase">Compressed</p>
                  <p className="text-xs font-extrabold text-emerald-700 mt-0.5">
                    {formatFileSize(compressedResult.compressedSize)}
                  </p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-200/80">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">Savings</p>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">
                    {compressedResult.savedPercent > 0 ? `-${compressedResult.savedPercent}%` : '0%'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {onApplyCompressedFile && (
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!compressedResult.isUnderLimit}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>✓</span>
                    <span>Use as {targetLabel}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              {errorMessage}
            </div>
          )}

          {/* Quick External Online Compressors Fallback */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Free Online Compressors (External)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="https://www.ilovepdf.com/compress_pdf"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-center transition-all group"
              >
                <p className="text-xs font-bold text-gray-800 group-hover:text-emerald-700">iLovePDF</p>
                <p className="text-[10px] text-gray-400">PDF Tool</p>
              </a>
              <a
                href="https://tinypng.com"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-center transition-all group"
              >
                <p className="text-xs font-bold text-gray-800 group-hover:text-emerald-700">TinyPNG</p>
                <p className="text-[10px] text-gray-400">Image Tool</p>
              </a>
              <a
                href="https://www.adobe.com/acrobat/online/compress-pdf.html"
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-center transition-all group"
              >
                <p className="text-xs font-bold text-gray-800 group-hover:text-emerald-700">Adobe PDF</p>
                <p className="text-[10px] text-gray-400">Official Free</p>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


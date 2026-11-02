import { optimizeUploadFile, formatBytes, FINAL_UPLOAD_TARGET_BYTES } from './optimizeUploadFile';

/**
 * Helper to format byte sizes into human readable strings (e.g. 240 KB, 1.4 MB)
 * Uses the exact Visavo.in format helper.
 */
export const formatFileSize = formatBytes;

/**
 * Calculates reduction percentage between original and compressed size
 */
export const calculateSavedPercent = (orig, comp) => {
  if (!orig || !comp || comp >= orig) return 0;
  return Math.round(((orig - comp) / orig) * 100);
};

/**
 * Client-side file compressor using Visavo.in's optimizeUploadFile engine.
 * Automatically targets under 300KB for direct uploads.
 * 
 * Supports:
 * - PDF documents (stream packing, metadata stripping, aggressive canvas rasterization)
 * - Image files (browser-image-compression with progressive size reduction)
 * 
 * @param {File} file - The uploaded file
 * @param {number} maxBytes - Target maximum bytes (default 300KB)
 * @returns {Promise<File>} - Optimized file under 300KB
 */
export const compressFileIfNeeded = async (file, maxBytes = FINAL_UPLOAD_TARGET_BYTES) => {
  if (!file) return file;

  // Already under 300KB
  if (file.size <= maxBytes) {
    file.originalSize = file.size;
    file.compressedSize = file.size;
    file.wasCompressed = false;
    file.savedPercent = 0;
    return file;
  }

  try {
    const res = await optimizeUploadFile(file, { targetBytes: maxBytes });
    if (res && res.file) {
      const optimized = res.file;
      optimized.originalSize = res.originalSize || file.size;
      optimized.compressedSize = res.compressedSize || optimized.size;
      optimized.wasCompressed = res.wasCompressed || (optimized.size < file.size);
      optimized.savedPercent = calculateSavedPercent(file.size, optimized.size);
      return optimized;
    }
  } catch (err) {
    console.error("Auto compression using Visavo optimizer failed:", err);
  }

  // Fallback if optimization errored or wasn't applicable
  file.originalSize = file.size;
  file.compressedSize = file.size;
  file.wasCompressed = false;
  file.savedPercent = 0;
  return file;
};

/**
 * Alias for manual or direct calls
 */
export const compressFile = compressFileIfNeeded;

export { optimizeUploadFile };

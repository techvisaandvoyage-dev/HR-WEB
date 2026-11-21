const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Universal file downloader that reliably triggers real browser downloads.
 * 1. Tries direct fetch -> Blob URL (zero server load, same-origin blob download).
 * 2. If CORS prevents client-side fetch, falls back to the backend download proxy
 *    which streams the file with `Content-Disposition: attachment; filename="..."`.
 * 3. Fallback to direct anchor navigation if all else fails.
 */
export const downloadFile = async (url, desiredFilename = 'download.pdf') => {
  if (!url) return false;

  // Infer extension if not provided
  let safeName = desiredFilename;
  if (!/\.[a-zA-Z0-9]{2,5}$/.test(safeName)) {
    try {
      const decodedPath = decodeURIComponent(new URL(url).pathname);
      const match = decodedPath.match(/\.([a-zA-Z0-9]{2,5})(\?|$)/);
      if (match) {
        safeName += `.${match[1]}`;
      } else {
        safeName += '.pdf';
      }
    } catch (_) {
      safeName += '.pdf';
    }
  }

  // 1. Direct fetch -> Blob (Fastest, saves to browser downloads directly)
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
      return true;
    }
  } catch (err) {
    console.warn('Direct blob download failed (likely CORS), falling back to download proxy...', err);
  }

  // 2. Server proxy fallback with Content-Disposition: attachment
  try {
    const proxyUrl = `${API_URL}/api/download/file?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeName)}`;
    const a = document.createElement('a');
    a.href = proxyUrl;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err2) {
    console.error('Proxy download failed, attempting window open fallback:', err2);
  }

  // 3. Last-resort fallback
  window.open(url, '_blank', 'noopener,noreferrer');
  return false;
};

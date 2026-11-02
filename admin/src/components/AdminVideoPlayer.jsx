import React from 'react';

/**
 * Extracts Mux playback ID from stream URL or raw string
 */
export const extractMuxPlaybackId = (url) => {
  if (!url) return null;
  const clean = String(url).trim();
  const match = clean.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1].replace('.m3u8', '');
  if (!clean.startsWith('http') && /^[a-zA-Z0-9_-]{10,100}$/.test(clean)) {
    return clean;
  }
  return null;
};

/**
 * Universal In-Drawer Video Player for Admin Portal
 * Renders direct video player preview (Mux, MP4, Firebase Storage, YouTube)
 */
export default function AdminVideoPlayer({ url, className = '' }) {
  if (!url) return null;

  const muxId = extractMuxPlaybackId(url);

  // 1. Mux Streaming Player
  if (muxId) {
    return (
      <div className={`w-full aspect-video bg-black flex items-center justify-center relative overflow-hidden ${className}`}>
        <mux-player
          playback-id={muxId}
          stream-type="on-demand"
          poster={`https://image.mux.com/${muxId}/thumbnail.png`}
          controls
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        ></mux-player>
      </div>
    );
  }

  // 2. Direct Video File (Firebase Storage, MP4, WebM, MOV)
  const isDirect = url.includes('firebasestorage') || /\.(mp4|webm|mov|m4v|mkv)($|\?)/i.test(url);
  if (isDirect) {
    return (
      <div className={`w-full aspect-video bg-black flex items-center justify-center relative overflow-hidden ${className}`}>
        <video
          src={url}
          controls
          preload="metadata"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // 3. YouTube Embed
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1]?.split('&')[0];
    }
    if (videoId) {
      return (
        <div className={`w-full aspect-video bg-black relative overflow-hidden ${className}`}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Video player"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  }

  // 4. Loom Embed
  if (url.includes('loom.com')) {
    const loomId = url.split('/share/')[1]?.split('?')[0];
    if (loomId) {
      return (
        <div className={`w-full aspect-video bg-black relative overflow-hidden ${className}`}>
          <iframe
            src={`https://www.loom.com/embed/${loomId}`}
            title="Loom video player"
            className="w-full h-full border-0"
            allowFullScreen
          />
        </div>
      );
    }
  }

  // 5. Fallback HTML5 player or iframe
  return (
    <div className={`w-full aspect-video bg-black relative overflow-hidden ${className}`}>
      <iframe
        src={url}
        title="Video player preview"
        className="w-full h-full border-0"
        allowFullScreen
      />
    </div>
  );
}


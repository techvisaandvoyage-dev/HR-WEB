import React from 'react';
import MuxPlayer from '@mux/mux-player-react';

/**
 * Universal video player supporting Mux streams, Firebase / direct MP4 videos, and web video links.
 */
export const extractMuxPlaybackId = (url) => {
  if (!url) return null;
  // Match https://stream.mux.com/{PLAYBACK_ID}.m3u8 or https://stream.mux.com/{PLAYBACK_ID}
  const match = url.match(/stream\.mux\.com\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1].replace('.m3u8', '');
  
  // If raw playbackId is stored directly (alphanumeric string)
  if (!url.startsWith('http') && /^[a-zA-Z0-9_-]{10,40}$/.test(url)) {
    return url;
  }
  return null;
};

export const VideoPlayer = ({ url, className = '', maxPlayerHeight = null, poster = '' }) => {
  if (!url) return null;

  const muxPlaybackId = extractMuxPlaybackId(url);

  const containerStyle = maxPlayerHeight ? { maxHeight: maxPlayerHeight } : {};

  // 1. Mux Streaming Video
  if (muxPlaybackId) {
    return (
      <div 
        className={`w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-sm relative ${className}`}
        style={containerStyle}
      >
        <MuxPlayer
          playbackId={muxPlaybackId}
          streamType="on-demand"
          poster={poster || `https://image.mux.com/${muxPlaybackId}/thumbnail.png`}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  // 2. Direct Video File (Firebase Storage, S3, MP4, WebM, MOV)
  const isDirectVideoFile = url.includes('firebasestorage') || /\.(mp4|webm|mov|m4v|mkv)($|\?)/i.test(url);
  if (isDirectVideoFile) {
    return (
      <div 
        className={`w-full aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-sm relative ${className}`}
        style={containerStyle}
      >
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
        <div 
          className={`w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-sm ${className}`}
          style={containerStyle}
        >
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

  // 4. Other video link fallback (Clickable badge)
  return (
    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-xs font-semibold text-emerald-600 hover:underline truncate max-w-md flex items-center gap-1.5"
      >
        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
        {url}
      </a>
      <span className="text-[11px] text-gray-400 font-medium">Open Link</span>
    </div>
  );
};

export default VideoPlayer;

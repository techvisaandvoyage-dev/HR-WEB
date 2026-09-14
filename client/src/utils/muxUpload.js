import * as UpChunk from '@mux/upchunk';

/**
 * Uploads a video file to Mux Video using direct upload & chunked streaming.
 * If Mux credentials are not configured, returns { isMux: false } so caller can use fallback.
 * 
 * @param {File} file - Video file selected by user
 * @param {Function} onProgress - Progress callback (0 - 100)
 * @returns {Promise<{isMux: boolean, playbackId?: string, streamUrl?: string}>}
 */
export const uploadVideoToMux = async (file, onProgress) => {
  if (file && file.size > 100 * 1024 * 1024) {
    throw new Error('Video file size exceeds the 100MB limit.');
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // 1. Request direct upload URL from backend
  const res = await fetch(`${apiUrl}/api/mux/upload-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();

  if (!data.success || !data.configured) {
    // Mux keys are not yet configured on server
    return { isMux: false, message: data.message };
  }

  // 2. Upload file via @mux/upchunk
  return new Promise((resolve, reject) => {
    const upload = UpChunk.createUpload({
      endpoint: data.uploadUrl,
      file: file,
      chunkSize: 5120, // 5MB chunks for smooth upload
    });

    upload.on('progress', (progressDetail) => {
      if (onProgress) {
        onProgress(Math.round(progressDetail.detail));
      }
    });

    upload.on('success', async () => {
      // 3. Poll for the generated Mux public playback ID
      let attempts = 0;
      const maxAttempts = 20;

      const checkAssetReady = async () => {
        try {
          attempts++;
          const assetRes = await fetch(`${apiUrl}/api/mux/asset/${data.uploadId}`);
          const assetData = await assetRes.json();

          if (assetData.playbackId) {
            resolve({
              isMux: true,
              playbackId: assetData.playbackId,
              streamUrl: `https://stream.mux.com/${assetData.playbackId}.m3u8`,
              thumbnailUrl: assetData.thumbnailUrl,
            });
          } else if (attempts < maxAttempts) {
            setTimeout(checkAssetReady, 1200);
          } else {
            // Processing taking longer than usual, return stream URL with asset ID if available
            resolve({
              isMux: true,
              playbackId: assetData.assetId || data.uploadId,
              streamUrl: assetData.streamUrl || `https://stream.mux.com/${assetData.assetId}.m3u8`,
            });
          }
        } catch (err) {
          reject(err);
        }
      };

      setTimeout(checkAssetReady, 1000);
    });

    upload.on('error', (err) => {
      console.error('Mux UpChunk error:', err);
      reject(err.detail || new Error('Failed to upload video to Mux.'));
    });
  });
};

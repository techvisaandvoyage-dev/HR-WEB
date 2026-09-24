const express = require('express');
const router = express.Router();
const Mux = require('@mux/mux-node');

// Route to generate a Direct Upload URL for direct video uploads to Mux
router.post('/upload-url', async (req, res) => {
  try {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret || tokenId.trim() === '' || tokenSecret.trim() === '') {
      return res.status(200).json({
        success: false,
        configured: false,
        message: 'Mux credentials not configured in server/.env yet.'
      });
    }

    const mux = new Mux({
      tokenId: tokenId.trim(),
      tokenSecret: tokenSecret.trim(),
    });

    const directUpload = await mux.video.uploads.create({
      cors_origin: '*',
      new_asset_settings: {
        playback_policy: ['public'],
        encoding_tier: 'baseline',
      },
    });

    res.json({
      success: true,
      configured: true,
      uploadId: directUpload.id,
      uploadUrl: directUpload.url,
    });
  } catch (error) {
    console.error('Mux upload URL error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to poll / retrieve Mux Asset details and public playback ID
router.get('/asset/:uploadId', async (req, res) => {
  try {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;

    if (!tokenId || !tokenSecret || tokenId.trim() === '' || tokenSecret.trim() === '') {
      return res.status(400).json({
        success: false,
        configured: false,
        message: 'Mux not configured.'
      });
    }

    const mux = new Mux({
      tokenId: tokenId.trim(),
      tokenSecret: tokenSecret.trim(),
    });

    const upload = await mux.video.uploads.retrieve(req.params.uploadId);

    if (upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id);

      // Backend validation: Check if video duration exceeds 3 minutes (180 seconds)
      if (asset.duration && asset.duration > 180) {
        try {
          await mux.video.assets.delete(upload.asset_id);
        } catch (delErr) {
          console.warn('Failed to delete oversized duration asset:', delErr);
        }
        const mins = Math.floor(asset.duration / 60);
        const secs = Math.round(asset.duration % 60);
        return res.status(400).json({
          success: false,
          status: 'errored',
          message: `Video length (${mins}m ${secs}s) exceeds the 3-minute limit. Please upload a video under 3 minutes.`
        });
      }

      const playbackId = asset.playback_ids && asset.playback_ids[0] ? asset.playback_ids[0].id : null;
      
      return res.json({
        success: true,
        status: asset.status,
        duration: asset.duration,
        assetId: upload.asset_id,
        playbackId: playbackId,
        streamUrl: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
        thumbnailUrl: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.png` : null,
      });
    }

    res.json({
      success: true,
      status: upload.status,
      uploadId: upload.id,
    });
  } catch (error) {
    console.error('Mux retrieve asset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

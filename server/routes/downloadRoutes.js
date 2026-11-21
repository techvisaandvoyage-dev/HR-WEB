const express = require('express');
const router = express.Router();

/**
 * @desc    Universal File Download Proxy
 *          Fetches file server-side and streams it with Content-Disposition: attachment
 *          Bypasses all client-side CORS and cross-origin download restrictions.
 * @route   GET /api/download/file
 */
router.get('/file', async (req, res) => {
  try {
    const { url, filename } = req.query;
    if (!url) {
      return res.status(400).send('Missing url parameter');
    }

    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).send('Invalid URL protocol');
    }

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch file: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    let safeFilename = (filename || 'download.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure file extension exists
    if (!/\.[a-zA-Z0-9]{2,5}$/.test(safeFilename)) {
      if (contentType.includes('pdf')) safeFilename += '.pdf';
      else if (contentType.includes('word') || contentType.includes('doc')) safeFilename += '.docx';
      else if (contentType.includes('image/png')) safeFilename += '.png';
      else if (contentType.includes('image/jpeg')) safeFilename += '.jpg';
      else safeFilename += '.pdf';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('File download proxy error:', err);
    return res.status(500).send('Error streaming download');
  }
});

module.exports = router;

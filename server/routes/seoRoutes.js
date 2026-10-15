const express = require('express');
const router = express.Router();
const { 
  getSeoSettings, 
  invalidateSeoCache, 
  generateSitemapXml, 
  generateRobotsTxt 
} = require('../services/seoService');
const SiteSettings = require('../models/SiteSettings');

/**
 * GET /api/seo/public
 * Returns public SEO configuration for frontend head injection & analytics
 */
router.get('/public', async (req, res) => {
  try {
    const seo = await getSeoSettings();
    res.json({
      success: true,
      data: seo
    });
  } catch (err) {
    console.error('[SEO Public Route] Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch SEO configuration' });
  }
});

/**
 * GET /sitemap.xml
 * Dynamic XML sitemap for search engines
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const { xml } = await generateSitemapXml();
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    return res.send(xml);
  } catch (err) {
    console.error('[Sitemap.xml] Error generating sitemap:', err);
    res.status(500).send('Error generating sitemap');
  }
});

/**
 * GET /robots.txt
 * Dynamic robots.txt
 */
router.get('/robots.txt', async (req, res) => {
  try {
    const robotsContent = await generateRobotsTxt();
    res.header('Content-Type', 'text/plain');
    res.header('Cache-Control', 'public, max-age=3600');
    return res.send(robotsContent);
  } catch (err) {
    console.error('[Robots.txt] Error generating robots:', err);
    res.status(500).send('Error generating robots.txt');
  }
});

/**
 * POST /api/admin/seo/regenerate-sitemap
 * Admin trigger to ping/rebuild sitemap and return stats
 */
router.post('/admin/regenerate-sitemap', async (req, res) => {
  try {
    invalidateSeoCache();
    const { urlCount } = await generateSitemapXml();
    const seo = await getSeoSettings();
    const sitemapUrl = `${(seo.canonicalUrl || 'https://sahijob.com').replace(/\/+$/, '')}/sitemap.xml`;

    res.json({
      success: true,
      message: `Sitemap regenerated successfully with ${urlCount} indexed URLs!`,
      urlCount,
      sitemapUrl,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[Admin SEO Regenerate] Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to regenerate sitemap' });
  }
});

/**
 * GET /api/admin/seo/health-check
 * Returns real-time SEO health check status checklist
 */
router.get('/admin/health-check', async (req, res) => {
  try {
    const seo = await getSeoSettings();
    const { urlCount } = await generateSitemapXml();

    const gaValid = Boolean(seo.gaMeasurementId && /^G-[A-Z0-9]+$/i.test(seo.gaMeasurementId.trim()));
    const gscValid = Boolean(seo.googleSiteVerification && seo.googleSiteVerification.trim().length > 5);
    const ogValid = Boolean(seo.ogImage && seo.ogImage.trim().length > 5);
    const indexable = seo.allowIndexing !== false;
    const robotsValid = Boolean(seo.robotsTxtContent && seo.robotsTxtContent.length > 10);
    const jobPostingValid = seo.enableJobPostingSchema !== false;
    const titleValid = Boolean(seo.metaTitle && seo.metaTitle.length >= 20 && seo.metaTitle.length <= 70);
    const descValid = Boolean(seo.metaDescription && seo.metaDescription.length >= 100 && seo.metaDescription.length <= 170);

    const checks = [
      {
        id: 'indexable',
        title: 'Search Engine Indexing',
        status: indexable ? 'pass' : 'fail',
        message: indexable ? 'Site allows search engine indexing' : 'Global noindex is currently enabled (blocking search engines)'
      },
      {
        id: 'sitemap',
        title: 'Dynamic XML Sitemap',
        status: urlCount > 0 ? 'pass' : 'warn',
        message: `Sitemap contains ${urlCount} active URLs (/sitemap.xml)`
      },
      {
        id: 'robots',
        title: 'Robots.txt Directive',
        status: robotsValid ? 'pass' : 'warn',
        message: robotsValid ? 'Robots.txt configured with protected paths' : 'Using default robots.txt rules'
      },
      {
        id: 'jobPosting',
        title: 'JobPosting JSON-LD Schema',
        status: jobPostingValid ? 'pass' : 'warn',
        message: jobPostingValid ? 'Google for Jobs schema is active' : 'JobPosting schema is disabled'
      },
      {
        id: 'ga4',
        title: 'Google Analytics 4 Tracking',
        status: gaValid ? 'pass' : 'warn',
        message: gaValid ? `GA4 active with ID: ${seo.gaMeasurementId}` : 'GA4 Measurement ID not set or invalid format (G-XXXXXXXXXX)'
      },
      {
        id: 'gsc',
        title: 'Google Search Console Verification',
        status: gscValid ? 'pass' : 'warn',
        message: gscValid ? 'Search Console verification tag present' : 'Verification tag not configured yet'
      },
      {
        id: 'ogImage',
        title: 'Social Share Image (OG Image)',
        status: ogValid ? 'pass' : 'warn',
        message: ogValid ? 'Social preview image configured' : 'OG image missing (link previews will have no banner)'
      },
      {
        id: 'metaLength',
        title: 'Default Meta Title & Description Length',
        status: titleValid && descValid ? 'pass' : 'warn',
        message: `Title: ${seo.metaTitle?.length || 0}/60 chars, Desc: ${seo.metaDescription?.length || 0}/160 chars`
      }
    ];

    res.json({
      success: true,
      checks,
      overallScore: Math.round((checks.filter(c => c.status === 'pass').length / checks.length) * 100)
    });
  } catch (err) {
    console.error('[SEO Health Check] Error:', err);
    res.status(500).json({ success: false, message: 'Health check failed' });
  }
});

module.exports = router;

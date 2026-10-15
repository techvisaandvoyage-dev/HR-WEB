const SiteSettings = require('../models/SiteSettings');
const Job = require('../models/Job');
const Page = require('../models/Page');

// In-memory cache for ultra-fast response without hitting MongoDB on every public request
let cachedSeo = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached or fresh SEO settings
 */
async function getSeoSettings() {
  const now = Date.now();
  if (cachedSeo && now < cacheExpiry) {
    return cachedSeo;
  }

  try {
    const settings = await SiteSettings.findOne().lean();
    const seo = settings?.seo || {};
    cachedSeo = seo;
    cacheExpiry = now + CACHE_TTL_MS;
    return seo;
  } catch (err) {
    console.error('[SEO Service] Error loading SEO settings from DB:', err.message);
    return cachedSeo || {};
  }
}

/**
 * Invalidate in-memory SEO cache (called when Admin saves settings)
 */
function invalidateSeoCache() {
  cachedSeo = null;
  cacheExpiry = 0;
}

/**
 * Replace placeholders like {job_title}, {company}, {location}, {site_name} in templates
 */
function renderSeoTemplate(templateStr, vars = {}) {
  if (!templateStr || typeof templateStr !== 'string') return '';
  let result = templateStr;
  for (const [key, val] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, val || '');
  }
  // Remove remaining unmatched placeholders and normalize double spaces
  return result.replace(/\{[a-zA-Z0-9_]+\}/g, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * Helper to escape XML special characters
 */
function escapeXml(unsafe = '') {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Dynamically generate XML sitemap covering homepage, active jobs, static pages, and categories
 */
async function generateSitemapXml() {
  const seo = await getSeoSettings();
  const rawBase = seo.canonicalUrl || 'https://sahijob.com';
  const baseUrl = rawBase.replace(/\/+$/, '');

  // 1. Homepage
  const urls = [
    {
      loc: `${baseUrl}/`,
      lastmod: new Date().toISOString().slice(0, 10),
      changefreq: 'daily',
      priority: '1.0'
    }
  ];

  // 2. Active Jobs (skip closed jobs and noindex overrides)
  try {
    const activeJobs = await Job.find({ status: 'Active' })
      .select('_id title location company updatedAt createdAt seo details')
      .lean();

    for (const job of activeJobs) {
      if (job.seo?.noindex) continue;
      const jobUrl = `${baseUrl}/job/${job._id}`;
      const lastmodDate = (job.updatedAt || job.createdAt || new Date()).toISOString().slice(0, 10);
      urls.push({
        loc: jobUrl,
        lastmod: lastmodDate,
        changefreq: 'weekly',
        priority: '0.8'
      });
    }
  } catch (err) {
    console.warn('[SEO Sitemap] Error fetching jobs for sitemap:', err.message);
  }

  // 3. Published Static Pages
  try {
    const pages = await Page.find({ status: 'Published' })
      .select('slug updatedAt noindex')
      .lean();

    for (const p of pages) {
      if (p.noindex || !p.slug) continue;
      const pageUrl = `${baseUrl}/page/${encodeURIComponent(p.slug)}`;
      const lastmodDate = (p.updatedAt || new Date()).toISOString().slice(0, 10);
      urls.push({
        loc: pageUrl,
        lastmod: lastmodDate,
        changefreq: 'monthly',
        priority: '0.6'
      });
    }
  } catch (err) {
    console.warn('[SEO Sitemap] Error fetching pages for sitemap:', err.message);
  }

  // Generate XML structure
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const item of urls) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(item.loc)}</loc>\n`;
    xml += `    <lastmod>${escapeXml(item.lastmod)}</lastmod>\n`;
    xml += `    <changefreq>${escapeXml(item.changefreq)}</changefreq>\n`;
    xml += `    <priority>${escapeXml(item.priority)}</priority>\n`;
    xml += '  </url>\n';
  }
  xml += '</urlset>';

  return { xml, urlCount: urls.length };
}

/**
 * Dynamically generate robots.txt content
 */
async function generateRobotsTxt() {
  const seo = await getSeoSettings();
  const rawBase = seo.canonicalUrl || 'https://sahijob.com';
  const baseUrl = rawBase.replace(/\/+$/, '');

  // If global noindex / search engines disallowed
  if (seo.allowIndexing === false) {
    return `User-agent: *\nDisallow: /\n\n# Indexing is disabled by site administrator in Admin -> Settings -> SEO\n`;
  }

  let robotsContent = (seo.robotsTxtContent || '').trim();
  if (!robotsContent) {
    robotsContent = `User-agent: *
Disallow: /admin
Disallow: /admin/*
Disallow: /api
Disallow: /api/*
Disallow: /employer/dashboard
Disallow: /employee/profile
Disallow: /my-jobs
Allow: /`;
  }

  // Ensure Sitemap line is included if sitemap is enabled
  if (seo.generateSitemap !== false && !robotsContent.toLowerCase().includes('sitemap:')) {
    robotsContent += `\n\nSitemap: ${baseUrl}/sitemap.xml`;
  }

  return robotsContent + '\n';
}

/**
 * Build valid Google Rich Results JobPosting JSON-LD Schema
 */
function buildJobPostingSchema(job, baseUrl = 'https://sahijob.com') {
  if (!job) return null;
  const rawBase = (baseUrl || 'https://sahijob.com').replace(/\/+$/, '');

  // Strip or sanitize HTML for description
  const about = job.details?.aboutRole || '';
  const resp = job.details?.responsibilities || '';
  const skills = job.details?.skillsRequired || '';
  const fullDesc = [about, resp ? `<h3>Responsibilities</h3>${resp}` : '', skills ? `<h3>Skills Required</h3>${skills}` : '']
    .filter(Boolean)
    .join('<br/><br/>') || `${job.title} opening at ${job.company}. Apply now on SahiJob.`;

  // Employment type mapping to Schema.org standard
  const empTypeRaw = (job.details?.employmentType || '').toLowerCase();
  let employmentType = 'FULL_TIME';
  if (empTypeRaw.includes('part')) employmentType = 'PART_TIME';
  else if (empTypeRaw.includes('contract')) employmentType = 'CONTRACTOR';
  else if (empTypeRaw.includes('intern')) employmentType = 'INTERN';
  else if (empTypeRaw.includes('temp')) employmentType = 'TEMPORARY';

  // Date valid through (default 60 days from posting)
  const datePosted = (job.createdAt || new Date()).toISOString();
  const validThroughDate = new Date(new Date(datePosted).getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const isRemote = (job.location || '').toLowerCase().includes('remote') || 
                   (job.details?.workLocation || '').toLowerCase().includes('remote');

  const schema = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: fullDesc,
    datePosted,
    validThrough: validThroughDate,
    employmentType,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      sameAs: rawBase,
      logo: job.companyLogo || job.employerId?.companyLogo || undefined
    },
    identifier: {
      '@type': 'PropertyValue',
      name: 'SahiJob',
      value: String(job._id || job.id)
    },
    directApply: true
  };

  // Job Location
  if (isRemote) {
    schema.jobLocationType = 'TELECOMMUTE';
    schema.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'India'
    };
  } else {
    schema.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || 'India',
        addressCountry: 'IN'
      }
    };
  }

  // Base Salary (only if numeric / available)
  const minSal = parseFloat(job.details?.salaryMin);
  const maxSal = parseFloat(job.details?.salaryMax);
  if (!isNaN(minSal) && minSal > 0) {
    schema.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: job.details?.currency || 'INR',
      value: {
        '@type': 'QuantitativeValue',
        minValue: minSal,
        maxValue: !isNaN(maxSal) && maxSal >= minSal ? maxSal : minSal,
        unitText: (job.details?.salaryType || 'YEAR').toUpperCase()
      }
    };
  }

  // Clean undefined keys
  return JSON.parse(JSON.stringify(schema));
}

module.exports = {
  getSeoSettings,
  invalidateSeoCache,
  renderSeoTemplate,
  generateSitemapXml,
  generateRobotsTxt,
  buildJobPostingSchema
};

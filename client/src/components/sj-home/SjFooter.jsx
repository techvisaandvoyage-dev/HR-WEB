import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCachedLogoConfig } from '../common/BrandLogo';
import './guestAndFooter.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DEFAULT_COLUMNS = {
  Support: [
    { title: 'Contact Us', slug: '/page/contact-us' },
    { title: 'Help Center', slug: '/page/help-center' },
    { title: 'Support Desk', isSupportAction: true },
  ],
  Legal: [
    { title: 'Terms of Service', slug: '/page/terms-and-conditions' },
    { title: 'Privacy Policy', slug: '/page/privacy-policy' },
    { title: 'Cookie Policy', slug: '/page/cookie-policy' },
  ],
  Services: [
    { title: 'About Us', slug: '/page/about-us' },
    { title: 'For Employers', slug: '/page/employers' },
    { title: 'For Consultants', slug: '/page/consultants' },
  ],
  Information: [
    { title: 'Careers', slug: '/page/careers' },
    { title: 'Press & News', slug: '/page/blog' },
    { title: 'FAQs', slug: '/page/faq' },
  ],
};

function renderSocialIcon(platform = '') {
  const p = platform.toLowerCase();
  if (p.includes('facebook') || p === 'fb') {
    return (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (p.includes('twitter') || p.includes('x')) {
    return (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (p.includes('instagram') || p.includes('insta')) {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.5" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (p.includes('linkedin')) {
    return (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (p.includes('youtube')) {
    return (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (p.includes('github')) {
    return (
      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
      />
    </svg>
  );
}

function getPageLink(slug) {
  if (!slug) return '#';
  if (slug.startsWith('http://') || slug.startsWith('https://')) return slug;
  const cleanSlug = slug.replace(/^\/+/, '');
  if (cleanSlug.startsWith('page/')) return `/${cleanSlug}`;
  return `/page/${cleanSlug}`;
}

/**
 * Modern SahiJob Footer matching design mockup with full Admin CMS dynamic integration.
 * Fetches dynamic content, company description, contact details, active social links,
 * and published page columns configured by the administrator.
 */
export default function SjFooter({ customConfig }) {
  const [footerConfig, setFooterConfig] = useState(() => ({
    companyName: 'SahiJob.com',
    logoText: 'sahijob',
    description:
      'Discover opportunities that align with your passion and expertise. Connecting top talent with leading employers worldwide.',
    phone: '+91 (800) 123-4567',
    email: 'info@sahijob.com',
    copyright: `© ${new Date().getFullYear()} SahiJob.com. All rights reserved.`,
    socialLinks: [
      { platform: 'Facebook', url: 'https://facebook.com', isActive: true },
      { platform: 'Twitter', url: 'https://x.com', isActive: true },
      { platform: 'Instagram', url: 'https://instagram.com', isActive: true },
      { platform: 'LinkedIn', url: 'https://linkedin.com', isActive: true },
    ],
    columnOrder: ['Support', 'Legal', 'Services', 'Information'],
    ...(customConfig || {}),
  }));

  const [columns, setColumns] = useState({});
  const [logoConfig, setLogoConfig] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFooterData = async () => {
      try {
        const configPromise = fetch(`${API_URL}/api/footer`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null);

        const pagesPromise = fetch(`${API_URL}/api/pages?status=Published`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => []);

        const logoPromise = getCachedLogoConfig().catch(() => null);

        const [configData, pagesData, logoData] = await Promise.all([
          configPromise,
          pagesPromise,
          logoPromise,
        ]);

        if (!isMounted) return;

        if (configData) {
          setFooterConfig((prev) => ({
            ...prev,
            ...configData,
          }));
        }

        if (logoData) {
          setLogoConfig(logoData);
        }

        if (Array.isArray(pagesData) && pagesData.length > 0) {
          const grouped = pagesData.reduce((acc, page) => {
            const col = page.footer || 'Information';
            if (!acc[col]) acc[col] = [];
            acc[col].push(page);
            return acc;
          }, {});
          setColumns(grouped);
        } else {
          setColumns(DEFAULT_COLUMNS);
        }
      } catch (error) {
        console.error('Failed to fetch dynamic footer data:', error);
      }
    };

    fetchFooterData();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeSocialLinks = (footerConfig.socialLinks || []).filter(
    (link) => link.isActive && link.url
  );

  const activeColumns = Object.keys(columns).length > 0 ? columns : DEFAULT_COLUMNS;
  const columnOrder =
    footerConfig.columnOrder && footerConfig.columnOrder.length > 0
      ? footerConfig.columnOrder
      : ['Support', 'Legal', 'Services', 'Information'];

  const orderedEntries = [];
  columnOrder.forEach((colName) => {
    if (activeColumns[colName] && activeColumns[colName].length > 0) {
      orderedEntries.push([colName, activeColumns[colName]]);
    }
  });
  Object.entries(activeColumns).forEach(([colName, pages]) => {
    if (!columnOrder.includes(colName) && pages.length > 0) {
      orderedEntries.push([colName, pages]);
    }
  });

  return (
    <footer className="sj-gfo">
      <div
        className="sj-gfg"
        style={{ '--footer-cols': orderedEntries.length || 4 }}
      >
        <div>
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
            className="sj-logo inline-flex items-center"
            style={{ color: '#fff', textDecoration: 'none', marginBottom: '16px' }}
            aria-label="SahiJob Home"
          >
            {logoConfig?.type === 'image' && logoConfig.imageUrl ? (
              <img
                src={logoConfig.imageUrl}
                alt={logoConfig.altText || footerConfig.companyName || 'SahiJob.com'}
                style={{
                  height: `${logoConfig.height || 34}px`,
                  maxWidth: '200px',
                  objectFit: 'contain',
                }}
              />
            ) : logoConfig?.type === 'text' && logoConfig?.text && logoConfig.text.trim().toLowerCase() !== 'sahijob' ? (
              <span className="inline-flex items-center tracking-tight">
                <span style={{ color: '#ffffff' }}>{logoConfig.text}</span>
                <span style={{ color: 'var(--sj-accL, var(--sj-acc))' }}>{logoConfig.accentText !== undefined ? logoConfig.accentText : '.com'}</span>
              </span>
            ) : (
              <>
                Sahi<b>Job</b>
                <span style={{ color: 'var(--sj-accL, var(--sj-acc))' }}>{logoConfig?.accentText !== undefined ? logoConfig.accentText : '.com'}</span>
              </>
            )}
          </Link>

          {footerConfig.description && <p>{footerConfig.description}</p>}

          {(footerConfig.email || footerConfig.phone) && (
            <p>
              {footerConfig.email && (
                <>
                  <b>Email:</b>{' '}
                  <a href={`mailto:${footerConfig.email}`}>{footerConfig.email}</a>
                </>
              )}
              {footerConfig.email && footerConfig.phone && <br />}
              {footerConfig.phone && (
                <>
                  <b>Phone:</b>{' '}
                  <a href={`tel:${footerConfig.phone}`}>{footerConfig.phone}</a>
                </>
              )}
            </p>
          )}

          {activeSocialLinks.length > 0 && (
            <>
              <h4>Follow us</h4>
              <div className="sj-soc">
                {activeSocialLinks.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.platform}
                    title={item.platform}
                  >
                    {renderSocialIcon(item.platform)}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>

        {orderedEntries.map(([colName, pages]) => (
          <div key={colName}>
            <h4>{colName}</h4>
            {pages.map((page, idx) => {
              if (
                page.isSupportAction ||
                page.slug === '#sj-support' ||
                page.title?.toLowerCase() === 'support desk'
              ) {
                return (
                  <a
                    key={idx}
                    href="#sj-support"
                    onClick={(e) => {
                      e.preventDefault();
                      const btn = document.getElementById('sj-support-fab');
                      if (btn) btn.click();
                    }}
                  >
                    {page.title}
                  </a>
                );
              }

              const href = getPageLink(page.slug);
              const isExternal =
                href.startsWith('http://') || href.startsWith('https://');

              return isExternal ? (
                <a
                  key={page._id || page.id || idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {page.title}
                </a>
              ) : (
                <Link
                  key={page._id || page.id || idx}
                  to={href}
                  onClick={() =>
                    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
                  }
                >
                  {page.title}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sj-gcp">
        <span>
          {footerConfig.copyright ||
            `© ${new Date().getFullYear()} ${footerConfig.companyName || 'SahiJob.com'}. All rights reserved.`}
        </span>
      
      </div>
    </footer>
  );
}

import React, { useEffect } from 'react';

/**
 * Helper to get or create a <meta> tag
 */
const setMetaTag = (attrName, attrValue, content) => {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  if (content !== undefined && content !== null) {
    element.setAttribute('content', content);
  }
};

/**
 * Helper to get or create a <link> tag
 */
const setLinkTag = (rel, href) => {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  if (href) {
    element.setAttribute('href', href);
  }
};

/**
 * Dynamic SEO Head Component for React SPA
 * 
 * Props:
 * - title: string
 * - description: string
 * - keywords: string or array
 * - canonicalUrl: string
 * - noindex: boolean
 * - nofollow: boolean
 * - ogTitle: string
 * - ogDescription: string
 * - ogImage: string
 * - ogType: string
 * - twitterCard: string
 * - schema: object or array of objects (JSON-LD)
 */
const SEOHead = ({
  title,
  description,
  keywords,
  canonicalUrl,
  noindex = false,
  nofollow = false,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  twitterSite,
  favicon,
  googleSiteVerification,
  schema
}) => {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Google Site Verification
    if (googleSiteVerification) {
      let token = String(googleSiteVerification);
      const match = token.match(/content=["']([^"']+)["']/i);
      if (match) token = match[1];
      token = token.replace(/google-site-verification[:=]/i, '').trim();
      setMetaTag('name', 'google-site-verification', token);
    }

    // 0. Favicon
    if (favicon) {
      let favElement = document.getElementById('site-favicon') || document.querySelector('link[rel="icon"]');
      if (favElement) {
        favElement.setAttribute('href', favicon);
      } else {
        setLinkTag('icon', favicon);
      }
    }

    // 1. Title
    if (title) {
      document.title = title;
    }

    // 2. Meta description
    if (description) {
      setMetaTag('name', 'description', description);
    }

    // 3. Keywords
    if (keywords) {
      const kw = Array.isArray(keywords) ? keywords.join(', ') : keywords;
      setMetaTag('name', 'keywords', kw);
    }

    // 4. Robots
    const robotsContent = `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;
    setMetaTag('name', 'robots', robotsContent);
    setMetaTag('name', 'googlebot', robotsContent);

    // 5. Canonical URL
    const canonical = canonicalUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : '');
    if (canonical) {
      setLinkTag('canonical', canonical);
    }

    // 6. Open Graph
    setMetaTag('property', 'og:title', ogTitle || title || document.title);
    setMetaTag('property', 'og:description', ogDescription || description || '');
    setMetaTag('property', 'og:type', ogType);
    if (canonical) {
      setMetaTag('property', 'og:url', canonical);
    }
    if (ogImage) {
      setMetaTag('property', 'og:image', ogImage);
    }

    // 7. Twitter Card
    setMetaTag('name', 'twitter:card', twitterCard);
    setMetaTag('name', 'twitter:title', ogTitle || title || document.title);
    setMetaTag('name', 'twitter:description', ogDescription || description || '');
    if (ogImage) {
      setMetaTag('name', 'twitter:image', ogImage);
    }
    if (twitterSite) {
      setMetaTag('name', 'twitter:site', twitterSite);
    }

    // 8. JSON-LD Schema
    const schemaScriptId = 'sahijob-jsonld-schema';
    let scriptElement = document.getElementById(schemaScriptId);

    if (schema) {
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.id = schemaScriptId;
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(schema, null, 2);
    } else if (scriptElement) {
      scriptElement.remove();
    }

    return () => {
      // Clean up dynamic schema on unmount
      const existingScript = document.getElementById(schemaScriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [
    title,
    description,
    keywords,
    canonicalUrl,
    noindex,
    nofollow,
    ogTitle,
    ogDescription,
    ogImage,
    ogType,
    twitterCard,
    twitterSite,
    schema
  ]);

  return null; // Side-effect only component
};

export default SEOHead;

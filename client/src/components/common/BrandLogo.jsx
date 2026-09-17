import React, { useState, useEffect } from 'react';

// Global cache for logo config
let globalLogoConfig = null;
let fetchPromise = null;

export const getCachedLogoConfig = async () => {
  if (globalLogoConfig) return globalLogoConfig;
  if (!fetchPromise) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetchPromise = fetch(`${API_URL}/api/homepage`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.logo) {
          globalLogoConfig = json.data.logo;
          return globalLogoConfig;
        }
        return null;
      })
      .catch(err => {
        console.error('Error fetching brand logo:', err);
        return null;
      })
      .finally(() => {
        fetchPromise = null;
      });
  }
  return fetchPromise;
};

/**
 * Universal BrandLogo Component
 * Dynamically displays the uploaded custom logo image or styled text logo across
 * Employee, Employer, and Public portals.
 */
const BrandLogo = ({ className = '', defaultHeight = 36, onClick, customConfig }) => {
  const [logo, setLogo] = useState(customConfig || globalLogoConfig || {
    type: 'text',
    text: 'sahijob',
    accentText: '.com',
    imageUrl: '',
    altText: 'sahijob.com',
    height: 36
  });

  useEffect(() => {
    if (customConfig) {
      setLogo(customConfig);
      return;
    }
    getCachedLogoConfig().then(cfg => {
      if (cfg) setLogo(cfg);
    });
  }, [customConfig]);

  if (logo?.type === 'image' && logo.imageUrl) {
    return (
      <img
        src={logo.imageUrl}
        alt={logo.altText || 'sahijob.com'}
        style={{ height: `${logo.height || defaultHeight}px` }}
        onClick={onClick}
        className={`object-contain transition-opacity hover:opacity-90 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      />
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`text-2xl font-black text-palette-900 tracking-tight select-none flex items-center gap-0.5 ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
    >
      <span>{logo?.text || 'sahijob'}</span>
      <span className="text-palette-400">{logo?.accentText || '.com'}</span>
    </div>
  );
};

export default BrandLogo;

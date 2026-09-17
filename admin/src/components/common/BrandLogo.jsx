import React, { useState, useEffect } from 'react';

let globalAdminLogoConfig = null;
let fetchPromise = null;

export const getCachedAdminLogoConfig = async () => {
  if (globalAdminLogoConfig) return globalAdminLogoConfig;
  if (!fetchPromise) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetchPromise = fetch(`${API_URL}/api/homepage`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.logo) {
          globalAdminLogoConfig = json.data.logo;
          return globalAdminLogoConfig;
        }
        return null;
      })
      .catch(err => {
        console.error('Error fetching admin brand logo:', err);
        return null;
      })
      .finally(() => {
        fetchPromise = null;
      });
  }
  return fetchPromise;
};

/**
 * Universal BrandLogo for Admin Portal
 */
const BrandLogo = ({ className = '', defaultHeight = 32, onClick, customConfig }) => {
  const [logo, setLogo] = useState(customConfig || globalAdminLogoConfig || {
    type: 'text',
    text: 'SAHIJOB',
    accentText: 'ADMIN',
    imageUrl: '',
    altText: 'sahijob.com',
    height: 32
  });

  useEffect(() => {
    if (customConfig) {
      setLogo(customConfig);
      return;
    }
    getCachedAdminLogoConfig().then(cfg => {
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
      className={`flex items-center gap-2 select-none ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
    >
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-600 to-green-800 text-white flex items-center justify-center font-black text-xs shadow-md shadow-green-700/20">
        sj
      </div>
      <div className="flex items-center gap-1.5 font-black text-gray-900 text-base tracking-tight leading-none">
        <span>{logo?.text || 'SAHIJOB'}</span>
        <span className="text-[11px] font-bold tracking-wider text-green-700 uppercase bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
          ADMIN
        </span>
      </div>
    </div>
  );
};

export default BrandLogo;

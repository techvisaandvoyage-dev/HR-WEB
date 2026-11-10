import React, { useState } from 'react';
import CMSGuidelineBanner from './CMSGuidelineBanner';

const PRESETS = [
  {
    id: 'orange',
    name: 'Sahi Orange (Default)',
    acc: '#ff7a00',
    accHover: '#e66e00',
    accS: '#fff1e5',
    accL: '#ff9433',
    onacc: '#111111',
    ink: '#111111',
    mute: '#6b7280',
    line: '#e6e7ea',
    soft: '#f7f7f4',
    ok: '#0a7a4b',
    danger: '#b91c1c',
  },
  {
    id: 'lime',
    name: 'Neo Lime (Mockup)',
    acc: '#c8ff3d',
    accHover: '#b5f028',
    accS: '#f1ffc9',
    accL: '#d4ff66',
    onacc: '#111111',
    ink: '#111111',
    mute: '#6b7280',
    line: '#e6e7ea',
    soft: '#f4f5f7',
    ok: '#0a7a4b',
    danger: '#b91c1c',
  },
  {
    id: 'emerald',
    name: 'Emerald Corporate',
    acc: '#10b981',
    accHover: '#059669',
    accS: '#d1fae5',
    accL: '#34d399',
    onacc: '#ffffff',
    ink: '#0f172a',
    mute: '#64748b',
    line: '#e2e8f0',
    soft: '#f8fafc',
    ok: '#0a7a4b',
    danger: '#b91c1c',
  },
  {
    id: 'indigo',
    name: 'Electric Indigo',
    acc: '#6366f1',
    accHover: '#4f46e5',
    accS: '#e0e7ff',
    accL: '#818cf8',
    onacc: '#ffffff',
    ink: '#0f172a',
    mute: '#64748b',
    line: '#e2e8f0',
    soft: '#f8fafc',
    ok: '#0a7a4b',
    danger: '#b91c1c',
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    acc: '#8b5cf6',
    accHover: '#7c3aed',
    accS: '#ede9fe',
    accL: '#a78bfa',
    onacc: '#ffffff',
    ink: '#18181b',
    mute: '#71717a',
    line: '#e4e4e7',
    soft: '#fafafa',
    ok: '#0a7a4b',
    danger: '#b91c1c',
  },
];

function hexToRgb(hex) {
  if (!hex) return { r: 0, g: 0, b: 0 };
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16) || 0,
    g: parseInt(clean.substring(2, 4), 16) || 0,
    b: parseInt(clean.substring(4, 6), 16) || 0,
  };
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const l1 = getLuminance(c1.r, c1.g, c1.b);
  const l2 = getLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Modern Master Colors CMS Editor
 */
export default function ThemeMasterColorsEditor({ data, onChange, onSave, isSaving }) {
  const themeTokens = data?.themeTokens || PRESETS[0];

  const handleColorChange = (key, val) => {
    onChange('themeTokens', {
      ...themeTokens,
      [key]: val,
      preset: 'custom',
    });
  };

  const handleApplyPreset = (preset) => {
    onChange('themeTokens', {
      ...preset,
    });
  };

  const contrast = getContrastRatio(themeTokens.acc || '#ff7a00', themeTokens.onacc || '#111111');
  const isAccessible = contrast >= 4.5;
  const isWarning = contrast >= 3.0 && contrast < 4.5;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Theme Master Colors</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure the primary accents, background tones, and typography colors used across the modern SahiJob interface.
        </p>
      </div>

      {/* Guidelines Banner */}
      <CMSGuidelineBanner
        title="Theme Styling & Accessibility Guidelines"
        points={[
          "Select one of the 5 curated presets or customize individual hex tokens.",
          "Accent Color (--sj-acc) is applied to brand highlights, primary buttons, and verified badges.",
          "Ensure text on accent (--sj-onacc) meets WCAG standards for high readability (recommended >= 4.5:1 ratio).",
          "Changes update dynamically on save with zero hardcoded CSS values."
        ]}
      />

      {/* 1. Curated Presets Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🎨</span> Curated Color Presets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {PRESETS.map((p) => {
            const isSelected = themeTokens.acc?.toLowerCase() === p.acc.toLowerCase();
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-gray-900 ring-2 ring-gray-900 shadow-md bg-gray-50/50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full border border-black/10 shrink-0 shadow-xs"
                    style={{ backgroundColor: p.acc }}
                  />
                  <span className="text-xs font-bold text-gray-800 line-clamp-1">{p.name}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                  <span>{p.acc}</span>
                  {isSelected && <span className="ml-auto text-emerald-600 font-bold">✓ Active</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Color Tokens Customizer */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚙️</span> Customize Color Variables
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Accent Color */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Accent Color (--sj-acc)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeTokens.acc || '#ff7a00'}
                onChange={(e) => handleColorChange('acc', e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={themeTokens.acc || '#ff7a00'}
                onChange={(e) => handleColorChange('acc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Logo badge, hero highlights, search button</p>
          </div>

          {/* Accent Soft */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Accent Soft (--sj-accS)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeTokens.accS || '#fff1e5'}
                onChange={(e) => handleColorChange('accS', e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={themeTokens.accS || '#fff1e5'}
                onChange={(e) => handleColorChange('accS', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Tag background chips, subtle pill badges</p>
          </div>

          {/* Text on Accent */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Text On Accent (--sj-onacc)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeTokens.onacc || '#111111'}
                onChange={(e) => handleColorChange('onacc', e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={themeTokens.onacc || '#111111'}
                onChange={(e) => handleColorChange('onacc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Text color inside accent badges and buttons</p>
          </div>

          {/* Ink / Heading Text */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Ink / Headings (--sj-ink)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeTokens.ink || '#111111'}
                onChange={(e) => handleColorChange('ink', e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={themeTokens.ink || '#111111'}
                onChange={(e) => handleColorChange('ink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">H1-H6 headlines, primary text, footer background</p>
          </div>

          {/* Soft Background */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Soft Neutral (--sj-soft)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeTokens.soft || '#f7f7f4'}
                onChange={(e) => handleColorChange('soft', e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={themeTokens.soft || '#f7f7f4'}
                onChange={(e) => handleColorChange('soft', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Row hover background, subtle panel fill</p>
          </div>

          {/* Divider Line */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Border Line (--sj-line)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeTokens.line || '#e6e7ea'}
                onChange={(e) => handleColorChange('line', e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 p-0.5 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={themeTokens.line || '#e6e7ea'}
                onChange={(e) => handleColorChange('line', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-gray-900 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Card borders, row dividers, header separator</p>
          </div>
        </div>

        {/* Contrast Check */}
        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-700">Contrast Ratio (Accent vs Text):</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                isAccessible
                  ? 'bg-emerald-100 text-emerald-800'
                  : isWarning
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {contrast.toFixed(2)}:1 &nbsp;
              {isAccessible ? '✓ Pass AA/AAA' : isWarning ? '⚠ Pass Large text' : '✕ Low Contrast'}
            </span>
          </div>
          <span className="text-xs text-gray-400">Target &gt;= 4.5:1 for optimal candidate readability</span>
        </div>
      </div>

      {/* 3. Live Interactive Theme Preview */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>👁️</span> Live Component Preview
        </h3>

        <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-6 items-center justify-between">
          {/* Logo Badge Preview */}
          <div className="text-2xl font-black text-gray-900 tracking-tight select-none">
            Sahi
            <span
              className="px-2 py-0.5 rounded-lg ml-1"
              style={{
                backgroundColor: themeTokens.acc || '#ff7a00',
                color: themeTokens.onacc || '#111111',
              }}
            >
              Job
            </span>
            .com
          </div>

          {/* Pill Chip Preview */}
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5"
              style={{
                backgroundColor: themeTokens.accS || '#fff1e5',
                color: themeTokens.ink || '#111111',
              }}
            >
              <span>📍</span> Remote
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: themeTokens.accS || '#fff1e5',
                color: themeTokens.ink || '#111111',
              }}
            >
              Full-time
            </span>
          </div>

          {/* Action Button Preview */}
          <button
            type="button"
            className="px-6 py-2.5 rounded-full font-bold text-sm shadow-xs transition-transform transform active:scale-95 cursor-pointer"
            style={{
              backgroundColor: themeTokens.acc || '#ff7a00',
              color: themeTokens.onacc || '#111111',
            }}
          >
            Search Jobs &rarr;
          </button>
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>Saving Changes...</span>
            </>
          ) : (
            <span>Save Theme Colors</span>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * SahiJob Theme Injector
 * Dynamically applies master color tokens to root CSS variables at runtime.
 */
export function injectThemeTokens(tokens) {
  if (!tokens || typeof tokens !== 'object') return;
  const root = document.documentElement;

  if (tokens.acc) {
    root.style.setProperty('--sj-acc', tokens.acc);
    root.style.setProperty('--palette-900', tokens.acc);
    root.style.setProperty('--palette-400', tokens.accHover || tokens.acc);
  }
  if (tokens.accS) {
    root.style.setProperty('--sj-accS', tokens.accS);
    root.style.setProperty('--palette-200', tokens.accS);
    root.style.setProperty('--palette-50', tokens.accS);
  }
  if (tokens.accL) root.style.setProperty('--sj-accL', tokens.accL || tokens.acc);
  if (tokens.onacc) root.style.setProperty('--sj-onacc', tokens.onacc);
  if (tokens.mk) {
    const isLegacyOrange = ['#ffd3c7', '#ffe5dd', '#fff1e5', '#ff9433', '#ff7a00'].includes(tokens.mk.toLowerCase());
    root.style.setProperty('--sj-mk', isLegacyOrange ? '#a7f3d0' : tokens.mk);
  } else {
    root.style.setProperty('--sj-mk', '#a7f3d0');
  }
  if (tokens.ink) root.style.setProperty('--sj-ink', tokens.ink);
  if (tokens.mute) root.style.setProperty('--sj-mute', tokens.mute);
  if (tokens.line) root.style.setProperty('--sj-line', tokens.line);
  if (tokens.soft) root.style.setProperty('--sj-soft', tokens.soft);
  if (tokens.ok) root.style.setProperty('--sj-ok', tokens.ok);
  if (tokens.danger) root.style.setProperty('--sj-danger', tokens.danger);
}


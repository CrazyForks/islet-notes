export type ThemePreference = 'auto' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const themePreferenceChangeEvent = 'islet:theme-preference-change';

export function getThemePreference(): ThemePreference {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'auto';
}

export function getResolvedTheme(): ResolvedTheme {
  const savedTheme = getThemePreference();
  if (savedTheme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return savedTheme;
}

export function setResolvedTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
}

export function initializeTheme() {
  setResolvedTheme(getResolvedTheme());
}

export function saveThemePreference(theme: ThemePreference) {
  localStorage.setItem('theme', theme);
  initializeTheme();
  window.dispatchEvent(new Event(themePreferenceChangeEvent));
}

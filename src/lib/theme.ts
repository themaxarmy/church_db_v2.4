export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

export const getTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
};

export const applyTheme = (theme: Theme) => {
  const dark = theme === 'dark' || (theme === 'system' && systemDark.matches);
  document.documentElement.classList.toggle('dark', dark);
};

export const saveTheme = (theme: Theme) => {
  try {
    if (theme === 'system') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked (e.g. private mode): the choice lasts for this page only.
  }
  applyTheme(theme);
};

// Follows the system setting while the theme is 'system'. Returns an unsubscribe function.
export const watchSystemTheme = () => {
  const onChange = () => {
    if (getTheme() === 'system') applyTheme('system');
  };
  systemDark.addEventListener('change', onChange);
  return () => systemDark.removeEventListener('change', onChange);
};

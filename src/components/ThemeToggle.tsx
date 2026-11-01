import React, { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { getTheme, saveTheme, watchSystemTheme, type Theme } from '../lib/theme';

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };
const LABELS: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' };
const ICONS: Record<Theme, React.ReactNode> = {
  system: <Monitor className="w-5 h-5" />,
  light: <Sun className="w-5 h-5" />,
  dark: <Moon className="w-5 h-5" />,
};

// Floating button on every page: cycles System → Light → Dark.
export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(getTheme);

  useEffect(() => watchSystemTheme(), []);

  const cycle = () => {
    const next = NEXT[theme];
    saveTheme(next);
    setTheme(next);
  };

  return (
    <button
      onClick={cycle}
      className="fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      title={`Theme: ${LABELS[theme]} (click for ${LABELS[NEXT[theme]]})`}
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[NEXT[theme]]}.`}
    >
      {ICONS[theme]}
    </button>
  );
};

import React, { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { getTheme, saveTheme, watchSystemTheme, type Theme } from '../lib/theme';

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

// Light / Dark / System switch. The current choice is highlighted; `labelled` shows the words too.
export const ThemeToggle: React.FC<{ labelled?: boolean }> = ({ labelled = false }) => {
  const [theme, setTheme] = useState<Theme>(getTheme);

  useEffect(() => watchSystemTheme(), []);

  const choose = (next: Theme) => {
    saveTheme(next);
    setTheme(next);
  };

  return (
    <div role="radiogroup" aria-label="Theme" className="inline-flex gap-0.5 rounded-[10px] border border-line bg-chip p-[3px]">
      {OPTIONS.map(({ value, label, icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={labelled ? undefined : `${label} theme`}
            title={`${label} theme`}
            onClick={() => choose(value)}
            className={`flex h-8 items-center justify-center gap-1.5 rounded-[7px] text-sm font-medium transition-colors ${
              labelled ? 'flex-1 px-3' : 'w-8'
            } ${active ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
          >
            {icon}
            {labelled && label}
          </button>
        );
      })}
    </div>
  );
};

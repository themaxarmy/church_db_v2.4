import React from 'react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

// Frame for pages anyone can open (the public form and sign-in): the brand and the theme switch only.
export const PublicLayout: React.FC<{ children: React.ReactNode; width?: 'narrow' | 'wide'; footer?: React.ReactNode }> = ({
  children,
  width = 'wide',
  footer,
}) => (
  <div className="flex min-h-screen flex-col">
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex min-h-[64px] max-w-5xl items-center gap-3 px-4 sm:px-6">
        <Logo withRecords={false} />
        <div className="flex-1" />
        <ThemeToggle />
      </div>
    </header>
    <main className={`mx-auto w-full flex-1 px-4 py-10 sm:px-6 ${width === 'narrow' ? 'max-w-md' : 'max-w-5xl'}`}>
      {children}
    </main>
    {footer && <footer className="mx-auto w-full max-w-5xl px-4 pb-8 text-center text-xs text-ink-muted sm:px-6">{footer}</footer>}
  </div>
);

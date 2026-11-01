import React from 'react';

// Placeholder mark: an orange hill and a sun on a blue square. Swap for the church's logo when there is one.
export const LogoMark: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
    <rect width="32" height="32" rx="8" fill="#1D4ED8" />
    <circle cx="21" cy="11" r="3" fill="#FFFFFF" />
    <path d="M4 25 L13 13 L18 19 L21 16 L28 25 Z" fill="#F97316" />
  </svg>
);

export const Logo: React.FC<{ withRecords?: boolean }> = ({ withRecords = true }) => (
  <span className="flex items-center gap-2.5">
    <LogoMark />
    <span className="text-base font-bold tracking-tight text-ink">
      Holy Hill{withRecords && <span className="text-accent-text"> Records</span>}
    </span>
  </span>
);

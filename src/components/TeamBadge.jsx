import React from 'react';

export default function TeamBadge({ name, hex, color, players, className = '' }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white"
        style={{ backgroundColor: hex, boxShadow: `0 0 0 1px ${hex}55` }}
      />
      <span className="truncate text-sm font-semibold">{name}</span>
      {color && <span className="shrink-0 text-[11px] uppercase tracking-wide text-ink/40">{color}</span>}
      {players && players.length > 0 && (
        <span className="hidden truncate text-xs text-ink/45 sm:inline">{players.join(' · ')}</span>
      )}
    </div>
  );
}
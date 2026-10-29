import React from 'react';
import GameIcon from '@/components/GameIcon';

export default function GameHeader({ game, subtitle, right }) {
  return (
    <div className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${game.accent.gradient} p-5 text-cream sm:p-7`}>
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-white/5" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <GameIcon icon={game.icon} className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cream/60">Game {game.order}</p>
            <h1 className="font-display text-2xl font-semibold sm:text-3xl">
              {game.name} <span className="arabic text-lg text-cream/65">{game.nameAr}</span>
            </h1>
          </div>
        </div>
        {right}
      </div>
      {subtitle && <p className="relative mt-4 max-w-xl text-sm text-cream/75">{subtitle}</p>}
    </div>
  );
}
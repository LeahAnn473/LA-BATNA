import React from 'react';

export default function RoundHeader({ game, turn, headline, subline }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
          Round {turn.round} of {game.rounds}
        </p>
        <h2 className="truncate font-display text-xl font-semibold sm:text-2xl">{headline || `${turn.player}’s turn`}</h2>
        <p className="text-xs text-ink/50">{subline || turn.teamName}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: game.rounds }).map((_, index) => {
          const round = index + 1;
          const state = round === turn.round ? 'w-7 bg-deep' : round < turn.round ? 'w-2 bg-deep/40' : 'w-2 bg-ink/15';
          return <span key={round} className={`h-2 rounded-full transition-all ${state}`} />;
        })}
      </div>
    </div>
  );
}
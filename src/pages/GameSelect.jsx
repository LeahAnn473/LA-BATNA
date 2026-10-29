import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameIcon from '@/components/GameIcon';
import { GAMES, GAME_ORDER } from '@/lib/gameConfig';
import { useGameDay } from '@/lib/GameDayContext';

export default function GameSelect() {
  const navigate = useNavigate();
  const { session } = useGameDay();
  const [variations, setVariations] = useState({ teelah: 'three_holes' });

  function choose(key) {
    const variation = key === 'teelah' ? variations.teelah : 'standard';
    localStorage.setItem('labatna_draft', JSON.stringify({ game_key: key, variation }));
    navigate('/setup');
  }

  const active = session && session.status !== 'finished' ? GAMES[session.game_key] : null;

  return (
    <div className="animate-fade-rise space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-ink/40">Step 1 of 3</p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Choose tonight’s game</h1>
        <p className="mt-2 max-w-xl text-sm text-ink/55">
          Games are played separately. Each one runs four rounds with the same two teams — you can pick another game
          when the final whistle goes.
        </p>
      </div>

      {active && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sand/50 bg-sand-light/60 px-4 py-3">
          <p className="text-sm text-ink/70">
            A game is already in progress: <span className="font-semibold">{active.name}</span> · round {session.current_round} of 4
          </p>
          <Button onClick={() => navigate('/play')} size="sm" className="rounded-full bg-deep text-cream hover:bg-deep-dark">
            Resume
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {GAME_ORDER.map((key) => {
          const game = GAMES[key];
          return (
            <div key={key} className="card-soft overflow-hidden">
              <div className={`h-1.5 w-full ${game.accent.bg}`} />
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${game.accent.soft} ${game.accent.text}`}>
                      <GameIcon icon={game.icon} className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-ink/35">Game {game.order}</p>
                      <h2 className="font-display text-xl font-semibold sm:text-2xl">
                        {game.name} <span className="arabic text-base text-ink/40">{game.nameAr}</span>
                      </h2>
                      <p className="text-xs text-ink/45">{game.tagline}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 text-[11px] text-ink/50">
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" /> {game.rounds} rounds
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {game.turnSeconds >= 180 ? '3 min rounds' : `${game.turnSeconds}s turns`}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> 2 v 2
                    </span>
                  </div>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/60">{game.blurb}</p>

                {game.variations.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {game.variations.map((variation) => {
                      const selected = variations[key] === variation.key;
                      return (
                        <button
                          key={variation.key}
                          type="button"
                          onClick={() => setVariations((current) => ({ ...current, [key]: variation.key }))}
                          className={`rounded-2xl border p-3 text-left transition-all ${
                            selected ? 'border-deep bg-deep/5' : 'border-[#E6DCC9] bg-white hover:border-deep/40'
                          }`}
                        >
                          <span className="flex items-center justify-between text-sm font-semibold">
                            {variation.label}
                            <span className={`h-3.5 w-3.5 rounded-full border ${selected ? 'border-deep bg-deep' : 'border-ink/25'}`} />
                          </span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-ink/55">{variation.description}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-ink/45">
                    {game.scoring.filter((rule) => rule.points > 0).length} ways to score ·{' '}
                    {game.scoring.filter((rule) => rule.points < 0).length} penalties · timer per turn
                  </p>
                  <Button onClick={() => choose(key)} className={`rounded-full px-6 text-cream ${game.accent.bg} hover:opacity-90`}>
                    Choose {game.name} <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Clock, Loader2, Scale, ShieldCheck, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameHeader from '@/components/GameHeader';
import { GAMES, currentTurn, variationLabel } from '@/lib/gameConfig';
import { useGameDay } from '@/lib/GameDayContext';

export default function Rules() {
  const navigate = useNavigate();
  const { session, updateSession } = useGameDay();
  const [saving, setSaving] = useState(false);

  if (!session) {
    return (
      <div className="animate-fade-rise card-soft mx-auto max-w-md p-8 text-center">
        <Scale className="mx-auto h-8 w-8 text-deep" />
        <h1 className="mt-3 font-display text-xl font-semibold">No game day yet</h1>
        <p className="mt-1 text-sm text-ink/55">Choose a game and set the teams, then the rules appear here.</p>
        <Button asChild className="mt-5 rounded-full bg-deep text-cream hover:bg-deep-dark">
          <Link to="/games">Choose a game</Link>
        </Button>
      </div>
    );
  }

  const game = GAMES[session.game_key];
  const turn = currentTurn(session);
  const positives = game.scoring.filter((rule) => rule.points > 0);
  const penalties = game.scoring.filter((rule) => rule.points < 0);

  async function ready() {
    setSaving(true);
    try {
      await updateSession({ rules_acknowledged: true });
      navigate('/play');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-rise space-y-5">
      <GameHeader
        game={game}
        subtitle={`Variant: ${variationLabel(game.key, session.variation)} · ${game.rounds} rounds · ${
          game.turnSeconds >= 180 ? '3 minutes per round' : `${game.turnSeconds} seconds per turn`
        }`}
        right={
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-cream">
            Step 3 of 3
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card-soft p-5 lg:col-span-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ShieldCheck className="h-4 w-4 text-deep" /> The rules, in plain language
          </h2>
          <ul className="mt-3 space-y-2.5">
            {game.rules.map((rule) => (
              <li key={rule} className="flex gap-2 text-sm leading-relaxed text-ink/70">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-deep" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-deep/5 p-3">
              <Clock className="h-4 w-4 text-deep" />
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ink/45">Time</p>
              <p className="text-sm font-semibold">{game.turnSeconds >= 180 ? '3 min rounds' : `${game.turnSeconds}s turns`}</p>
            </div>
            <div className="rounded-2xl bg-sand-light/60 p-3">
              <Trophy className="h-4 w-4 text-sand-dark" />
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ink/45">Rounds</p>
              <p className="text-sm font-semibold">{game.rounds} per game</p>
            </div>
            <div className="rounded-2xl bg-coral-light/60 p-3">
              <Users className="h-4 w-4 text-coral-dark" />
              <p className="mt-1 text-[11px] uppercase tracking-wide text-ink/45">Turns</p>
              <p className="text-sm font-semibold">Alternating</p>
            </div>
          </div>

          <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs leading-relaxed text-ink/55">
            <span className="font-semibold text-ink/70">Tie-break:</span> {game.tieBreak}
          </p>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card-soft p-5">
            <h2 className="font-display text-base font-semibold">How the score works</h2>
            <div className="mt-3 space-y-2">
              {positives.map((rule) => (
                <div key={rule.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink/65">{rule.label}</span>
                  <span className="num shrink-0 rounded-full bg-deep/5 px-2 py-0.5 font-semibold text-deep">+{rule.points}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-[#F1E8D8] pt-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">Deductions</p>
              {penalties.map((rule) => (
                <div key={rule.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-ink/65">{rule.label}</span>
                  <span className="num shrink-0 rounded-full bg-coral-light px-2 py-0.5 font-semibold text-coral-dark">{rule.points}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-ink/45">
              Earned points, bonuses and penalties stay separate, and every deduction carries its reason in the FairPlay
              log.
            </p>
          </div>

          <div className="rounded-2xl border border-[#EFE5D5] bg-white/70 p-4">
            <p className="text-[11px] leading-relaxed text-ink/55">
              <span className="font-semibold text-ink/70">Privacy:</span> the camera is framed on the play surface, not
              faces. Recordings stay on this device until you ask the referee to review them, and you choose when to
              remove them.
            </p>
          </div>
        </div>
      </div>

      <div className="card-soft flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">{turn.teamName} open the game</p>
          <p className="text-[11px] text-ink/45">
            {session.game_key === 'sayless'
              ? `${turn.giver} gives the first clue · ${turn.guesser} guesses`
              : session.game_key === 'football'
                ? 'Both teams on the pitch · teams switch sides each round'
                : `${turn.player} throws first`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" className="rounded-full text-ink/50">
            <Link to="/setup?edit=1">Edit teams</Link>
          </Button>
          <Button onClick={ready} disabled={saving} className="h-12 rounded-full bg-deep px-6 text-cream hover:bg-deep-dark">
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            Everyone ready <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
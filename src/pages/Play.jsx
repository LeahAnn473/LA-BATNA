import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, RotateCcw, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGameDay } from '@/lib/GameDayContext';
import { GAMES, currentTurn } from '@/lib/gameConfig';
import GameHeader from '@/components/GameHeader';
import RoundHeader from '@/components/RoundHeader';
import ScoreBoard from '@/components/ScoreBoard';
import EventLog from '@/components/EventLog';
import ManualPoints from '@/components/ManualPoints';
import RuleAlert from '@/components/RuleAlert';
import TeelahPlay from '@/pages/play/TeelahPlay';
import SayLessPlay from '@/pages/play/SayLessPlay';
import FootballPlay from '@/pages/play/FootballPlay';

export default function Play() {
  const navigate = useNavigate();
  const { session, events, addEvent, removeEvent, confirmEvent, updateSession, clearEvents } = useGameDay();
  const [alert, setAlert] = useState(null);
  const [busy, setBusy] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  useEffect(() => {
    if (session && session.status === 'finished') navigate('/results', { replace: true });
  }, [session, navigate]);

  if (!session) {
    return (
      <div className="animate-fade-rise card-soft mx-auto max-w-md p-8 text-center">
        <Trophy className="mx-auto h-8 w-8 text-deep" />
        <h1 className="mt-3 font-display text-xl font-semibold">Nothing on the pitch yet</h1>
        <p className="mt-1 text-sm text-ink/55">Choose a game and set the teams to open the scoreboard.</p>
        <Button asChild className="mt-5 rounded-full bg-deep text-cream hover:bg-deep-dark">
          <Link to="/games">Start a game day</Link>
        </Button>
      </div>
    );
  }

  const game = GAMES[session.game_key];
  const turn = currentTurn(session);

  if (!session.rules_acknowledged) {
    return (
      <div className="animate-fade-rise card-soft mx-auto max-w-md p-8 text-center">
        <h1 className="font-display text-xl font-semibold">Rules first</h1>
        <p className="mt-1 text-sm text-ink/55">Show the rules and press “Everyone ready” to open the round.</p>
        <Button asChild className="mt-5 rounded-full bg-deep text-cream hover:bg-deep-dark">
          <Link to="/rules">Show the rules</Link>
        </Button>
      </div>
    );
  }

  async function advanceRound() {
    setBusy(true);
    try {
      if (session.game_key === 'sayless') {
        const ownPenalties = events.filter(
          (event) =>
            event.status !== 'pending' &&
            Number(event.round_number) === session.current_round &&
            event.team === turn.team &&
            event.kind === 'penalty'
        );
        if (ownPenalties.length === 0) {
          await addEvent({
            team: turn.team,
            kind: 'bonus',
            points: 2,
            rule_key: 'clean_round',
            reason: 'No violations in the round',
          });
        }
      }
      if (session.current_round >= game.rounds) {
        await updateSession({ status: 'finished' });
        navigate('/results');
      } else {
        await updateSession({ current_round: session.current_round + 1 });
      }
    } finally {
      setBusy(false);
    }
  }

  async function restart() {
    setRestarting(true);
    try {
      await clearEvents();
      await updateSession({ current_round: 1, status: 'playing', ai_summary_json: '' });
      setConfirmRestart(false);
    } finally {
      setRestarting(false);
    }
  }

  function showAlert(next) {
    setAlert(next);
  }

  const sharedProps = { session, events, addEvent, updateSession, onAlert: showAlert };

  return (
    <div className="animate-fade-rise space-y-4">
      <GameHeader
        game={game}
        subtitle={`${turn.teamName} · ${session.game_key === 'football' ? 'teams switch sides each round' : 'turns alternate each round'}`}
        right={
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-cream">
              Round {turn.round} / {game.rounds}
            </span>
            <button
              type="button"
              onClick={() => setConfirmRestart(true)}
              className="rounded-full bg-white/10 p-2 text-cream/80 transition-colors hover:bg-white/20"
              title="Restart game"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <RoundHeader
        game={game}
        turn={turn}
        headline={
          session.game_key === 'football'
            ? `${turn.teamName} round`
            : session.game_key === 'sayless'
              ? `${turn.giver} gives the clues`
              : `${turn.player}’s turn`
        }
        subline={
          session.game_key === 'football'
            ? 'Both teams on the pitch — switch sides between rounds'
            : session.game_key === 'sayless'
              ? `${turn.guesser} guesses · ${turn.teamName}`
              : `${turn.teamName} · throw from behind the line`
        }
      />

      <ScoreBoard session={session} events={events} activeTeam={turn.team} />

      {session.game_key === 'teelah' && <TeelahPlay key={`teelah-${turn.round}`} {...sharedProps} />}
      {session.game_key === 'sayless' && <SayLessPlay key={`sayless-${turn.round}`} {...sharedProps} turn={turn} game={game} />}
      {session.game_key === 'football' && <FootballPlay key={`football-${turn.round}`} {...sharedProps} turn={turn} />}

      <ManualPoints game={game} session={session} activeTeam={turn.team} onAdd={addEvent} />

      <EventLog events={events} session={session} onUndo={removeEvent} onConfirm={confirmEvent} />

      {confirmRestart && (
        <div className="card-soft space-y-3 border-coral/40 p-4">
          <p className="text-sm font-semibold">Restart this game?</p>
          <p className="text-xs text-ink/55">
            The score, penalties and event log are cleared and the game goes back to round 1. The teams stay.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmRestart(false)} className="flex-1 rounded-full border-[#E6DCC9]">
              Cancel
            </Button>
            <Button onClick={restart} disabled={restarting} className="flex-1 rounded-full bg-coral text-white hover:bg-coral-dark">
              {restarting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Restart
            </Button>
          </div>
        </div>
      )}

      <div className="card-soft flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">
            {turn.round >= game.rounds ? 'Last round — finish when the play is done.' : `Round ${turn.round} of ${game.rounds}`}
          </p>
          <p className="text-[11px] text-ink/45">Undo any entry in the log, or let the referee review the play.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" className="rounded-full text-ink/50">
            <Link to="/results">Results</Link>
          </Button>
          <Button onClick={advanceRound} disabled={busy} className="h-12 rounded-full bg-deep px-6 text-cream hover:bg-deep-dark">
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {turn.round >= game.rounds ? 'Finish game' : `Complete round ${turn.round}`}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>

      <RuleAlert alert={alert} onClose={() => setAlert(null)} />
    </div>
  );
}
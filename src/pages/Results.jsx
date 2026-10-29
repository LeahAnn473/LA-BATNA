import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Crown, Loader2, Sparkles, Trophy, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameHeader from '@/components/GameHeader';
import EventLog from '@/components/EventLog';
import { useGameDay } from '@/lib/GameDayContext';
import { GAMES, teamOf, variationLabel } from '@/lib/gameConfig';
import { bestPlayer, bestRound, penaltyList, scores, winnerOf } from '@/lib/scoring';

function parseSummary(session) {
  try {
    return session.ai_summary_json ? JSON.parse(session.ai_summary_json) : null;
  } catch (error) {
    return null;
  }
}

export default function Results() {
  const navigate = useNavigate();
  const { session, events, removeEvent, confirmEvent, updateSession, clearEvents, resetSession } = useGameDay();
  const [busy, setBusy] = useState(false);

  if (!session) {
    return (
      <div className="animate-fade-rise card-soft mx-auto max-w-md p-8 text-center">
        <Trophy className="mx-auto h-8 w-8 text-sand-dark" />
        <h1 className="mt-3 font-display text-xl font-semibold">No results yet</h1>
        <p className="mt-1 text-sm text-ink/55">Finish a game and the final scoreboard lands here.</p>
        <Button asChild className="mt-5 rounded-full bg-deep text-cream hover:bg-deep-dark">
          <Link to="/games">Start a game day</Link>
        </Button>
      </div>
    );
  }

  const game = GAMES[session.game_key];
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Camera, CheckCircle2, Mic, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameIcon from '@/components/GameIcon';
import { GAMES, GAME_ORDER } from '@/lib/gameConfig';
import { useGameDay } from '@/lib/GameDayContext';

const STEPS = [
  { title: 'Pick the game', text: 'Al Teelah, Say Less Guess More or Football — one at a time, four rounds each.' },
  { title: 'Set the teams', text: 'Four players, two teams of two, names and marble or bib colours.' },
  { title: 'Play the round', text: 'The AI referee watches the play surface and listens, then suggests what it saw.' },
  { title: 'Agree the score', text: 'Apply or reject each moment. The host always has the final say.' },
];

const PROMISES = [
  { icon: ShieldCheck, title: 'Confident calls only', text: 'When the AI is unsure it says “needs host confirmation” instead of changing the score.' },
  { icon: Mic, title: 'Kind game-show voice', text: 'Rule breaks get a friendly pop-up and a spoken call-out, never a harsh one.' },
  { icon: Camera, title: 'Privacy first', text: 'Camera points at the play surface, no faces needed. Recordings stay on your device until you review them.' },
];

export default function Home() {
  const { session } = useGameDay();
  const active = session && session.status !== 'finished' ? GAMES[session.game_key] : null;

  return (
    <div className="animate-fade-rise space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] bg-deep text-cream">
        <div className="grain absolute inset-0 opacity-40" />
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-sand/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-coral/20 blur-2xl" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-cream/55">
            <span className="h-1.5 w-1.5 rounded-full bg-sand" /> Family game day host
          </div>
          <h1 className="mt-4 max-w-xl font-display text-[2.1rem] font-semibold leading-[1.05] sm:text-6xl">
            Game day, without the arguments.
          </h1>
          <p className="mt-2 arabic text-lg text-sand">لعبتنا</p>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-base">
            LA’BATNA hosts three family games for two teams of two, watches the real play through your camera and
            microphone, and keeps a transparent score. A neutral referee, so the fun stays in the room.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-14 rounded-full bg-sand px-7 text-base font-semibold text-ink hover:bg-sand-light">
              <Link to="/games">
                Start Game Day <ArrowRight className="ml-1.5 h-5 w-5" />
              </Link>
            </Button>
            {active && (
              <Button asChild variant="outline" size="lg" className="h-14 rounded-full border-cream/30 bg-white/10 px-6 text-cream hover:bg-white/20 hover:text-cream">
                <Link to="/play">
                  Resume {active.name} · Round {session.current_round}
                </Link>
              </Button>
            )}
          </div>
          <p className="mt-4 text-xs text-cream/50">Two teams · four players · four rounds per game · no sign-up needed</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold">Three games, one referee</h2>
            <p className="text-sm text-ink/50">Played one at a time. Choose another game at the end of each.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {GAME_ORDER.map((key) => {
            const game = GAMES[key];
            return (
              <Link
                key={key}
                to="/games"
                className="card-soft group flex flex-col justify-between p-5 transition-transform hover:-translate-y-0.5"
              >
                <div>
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${game.accent.soft} ${game.accent.text}`}>
                    <GameIcon icon={game.icon} className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold">{game.name}</h3>
                  <p className="arabic text-xs text-ink/40">{game.nameAr}</p>
                  <p className="mt-2 text-xs leading-relaxed text-ink/55">{game.blurb}</p>
                </div>
                <p className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold ${game.accent.text}`}>
                  {game.rounds} rounds · {Math.round(game.turnSeconds / 60)} min {game.turnSeconds >= 60 ? 'rounds' : 'turns'}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 rounded-[1.75rem] border border-[#EFE5D5] bg-white/60 p-6 sm:p-8 md:grid-cols-4">
        {STEPS.map((step, index) => (
          <div key={step.title}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-deep text-xs font-semibold text-cream">
              {index + 1}
            </span>
            <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">{step.text}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">The fair-play promise</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PROMISES.map((promise) => (
            <div key={promise.title} className="card-soft p-5">
              <promise.icon className="h-5 w-5 text-sand-dark" />
              <h3 className="mt-3 text-sm font-semibold">{promise.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink/55">{promise.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-[1.75rem] bg-sand-light/70 px-6 py-10 text-center">
        <Trophy className="h-8 w-8 text-sand-dark" />
        <h2 className="max-w-md font-display text-2xl font-semibold">Everyone ready? Let’s keep it drama-free.</h2>
        <p className="max-w-md text-sm text-ink/55">
          Set up the four players, agree the rules on screen, and LA’BATNA takes it from there — scoreboard, event log and
          all.
        </p>
        <Button asChild size="lg" className="h-14 rounded-full bg-deep px-7 text-base text-cream hover:bg-deep-dark">
          <Link to="/games">
            Start Game Day <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
        <p className="flex items-center gap-1.5 text-[11px] text-ink/45">
          <CheckCircle2 className="h-3.5 w-3.5" /> Teams, rounds and every penalty are saved automatically
        </p>
      </section>
    </div>
  );
}
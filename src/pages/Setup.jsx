import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GAMES, TEAM_COLORS, variationLabel } from '@/lib/gameConfig';
import { useGameDay } from '@/lib/GameDayContext';

const DRAFT_KEY = 'labatna_draft';

const EMPTY = {
  teamAName: 'Team A',
  teamAColor: 'red',
  a1: '',
  a2: '',
  teamBName: 'Team B',
  teamBColor: 'blue',
  b1: '',
  b2: '',
};

function Field({ label, value, onChange, error, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink/45">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-deep ${
          error ? 'border-coral' : 'border-[#E6DCC9]'
        }`}
      />
      {error && <span className="mt-1 block text-[11px] text-coral-dark">{error}</span>}
    </label>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEAM_COLORS.map((color) => {
        const selected = value === color.key;
        return (
          <button
            key={color.key}
            type="button"
            onClick={() => onChange(color.key)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              selected ? 'border-ink/25 bg-white shadow-sm' : 'border-transparent bg-white/50 text-ink/50'
            }`}
          >
            <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: color.hex }} />
            {color.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Setup() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editing = params.get('edit') === '1';
  const { session, startSession, updateSession } = useGameDay();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const draft = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    } catch (error) {
      return null;
    }
  }, []);

  const gameKey = editing && session ? session.game_key : draft?.game_key;
  const game = gameKey ? GAMES[gameKey] : null;
  const variation = editing && session ? session.variation : draft?.variation;

  useEffect(() => {
    if (!editing || !session) return;
    setForm({
      teamAName: session.team_a_name || 'Team A',
      teamAColor: session.team_a_color || 'red',
      a1: session.team_a_player_1 || '',
      a2: session.team_a_player_2 || '',
      teamBName: session.team_b_name || 'Team B',
      teamBColor: session.team_b_color || 'blue',
      b1: session.team_b_player_1 || '',
      b2: session.team_b_player_2 || '',
    });
  }, [editing, session]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.teamAName.trim()) next.teamAName = 'Give this team a name the family will recognise.';
    if (!form.a1.trim()) next.a1 = 'Player 1 needs a name.';
    if (!form.a2.trim()) next.a2 = 'Player 2 needs a name.';
    if (!form.teamBName.trim()) next.teamBName = 'Give the second team a name too.';
    if (!form.b1.trim()) next.b1 = 'Player 3 needs a name.';
    if (!form.b2.trim()) next.b2 = 'Player 4 needs a name.';
    if (form.teamAColor === form.teamBColor) next.colors = 'Each team needs its own colour so the referee can tell them apart.';
    return next;
  }

  async function save() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const hexA = TEAM_COLORS.find((color) => color.key === form.teamAColor);
    const hexB = TEAM_COLORS.find((color) => color.key === form.teamBColor);
    const payload = {
      team_a_name: form.teamAName.trim(),
      team_a_color: hexA?.label || '',
      team_a_color_hex: hexA?.hex || '#0F4C4C',
      team_a_player_1: form.a1.trim(),
      team_a_player_2: form.a2.trim(),
      team_b_name: form.teamBName.trim(),
      team_b_color: hexB?.label || '',
      team_b_color_hex: hexB?.hex || '#EE6A5B',
      team_b_player_1: form.b1.trim(),
      team_b_player_2: form.b2.trim(),
    };

    setSaving(true);
    try {
      if (editing && session) {
        await updateSession(payload);
        navigate('/rules');
        return;
      }
      await startSession({ ...payload, game_key: game.key, variation: variation || 'standard' });
      navigate('/rules');
    } finally {
      setSaving(false);
    }
  }

  if (!game) {
    return (
      <div className="animate-fade-rise card-soft mx-auto max-w-md p-8 text-center">
        <Users className="mx-auto h-8 w-8 text-deep" />
        <h1 className="mt-3 font-display text-xl font-semibold">Pick a game first</h1>
        <p className="mt-1 text-sm text-ink/55">Teams are set up per game day, so choose the game before naming players.</p>
        <Button asChild className="mt-5 rounded-full bg-deep text-cream hover:bg-deep-dark">
          <Link to="/games">Choose a game</Link>
        </Button>
      </div>
    );
  }

  const colorA = TEAM_COLORS.find((color) => color.key === form.teamAColor);
  const colorB = TEAM_COLORS.find((color) => color.key === form.teamBColor);

  return (
    <div className="animate-fade-rise mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.24em] text-ink/40">Step 2 of 3 · {game.name}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Players & teams</h1>
        <p className="mt-2 text-sm text-ink/55">
          Four players, two teams of two. Names are saved with the game so the referee can credit every point.
        </p>
        <p className="mt-1 text-[11px] text-ink/40">Variant: {variationLabel(game.key, variation)}</p>
      </div>

      {errors.colors && (
        <p className="flex items-center gap-2 rounded-xl border border-coral/40 bg-coral-light/60 px-3 py-2 text-sm text-coral-dark">
          <AlertCircle className="h-4 w-4" /> {errors.colors}
        </p>
      )}

      <div className="space-y-4">
        {['A', 'B'].map((side) => {
          const isA = side === 'A';
          const color = isA ? colorA : colorB;
          return (
            <div key={side} className="card-soft p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color?.hex }} />
                  <h2 className="text-sm font-semibold">Team {side}</h2>
                </div>
                <span className="text-[11px] text-ink/45">{isA ? 'Players 1 & 2' : 'Players 3 & 4'}</span>
              </div>

              <div className="mt-3 space-y-3">
                <Field
                  label="Team name"
                  value={isA ? form.teamAName : form.teamBName}
                  onChange={(value) => update(isA ? 'teamAName' : 'teamBName', value)}
                  error={isA ? errors.teamAName : errors.teamBName}
                  placeholder={isA ? 'Desert Falcons' : 'Pearl Divers'}
                />
                <div>
                  <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-ink/45">
                    {game.key === 'teelah' ? 'Marble colour' : 'Bib colour'}
                  </span>
                  <ColorPicker
                    value={isA ? form.teamAColor : form.teamBColor}
                    onChange={(value) => update(isA ? 'teamAColor' : 'teamBColor', value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label={`Player ${isA ? 1 : 3}`}
                    value={isA ? form.a1 : form.b1}
                    onChange={(value) => update(isA ? 'a1' : 'b1', value)}
                    error={isA ? errors.a1 : errors.b1}
                    placeholder="First name"
                  />
                  <Field
                    label={`Player ${isA ? 2 : 4}`}
                    value={isA ? form.a2 : form.b2}
                    onChange={(value) => update(isA ? 'a2' : 'b2', value)}
                    error={isA ? errors.a2 : errors.b2}
                    placeholder="First name"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" className="rounded-full text-ink/50">
          <Link to="/games">Change game</Link>
        </Button>
        <Button onClick={save} disabled={saving} className="h-12 rounded-full bg-deep px-6 text-cream hover:bg-deep-dark">
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Save teams <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
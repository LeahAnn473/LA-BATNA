import React, { useEffect, useState } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { teamOf } from '@/lib/gameConfig';

export default function ManualPoints({ game, session, activeTeam, onAdd }) {
  const [team, setTeam] = useState(activeTeam || 'A');
  const [player, setPlayer] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customPoints, setCustomPoints] = useState('1');
  const [customReason, setCustomReason] = useState('');
  const [flash, setFlash] = useState('');

  useEffect(() => {
    setTeam(activeTeam || 'A');
  }, [activeTeam]);

  const teamInfo = teamOf(session, team);

  function flashMessage(text) {
    setFlash(text);
    setTimeout(() => setFlash(''), 2600);
  }

  async function apply(rule) {
    await onAdd({
      team,
      kind: rule.kind,
      points: rule.points,
      rule_key: rule.key,
      reason: rule.label,
      player_name: player || '',
    });
    flashMessage(`${teamInfo.name}: ${rule.points > 0 ? '+' : ''}${rule.points} · ${rule.label}`);
  }

  async function addCustom() {
    const value = Number(customPoints);
    if (!value) return;
    await onAdd({
      team,
      kind: value < 0 ? 'penalty' : 'scored',
      points: value,
      rule_key: 'custom',
      reason: customReason.trim() || 'Host adjustment',
      player_name: player || '',
    });
    flashMessage(`${teamInfo.name}: ${value > 0 ? '+' : ''}${value} · ${customReason.trim() || 'Host adjustment'}`);
    setCustomReason('');
    setCustomPoints('1');
    setShowCustom(false);
  }

  return (
    <div className="card-soft p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold">Host score pad</h3>
          <p className="text-[11px] text-ink/45">The host always has the final say.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCustom((value) => !value)}
          className="inline-flex items-center gap-1 rounded-full border border-[#E6DCC9] px-2.5 py-1 text-[11px] font-medium text-ink/55 hover:border-deep hover:text-deep"
        >
          <SlidersHorizontal className="h-3 w-3" /> Custom
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        {['A', 'B'].map((key) => {
          const info = teamOf(session, key);
          const selected = team === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTeam(key);
                setPlayer('');
              }}
              className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                selected ? 'border-transparent text-cream' : 'border-[#E6DCC9] bg-white text-ink/55'
              }`}
              style={selected ? { backgroundColor: info.hex } : undefined}
            >
              {info.name}
            </button>
          );
        })}
      </div>

      {teamInfo.players.length > 0 && (
        <select
          value={player}
          onChange={(event) => setPlayer(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[#E6DCC9] bg-white px-3 py-2 text-xs text-ink/70"
        >
          <option value="">No player (team only)</option>
          {teamInfo.players.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {game.scoring.map((rule) => (
          <button
            key={rule.key}
            type="button"
            onClick={() => apply(rule)}
            className={`rounded-2xl border px-3 py-2.5 text-left text-[11px] font-medium leading-tight transition-all active:scale-[0.98] ${
              rule.points < 0
                ? 'border-coral/30 bg-coral-light/50 text-coral-dark hover:border-coral'
                : 'border-[#E6DCC9] bg-white text-ink/75 hover:border-deep'
            }`}
          >
            <span className="num block text-sm font-semibold">
              {rule.points > 0 ? '+' : ''}
              {rule.points}
            </span>
            {rule.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="mt-3 space-y-2 rounded-2xl border border-[#E6DCC9] bg-white p-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={customPoints}
              onChange={(event) => setCustomPoints(event.target.value)}
              className="num w-20 rounded-xl border border-[#E6DCC9] px-3 py-2 text-sm"
              aria-label="Points"
            />
            <input
              value={customReason}
              onChange={(event) => setCustomReason(event.target.value)}
              placeholder="Reason the family will see"
              className="flex-1 rounded-xl border border-[#E6DCC9] px-3 py-2 text-sm"
            />
          </div>
          <Button onClick={addCustom} className="w-full rounded-full bg-deep text-cream hover:bg-deep-dark">
            <Plus className="mr-1 h-4 w-4" /> Add points
          </Button>
        </div>
      )}

      {flash && <p className="mt-3 rounded-xl bg-deep/5 px-3 py-2 text-xs font-medium text-deep">{flash}</p>}
    </div>
  );
}
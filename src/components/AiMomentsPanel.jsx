import React, { useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { teamOf } from '@/lib/gameConfig';
import EvidenceButton from '@/components/EvidenceButton';

function ConfidenceBar({ value }) {
  const percent = Math.round((value || 0) * 100);
  const tone = percent >= 70 ? 'bg-deep' : percent >= 50 ? 'bg-sand' : 'bg-coral';
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/10">
        <span className={`block h-full ${tone}`} style={{ width: `${percent}%` }} />
      </span>
      <span className="num text-[11px] text-ink/45">{percent}%</span>
    </span>
  );
}

export default function AiMomentsPanel({ title = 'AI referee findings', summary, extra, moments, session, onApply, onReject, onRetry, loading, error }) {
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelected((moments || []).filter((moment) => !moment.needsHost).map((moment) => moment.id));
  }, [moments]);

  if (loading) {
    return (
      <div className="card-soft flex items-center gap-3 p-5">
        <Loader2 className="h-5 w-5 animate-spin text-deep" />
        <div>
          <p className="text-sm font-semibold text-ink/80">The AI referee is reviewing the evidence…</p>
          <p className="text-[11px] text-ink/45">This can take a few seconds. Nothing is applied to the score yet.</p>
        </div>
      </div>
    );
  }

  if (!moments) {
    if (!error) return null;
    return (
      <div className="card-soft p-5">
        <p className="text-sm text-coral-dark">{error}</p>
        <div className="mt-3 flex gap-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry} className="rounded-full border-[#E6DCC9]">
              <RefreshCw className="mr-1 h-4 w-4" /> Try again
            </Button>
          )}
        </div>
        <p className="mt-2 text-[11px] text-ink/45">You can always keep playing and score with the host pad below.</p>
      </div>
    );
  }

  function toggle(id) {
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));
  }

  const chosen = moments.filter((moment) => selected.includes(moment.id));

  async function apply() {
    if (submitting || chosen.length === 0) return;
    setSubmitting(true);
    try {
      await onApply(chosen);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card-soft overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-[#F1E8D8] px-4 py-3">
        <div>
          <h3 className="flex items-center gap-1.5 font-display text-base font-semibold">
            <Sparkles className="h-4 w-4 text-sand-dark" /> {title}
          </h3>
          <p className="text-[11px] text-ink/45">Review the moments, then apply only what you agree with.</p>
        </div>
        <span className="rounded-full bg-deep/5 px-2.5 py-1 text-[11px] font-semibold text-deep">{moments.length} found</span>
      </div>

      {summary && <p className="border-b border-[#F5EEE1] bg-sand-light/30 px-4 py-2 text-xs italic text-ink/60">“{summary}”</p>}
      {extra}

      {moments.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-ink/45">
          No clear event was detected in this clip. Replay it and score manually, or record the turn again.
        </p>
      ) : (
        <ul className="divide-y divide-[#F5EEE1]">
          {moments.map((moment) => {
            const team = teamOf(session, moment.team);
            return (
              <li key={moment.id} className="flex items-start gap-3 px-4 py-3">
                <Checkbox
                  checked={selected.includes(moment.id)}
                  onCheckedChange={() => toggle(moment.id)}
                  className="mt-1 border-ink/25 data-[state=checked]:bg-deep data-[state=checked]:border-deep"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: `${team.hex}18`, color: team.hex }}
                    >
                      {team.name}
                    </span>
                    <span className="text-sm font-semibold text-ink/85">{moment.label}</span>
                    <span className={`num rounded-full px-2 py-0.5 text-[11px] font-semibold ${moment.points < 0 ? 'bg-coral-light text-coral-dark' : 'bg-deep/5 text-deep'}`}>
                      {moment.points > 0 ? '+' : ''}
                      {moment.points}
                    </span>
                    {moment.needsHost && (
                      <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-ink">Needs host confirmation</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-snug text-ink/65">{moment.reason}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <ConfidenceBar value={moment.confidence} />
                    {moment.player_name && <span className="text-[11px] text-ink/45">{moment.player_name}</span>}
                    <EvidenceButton uris={moment.evidence_uris} label="Frame" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="border-t border-[#F5EEE1] px-4 py-2 text-xs text-coral-dark">{error}</p>}

      <div className="flex flex-wrap gap-2 border-t border-[#F1E8D8] bg-white/60 px-4 py-3">
        <Button
          onClick={apply}
          disabled={chosen.length === 0 || submitting}
          className="flex-1 rounded-full bg-deep text-cream hover:bg-deep-dark"
        >
          {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
          Apply AI results ({chosen.length})
        </Button>
        <Button variant="outline" onClick={onReject} className="rounded-full border-[#E6DCC9]">
          <X className="mr-1 h-4 w-4" /> Reject
        </Button>
        {onRetry && (
          <Button variant="ghost" onClick={onRetry} className="rounded-full text-ink/55">
            <RefreshCw className="mr-1 h-4 w-4" /> Regenerate
          </Button>
        )}
      </div>
    </div>
  );
}
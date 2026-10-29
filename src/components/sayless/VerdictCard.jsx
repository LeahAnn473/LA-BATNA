import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TONES = {
  ACCEPTABLE: { label: 'Acceptable clue', card: 'border-deep/25 bg-deep/5', text: 'text-deep' },
  BORDERLINE: { label: 'Borderline clue', card: 'border-sand bg-sand-light/60', text: 'text-sand-dark' },
  TOO_DIRECT: { label: 'Too direct', card: 'border-coral bg-coral-light/60', text: 'text-coral-dark' },
};

export default function VerdictCard({ verdict, pending, onApprove, onReject, onDismiss }) {
  if (!verdict) return null;
  const tone = TONES[verdict.verdict] || TONES.BORDERLINE;
  const directness = Math.round(verdict.directness || 0);
  const confidence = Math.round((verdict.confidence || 0) * 100);
  const needsHost = Boolean(pending);

  return (
    <div className={`rounded-2xl border p-4 ${tone.card}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm font-semibold ${tone.text}`}>{tone.label}</p>
        <button type="button" onClick={onDismiss} className="rounded-full p-1 text-ink/35 hover:text-ink/60" aria-label="Dismiss verdict">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-sm leading-snug text-ink/75">{verdict.reason}</p>

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-ink/40">Too direct</span>
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
          <span
            className={`block h-full ${directness > 70 ? 'bg-coral' : directness > 40 ? 'bg-sand' : 'bg-deep/40'}`}
            style={{ width: `${Math.min(100, Math.max(4, directness))}%` }}
          />
        </span>
        <span className="num text-[11px] text-ink/45">{directness}</span>
      </div>
      <p className="mt-1 text-[11px] text-ink/40">AI confidence {confidence}%</p>

      {needsHost && (
        <div className="mt-3 rounded-xl bg-white/80 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sand-dark">Needs host confirmation</p>
          <p className="mt-1 text-[11px] text-ink/55">The referee is not sure enough to change the score. You decide.</p>
          <div className="mt-2 flex gap-2">
            <Button onClick={onApprove} className="flex-1 rounded-full bg-deep text-cream hover:bg-deep-dark">
              <Check className="mr-1 h-4 w-4" /> Apply call
            </Button>
            <Button variant="outline" onClick={onReject} className="flex-1 rounded-full border-[#E6DCC9] bg-white">
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
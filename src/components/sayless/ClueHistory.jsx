import React from 'react';
import { History } from 'lucide-react';

const TONE = {
  ACCEPTABLE: 'bg-deep/5 text-deep',
  BORDERLINE: 'bg-sand-light text-sand-dark',
  TOO_DIRECT: 'bg-coral-light text-coral-dark',
};

export default function ClueHistory({ reviews }) {
  return (
    <div className="card-soft overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[#F1E8D8] px-4 py-3">
        <History className="h-4 w-4 text-deep" />
        <h3 className="font-display text-base font-semibold">Clue history</h3>
      </div>
      {(!reviews || reviews.length === 0) ? (
        <p className="px-4 py-6 text-center text-sm text-ink/45">
          Judged clues appear here with the secret word, the decision and the reason — for any dispute later.
        </p>
      ) : (
        <ul className="max-h-72 divide-y divide-[#F5EEE1] overflow-y-auto">
          {reviews.map((review) => (
            <li key={review.id} className="px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE[review.decision] || 'bg-ink/5 text-ink/60'}`}>
                  {String(review.decision || '').replace('_', ' ')}
                </span>
                <span className="text-[11px] font-semibold text-ink/70">{review.secret_word}</span>
                <span className="text-[10px] text-ink/35">Round {review.round_number}</span>
              </div>
              {review.transcript && <p className="mt-1 text-xs italic text-ink/60">“{review.transcript}”</p>}
              {review.reason && <p className="mt-0.5 text-[11px] text-ink/45">{review.reason}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
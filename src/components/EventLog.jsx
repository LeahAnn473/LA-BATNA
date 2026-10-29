import React from 'react';
import { Check, Minus, Plus, Sparkles, Undo2, UserRound } from 'lucide-react';
import { teamOf } from '@/lib/gameConfig';
import EvidenceButton from '@/components/EvidenceButton';

const KIND_LABEL = { scored: 'Earned', bonus: 'Bonus', penalty: 'Penalty' };

function timeOf(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function EventLog({ events, session, onUndo, onConfirm, limit = 40 }) {
  const list = [...(events || [])]
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
    .slice(0, limit);

  return (
    <div className="card-soft overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[#F1E8D8] px-4 py-3">
        <div>
          <h3 className="font-display text-base font-semibold">FairPlay event log</h3>
          <p className="text-[11px] text-ink/45">Every point, bonus and deduction with its reason.</p>
        </div>
        <span className="rounded-full bg-deep/5 px-2.5 py-1 text-[11px] font-semibold text-deep">{list.length + (events.length > limit ? '+' : '')}</span>
      </div>

      {list.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-ink/45">
          Nothing logged yet. Points appear here the moment they are awarded.
        </p>
      ) : (
        <ul className="divide-y divide-[#F5EEE1]">
          {list.map((event) => {
            const team = teamOf(session, event.team);
            const points = Number(event.points) || 0;
            const pending = event.status === 'pending';
            return (
              <li key={event.id} className={`flex items-start gap-3 px-4 py-3 ${pending ? 'bg-sand-light/40' : ''}`}>
                <div className="w-11 shrink-0 pt-0.5 text-[11px] leading-tight text-ink/40">
                  <p className="num">{timeOf(event.created_date)}</p>
                  <p>R{event.round_number || 1}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ backgroundColor: `${team.hex}18`, color: team.hex }}
                    >
                      {team.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-ink/40">{KIND_LABEL[event.kind] || 'Points'}</span>
                    {event.source === 'ai' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-deep/5 px-2 py-0.5 text-[10px] font-medium text-deep">
                        <Sparkles className="h-2.5 w-2.5" /> AI
                      </span>
                    )}
                    {pending && (
                      <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold text-ink">Needs host confirmation</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-snug text-ink/85">{event.reason || 'Points awarded'}</p>
                  {event.transcript && (
                    <p className="mt-1 line-clamp-2 text-xs italic text-ink/50">“{event.transcript}”</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {event.player_name && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-ink/45">
                        <UserRound className="h-3 w-3" /> {event.player_name}
                      </span>
                    )}
                    {typeof event.confidence === 'number' && (
                      <span className="text-[11px] text-ink/40">{Math.round(event.confidence * 100)}% confident</span>
                    )}
                    <EvidenceButton uris={event.evidence_uris} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`num inline-flex items-center gap-0.5 rounded-full px-2.5 py-1 text-sm font-semibold ${
                      points < 0 ? 'bg-coral-light text-coral-dark' : 'bg-deep/5 text-deep'
                    } ${pending ? 'opacity-60' : ''}`}
                  >
                    {points < 0 ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {Math.abs(points)}
                  </span>
                  <div className="flex items-center gap-1">
                    {pending && onConfirm && (
                      <button
                        type="button"
                        onClick={() => onConfirm(event.id)}
                        className="rounded-full bg-deep px-2 py-1 text-[10px] font-semibold text-cream"
                      >
                        <Check className="mr-0.5 inline h-3 w-3" /> Confirm
                      </button>
                    )}
                    {onUndo && (
                      <button
                        type="button"
                        onClick={() => onUndo(event.id)}
                        title="Undo this entry"
                        className="rounded-full border border-[#E6DCC9] p-1.5 text-ink/45 transition-colors hover:border-coral hover:text-coral-dark"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
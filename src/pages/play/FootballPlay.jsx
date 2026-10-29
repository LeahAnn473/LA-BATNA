const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { AlertCircle, Loader2, Pause, Play, RotateCcw, Sparkles, Timer, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CameraSurface from '@/components/CameraSurface';
import AiMomentsPanel from '@/components/AiMomentsPanel';
import { extractFrames, transcribeBlob, uploadEvidence } from '@/lib/media';
import { analyzeFootball } from '@/lib/ai';
import { ruleByKey, teamOf } from '@/lib/gameConfig';
import useCountdown, { formatTime } from '@/lib/useCountdown';

const ROUND_SECONDS = 180;

function parseSummary(session) {
  try {
    return session.ai_summary_json ? JSON.parse(session.ai_summary_json) : null;
  } catch (error) {
    return null;
  }
}

function PossessionCard({ possession, mvp, summary }) {
  if (!possession) return null;
  const a = Math.max(0, Math.min(100, Math.round(Number(possession.A) || 0)));
  const b = Math.max(0, Math.min(100, 100 - a));
  return (
    <div className="rounded-2xl border border-[#EFE5D5] bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">AI match facts</p>
      <div className="mt-2 flex items-center justify-between text-xs font-semibold">
        <span>Team A · {a}%</span>
        <span>Team B · {b}%</span>
      </div>
      <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-ink/10">
        <span className="h-full bg-deep" style={{ width: `${a}%` }} />
        <span className="h-full bg-sand" style={{ width: `${b}%` }} />
      </div>
      {mvp && (
        <p className="mt-2 text-xs text-ink/60">
          <span className="font-semibold text-ink/75">MVP read:</span> {mvp}
        </p>
      )}
      {summary && <p className="mt-1 text-[11px] italic text-ink/45">“{summary}”</p>}
    </div>
  );
}

export default function FootballPlay({ session, addEvent, updateSession }) {
  const timer = useCountdown(ROUND_SECONDS);
  const [clip, setClip] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [facts, setFacts] = useState(() => parseSummary(session));
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const teamA = teamOf(session, 'A');
  const teamB = teamOf(session, 'B');

  function pickClip(blob) {
    setClip(blob);
    setAnalysis(null);
    setError('');
  }

  async function runAnalysis() {
    if (!clip) {
      setError('Record this round or upload the match video, then ask the referee to review it.');
      return;
    }
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const frames = await extractFrames(clip, 10);
      if (frames.length === 0) throw new Error('No frames');
      const { uris, urls } = await uploadEvidence(frames.map((frame) => frame.blob));

      let transcript = '';
      if (clip.size && clip.size < 8 * 1024 * 1024) {
        try {
          transcript = await transcribeBlob(clip);
        } catch (audioError) {
          transcript = '';
        }
      }

      const result = await analyzeFootball({ frameUrls: urls, session, transcript });
      const moments = (result.moments || [])
        .map((moment, index) => {
          const rule = ruleByKey('football', moment.action);
          if (!rule) return null;
          const confidence = Math.min(1, Math.max(0, Number(moment.confidence) || 0));
          const frameIndex = Math.min(Math.max(0, Number(moment.frame_index) || 0), uris.length - 1);
          return {
            id: `moment-${index}`,
            action: moment.action,
            label: rule.label,
            kind: rule.kind,
            points: rule.points,
            team: moment.team === 'B' ? 'B' : 'A',
            player_name: moment.player || '',
            reason: moment.reason || rule.label,
            confidence,
            needsHost: confidence < 0.65,
            evidence_uris: uris[frameIndex] ? [uris[frameIndex]] : [],
          };
        })
        .filter(Boolean);

      const review = await db.entities.AiReview.create({
        session_id: session.id,
        game_key: 'football',
        kind: 'football',
        round_number: session.current_round,
        decision: 'MATCH_REVIEW',
        reason: `${moments.length} moment(s) detected in round ${session.current_round}`,
        confidence: moments.length ? Math.max(...moments.map((moment) => moment.confidence)) : 0,
        status: 'pending',
        evidence_uris: uris.slice(0, 4),
        transcript,
        payload_json: JSON.stringify({ moments, possession: result.possession, mvp: result.mvp_player, summary: result.summary }),
      });

      setAnalysis({
        moments,
        reviewId: review.id,
        possession: result.possession,
        mvp: result.mvp_player,
        summary: result.summary,
      });
    } catch (err) {
      setError('The AI referee could not analyse this match video. Score with the host pad, or try again with a shorter clip.');
    } finally {
      setLoading(false);
    }
  }

  async function applyMoments(selected) {
    setApplying(true);
    try {
      for (const moment of selected) {
        await addEvent({
          team: moment.team,
          kind: moment.kind,
          points: moment.points,
          rule_key: moment.action,
          reason: moment.reason,
          player_name: moment.player_name,
          source: 'ai',
          confidence: moment.confidence,
          evidence_uris: moment.evidence_uris,
        });
      }
      const summaryPayload = {
        possession: analysis?.possession || null,
        mvp: analysis?.mvp || '',
        summary: analysis?.summary || '',
      };
      await updateSession({ ai_summary_json: JSON.stringify(summaryPayload) });
      if (analysis?.reviewId) await db.entities.AiReview.update(analysis.reviewId, { status: 'applied' });
      setFacts(summaryPayload);
      setAnalysis(null);
    } finally {
      setApplying(false);
    }
  }

  async function rejectAnalysis() {
    if (analysis?.reviewId) {
      await db.entities.AiReview.update(analysis.reviewId, { status: 'rejected', evidence_uris: [] });
    }
    setAnalysis(null);
    setClip(null);
  }

  const timerPercent = Math.round((timer.remaining / ROUND_SECONDS) * 100);

  return (
    <div className="space-y-4">
      <div className="card-soft p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-sand-dark" />
            <span className="num font-display text-2xl font-semibold">{formatTime(timer.remaining)}</span>
            <span className="text-[11px] text-ink/40">round clock</span>
          </div>
          <div className="flex gap-2">
            {!timer.running ? (
              <Button size="sm" onClick={timer.start} disabled={timer.remaining === 0} className="rounded-full bg-deep text-cream hover:bg-deep-dark">
                <Play className="mr-1 h-3.5 w-3.5" /> {timer.elapsed > 0 ? 'Resume' : 'Start round'}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={timer.pause} className="rounded-full border-[#E6DCC9]">
                <Pause className="mr-1 h-3.5 w-3.5" /> Pause
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => timer.reset(ROUND_SECONDS)} className="rounded-full text-ink/45">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div className={`h-full transition-all ${timerPercent < 25 ? 'bg-coral' : 'bg-sand-dark'}`} style={{ width: `${Math.max(0, timerPercent)}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[teamA, teamB].map((team) => (
            <div key={team.key} className="rounded-xl bg-white px-2.5 py-2" style={{ boxShadow: `inset 0 0 0 1px ${team.hex}33` }}>
              <p className="truncate text-xs font-semibold">{team.name}</p>
              <p className="text-[10px] uppercase tracking-wide text-ink/40">{team.color || 'bib'} bibs</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink/45">Teams switch sides between rounds. Keep the whole pitch and both goals in frame.</p>
      </div>

      <div className="card-soft p-4 sm:p-5">
        <h3 className="font-display text-base font-semibold">Match video</h3>
        <p className="text-[11px] text-ink/45">
          Record the round with sound, or upload the match video. The referee samples frames and, for clips under 8 MB,
          transcribes the audio cues.
        </p>
        <div className="mt-3">
          <CameraSurface audio recordLabel="Record round" onRecorded={pickClip} note="Frame the whole pitch. Nothing is uploaded until you ask for a review." />
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#D9CDB8] bg-white/60 px-3 py-2.5 text-xs font-medium text-ink/55 hover:border-deep hover:text-deep">
          <Upload className="h-3.5 w-3.5" /> Upload the match video
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) pickClip(file);
            }}
          />
        </label>
        <Button onClick={runAnalysis} disabled={loading || !clip} className="mt-3 w-full rounded-full bg-deep text-cream hover:bg-deep-dark">
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          {loading ? 'Reviewing the match…' : 'Ask the AI referee to review'}
        </Button>
        {!clip && <p className="mt-2 text-[11px] text-ink/40">No video yet — record the round or upload one.</p>}
      </div>

      {facts && <PossessionCard possession={facts.possession} mvp={facts.mvp} summary={facts.summary} />}

      {(analysis || loading || error) && (
        <AiMomentsPanel
          title="AI match review"
          session={session}
          moments={analysis?.moments || null}
          summary={analysis?.summary}
          loading={loading}
          error={error}
          onApply={applyMoments}
          onReject={rejectAnalysis}
          onRetry={clip ? runAnalysis : null}
          extra={analysis ? <PossessionCard possession={analysis.possession} mvp={analysis.mvp} /> : null}
        />
      )}

      {applying && (
        <p className="flex items-center gap-2 text-xs text-ink/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Applying the referee’s calls to the score…
        </p>
      )}

      <p className="flex items-start gap-2 rounded-2xl bg-white/60 px-3 py-2 text-[11px] leading-relaxed text-ink/45">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Accidental contact is never penalised automatically. Fouls, handballs and ball-out calls stay unselected until you
        confirm them.
      </p>
    </div>
  );
}
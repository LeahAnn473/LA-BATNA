const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Pause, Play, RotateCcw, Sparkles, Timer, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Image } from '@/components/ui/image';
import CameraSurface from '@/components/CameraSurface';
import AiMomentsPanel from '@/components/AiMomentsPanel';
import { extractFrames, signUri, uploadEvidence } from '@/lib/media';
import { analyzeTeelah } from '@/lib/ai';
import { GAMES, ruleByKey, teamOf } from '@/lib/gameConfig';
import useCountdown, { formatTime } from '@/lib/useCountdown';

const GAME = GAMES.teelah;

function parseCalibration(session) {
  try {
    return session.calibration_json ? JSON.parse(session.calibration_json) : null;
  } catch (error) {
    return null;
  }
}

export default function TeelahPlay({ session, addEvent, updateSession }) {
  const [calibration, setCalibration] = useState(() => parseCalibration(session));
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [draft, setDraft] = useState(null);
  const [startLine, setStartLine] = useState(() => parseCalibration(session)?.start_line ?? 0.7);
  const [recalibrating, setRecalibrating] = useState(false);
  const [clip, setClip] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const timer = useCountdown(GAME.turnSeconds);

  const teamA = teamOf(session, 'A');
  const teamB = teamOf(session, 'B');
  const showCalibrator = !calibration || recalibrating;

  useEffect(() => {
    let alive = true;
    if (!calibration?.snapshot_uri) return () => { alive = false; };
    signUri(calibration.snapshot_uri, 900)
      .then((url) => {
        if (alive) setSnapshotUrl(url);
      })
      .catch(() => {
        if (alive) setSnapshotUrl('');
      });
    return () => {
      alive = false;
    };
  }, [calibration?.snapshot_uri]);

  async function handleSnapshot(blob) {
    setError('');
    try {
      const { uris, urls } = await uploadEvidence([blob]);
      setDraft({ uri: uris[0], url: urls[0] });
    } catch (err) {
      setError('The play surface snapshot could not be saved. Check your connection and try again.');
    }
  }

  async function lockCalibration() {
    const uri = draft?.uri || calibration?.snapshot_uri;
    if (!uri) {
      setError('Capture the play surface first, so the referee knows where the line and holes are.');
      return;
    }
    const payload = { snapshot_uri: uri, start_line: startLine };
    await updateSession({ calibration_json: JSON.stringify(payload) });
    setCalibration(payload);
    if (draft?.url) setSnapshotUrl(draft.url);
    setDraft(null);
    setRecalibrating(false);
    setError('');
  }

  function pickClip(blob) {
    setClip(blob);
    setAnalysis(null);
    setError('');
  }

  async function runAnalysis() {
    if (!clip) {
      setError('Record this turn or upload a clip, then ask the referee to review it.');
      return;
    }
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const frames = await extractFrames(clip, 8);
      if (frames.length === 0) throw new Error('No frames');
      const { uris, urls } = await uploadEvidence(frames.map((frame) => frame.blob));
      const result = await analyzeTeelah({ frameUrls: urls, session, calibration });
      const moments = (result.observations || [])
        .map((observation, index) => {
          const rule = ruleByKey('teelah', observation.action);
          if (!rule) return null;
          const confidence = Math.min(1, Math.max(0, Number(observation.confidence) || 0));
          const frameIndex = Math.min(Math.max(0, Number(observation.frame_index) || 0), uris.length - 1);
          return {
            id: `moment-${index}`,
            action: observation.action,
            label: rule.label,
            kind: rule.kind,
            points: rule.points,
            team: observation.team === 'B' ? 'B' : 'A',
            player_name: observation.player || '',
            reason: observation.reason || rule.label,
            confidence,
            needsHost: confidence < 0.65,
            evidence_uris: uris[frameIndex] ? [uris[frameIndex]] : [],
          };
        })
        .filter(Boolean);

      const review = await db.entities.AiReview.create({
        session_id: session.id,
        game_key: 'teelah',
        kind: 'teelah',
        round_number: session.current_round,
        decision: 'MOMENTS',
        reason: `${moments.length} moment(s) detected in round ${session.current_round}`,
        confidence: moments.length ? Math.max(...moments.map((moment) => moment.confidence)) : 0,
        status: 'pending',
        evidence_uris: uris.slice(0, 4),
        transcript: result.summary || '',
        payload_json: JSON.stringify(moments),
      });

      setAnalysis({ moments, reviewId: review.id, summary: result.summary || '' });
    } catch (err) {
      setError('The AI referee could not analyse this clip. Replay it and score with the host pad, or try again.');
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
      if (analysis?.reviewId) await db.entities.AiReview.update(analysis.reviewId, { status: 'applied' });
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

  return (
    <div className="space-y-4">
      <div className="card-soft p-4 sm:p-5">
        <h3 className="font-display text-base font-semibold">Marble colours</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[teamA, teamB].map((team) => (
            <div key={team.key} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2" style={{ boxShadow: `inset 0 0 0 1px ${team.hex}33` }}>
              <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: `radial-gradient(circle at 32% 28%, #ffffffcc, ${team.hex})` }} />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{team.name}</p>
                <p className="text-[10px] uppercase tracking-wide text-ink/40">{team.color || 'no colour'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-soft p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-teal-900" />
            <span className="num font-display text-2xl font-semibold">{formatTime(timer.remaining)}</span>
            <span className="text-[11px] text-ink/40">turn timer</span>
          </div>
          <div className="flex gap-2">
            {!timer.running ? (
              <Button size="sm" onClick={timer.start} disabled={timer.remaining === 0} className="rounded-full bg-deep text-cream hover:bg-deep-dark">
                <Play className="mr-1 h-3.5 w-3.5" /> {timer.elapsed > 0 ? 'Resume' : 'Start turn'}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={timer.pause} className="rounded-full border-[#E6DCC9]">
                <Pause className="mr-1 h-3.5 w-3.5" /> Pause
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => timer.reset(GAME.turnSeconds)} className="rounded-full text-ink/45">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className={`h-full transition-all ${timer.remaining < 30 ? 'bg-coral' : 'bg-teal-800'}`}
            style={{ width: `${Math.round((timer.remaining / GAME.turnSeconds) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-ink/45">
          {GAME.turnSeconds / 60} minutes per turn. When time is up the host settles the score, then completes the round.
        </p>
      </div>

      <div className="card-soft p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold">Calibrate the play surface</h3>
            <p className="text-[11px] text-ink/45">
              Line, holes and permitted area. Point the camera at the marbles only — no faces needed.
            </p>
          </div>
          {calibration && !recalibrating && (
            <Button variant="outline" onClick={() => setRecalibrating(true)} className="rounded-full border-[#E6DCC9] text-xs">
              Recalibrate
            </Button>
          )}
        </div>

        {showCalibrator ? (
          <div className="mt-3 space-y-3">
            <CameraSurface
              onFrame={handleSnapshot}
              note="Frame the start line, the holes and the whole permitted area. Nothing leaves this device until you analyse a turn."
            />
            {draft && (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-2xl">
                  <Image src={draft.url} alt="Play surface snapshot" className="h-44 w-full" />
                  <div className="absolute inset-x-0" style={{ top: `${startLine * 100}%` }}>
                    <div className="h-0.5 w-full bg-coral" />
                    <span className="absolute -top-5 left-2 rounded-full bg-coral px-2 py-0.5 text-[10px] font-semibold text-white">
                      Start line
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] text-ink/50">
                    <span>Move the start line to match your throwing line</span>
                    <span className="num">{Math.round(startLine * 100)}%</span>
                  </div>
                  <Slider
                    value={[startLine * 100]}
                    onValueChange={(value) => setStartLine(value[0] / 100)}
                    min={20}
                    max={95}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <Button onClick={lockCalibration} className="w-full rounded-full bg-deep text-cream hover:bg-deep-dark">
                  Lock calibration
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {snapshotUrl ? (
              <div className="relative overflow-hidden rounded-2xl">
                <Image src={snapshotUrl} alt="Calibrated play surface" className="h-40 w-full" />
                <div className="absolute inset-x-0" style={{ top: `${(calibration?.start_line ?? 0.7) * 100}%` }}>
                  <div className="h-0.5 w-full bg-coral/90" />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-white px-3 py-6 text-center text-xs text-ink/45">
                Calibration saved. The snapshot preview is not available right now.
              </div>
            )}
            <p className="text-[11px] text-ink/45">Play surface locked. The referee uses this line and area for every turn.</p>
          </div>
        )}
      </div>

      <div className="card-soft p-4 sm:p-5">
        <h3 className="font-display text-base font-semibold">Record this turn</h3>
        <p className="text-[11px] text-ink/45">Record the throw, then let the referee review it. You can replay the clip before applying anything.</p>
        <div className="mt-3">
          <CameraSurface audio recordLabel="Record turn" onRecorded={pickClip} />
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#D9CDB8] bg-white/60 px-3 py-2.5 text-xs font-medium text-ink/55 hover:border-deep hover:text-deep">
          <Upload className="h-3.5 w-3.5" /> Upload a clip instead
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
        <Button
          onClick={runAnalysis}
          disabled={loading || !clip}
          className="mt-3 w-full rounded-full bg-deep text-cream hover:bg-deep-dark"
        >
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          {loading ? 'Reviewing the turn…' : 'Ask the AI referee to review'}
        </Button>
        {!clip && <p className="mt-2 text-[11px] text-ink/40">No clip yet — record the turn or upload one.</p>}
      </div>

      {(analysis || loading || error) && (
        <AiMomentsPanel
          title="AI referee findings"
          session={session}
          moments={analysis?.moments || null}
          summary={analysis?.summary}
          loading={loading}
          error={error}
          onApply={applyMoments}
          onReject={rejectAnalysis}
          onRetry={clip ? runAnalysis : null}
        />
      )}

      {applying && (
        <p className="flex items-center gap-2 text-xs text-ink/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Applying the referee’s calls to the score…
        </p>
      )}

      <p className="flex items-start gap-2 rounded-2xl bg-white/60 px-3 py-2 text-[11px] leading-relaxed text-ink/45">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        If a marble is hidden in a hole or a collision is unclear, replay the clip and confirm the call yourself. Nothing is
        awarded twice, and unclear moments stay pending until you decide.
      </p>
    </div>
  );
}
const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Camera, Check, Loader2, Play, Pause, RotateCcw, Sparkles, Timer, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import WordCard from '@/components/sayless/WordCard';
import VerdictCard from '@/components/sayless/VerdictCard';
import ClueHistory from '@/components/sayless/ClueHistory';
import RecordButton from '@/components/RecordButton';
import CameraSurface from '@/components/CameraSurface';
import BankEditor from '@/components/BankEditor';

import { judgeClue, checkGesture } from '@/lib/ai';
import { uploadEvidence } from '@/lib/media';
import { teamOf, WORD_CATEGORIES, WORD_LEVELS } from '@/lib/gameConfig';
import useCountdown, { formatTime } from '@/lib/useCountdown';

export default function SayLessPlay({ session, addEvent, onAlert, turn, game }) {
  const [step, setStep] = useState('setup');
  const [category, setCategory] = useState('animals');
  const [level, setLevel] = useState('easy');
  const [bankWords, setBankWords] = useState([]);
  const [used, setUsed] = useState([]);
  const [word, setWord] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [wordError, setWordError] = useState('');
  const [clueText, setClueText] = useState('');
  const [judging, setJudging] = useState(false);
  const [clueError, setClueError] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [pending, setPending] = useState(null);
  const [warned, setWarned] = useState(false);
  const [turnClues, setTurnClues] = useState([]);
  const [endedEarly, setEndedEarly] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [showGesture, setShowGesture] = useState(false);
  const [gesture, setGesture] = useState(null);
  const [gestureBusy, setGestureBusy] = useState(false);
  const [gestureError, setGestureError] = useState('');
  const [scoring, setScoring] = useState(false);

  const timer = useCountdown(game.turnSeconds);
  const opponent = teamOf(session, turn.team === 'A' ? 'B' : 'A');

  const loadReviews = useCallback(async () => {
    const result = await db.entities.AiReview.filter(
      { session_id: session.id, kind: 'clue' },
      { sort: '-created_date', limit: 40 }
    );
    setReviews(Array.isArray(result) ? result : result.items || []);
  }, [session.id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  function pickWord(excluded) {
    const pool = bankWords.filter((entry) => !excluded.includes(entry.id));
    const source = pool.length > 0 ? pool : bankWords;
    return source[Math.floor(Math.random() * source.length)];
  }

  async function loadBank() {
    setWordError('');
    const result = await db.entities.WordBank.filter({ category, level }, { limit: 80 });
    const items = Array.isArray(result) ? result : result.items || [];
    if (items.length === 0) {
      setWordError('This bank is empty. Add a few words, or choose another category or level.');
      return;
    }
    setBankWords(items);
    setStep('handoff');
  }

  function revealWord() {
    setWord(pickWord(used));
    setHidden(false);
    setVerdict(null);
    setPending(null);
    setTurnClues([]);
    setClueText('');
    setGesture(null);
    setStep('turn');
  }

  function nextWord() {
    if (!word) return;
    setUsed((current) => [...current, word.id]);
    const next = pickWord([...used, word.id]);
    setWord(next);
    setClueText('');
    setVerdict(null);
    setPending(null);
    setTurnClues([]);
    setGesture(null);
    setHidden(false);
  }

  async function applyVerdict(result, reviewId, fromHost, text) {
    const clue = typeof text === 'string' ? text : clueText;
    const repeat = warned;

    if (result.verdict === 'ACCEPTABLE') {
      if (reviewId) await db.entities.AiReview.update(reviewId, { status: 'logged' });
      setTurnClues((current) => [...current, { clue, verdict: 'ACCEPTABLE' }]);
      setClueText('');
      await loadReviews();
      return;
    }

    if (result.verdict === 'BORDERLINE' && !repeat) {
      setWarned(true);
      if (reviewId) await db.entities.AiReview.update(reviewId, { status: 'logged' });
      setTurnClues((current) => [...current, { clue, verdict: 'BORDERLINE' }]);
      setClueText('');
      onAlert({
        title: 'Borderline — friendly warning',
        message: result.reason,
        commentary: 'One warning, no points lost. Keep the next clue vaguer.',
        spoken: 'Careful! That clue was borderline. One warning, no points lost.',
      });
      await loadReviews();
      return;
    }

    const points = repeat ? -3 : -2;
    await addEvent({
      team: turn.team,
      kind: 'penalty',
      points,
      rule_key: repeat ? 'repeat_violation' : 'too_direct',
      reason: result.reason,
      player_name: turn.giver,
      source: fromHost ? 'host' : 'ai',
      confidence: result.confidence,
      transcript: clue,
    });
    if (reviewId) await db.entities.AiReview.update(reviewId, { status: 'applied' });
    setTurnClues((current) => [...current, { clue, verdict: result.verdict }]);
    setWarned(true);
    setClueText('');
    if (repeat) setEndedEarly(true);
    onAlert({
      title: repeat ? 'Second time — the turn ends' : 'Clue too direct',
      message: result.reason,
      points,
      teamName: turn.teamName,
      commentary: repeat ? 'No more clues this turn. Pass the device over.' : 'So close to a warning — keep it vague.',
      spoken: `Whoa! Clue too direct. Minus ${Math.abs(points)} points.`,
    });
    await loadReviews();
  }

  async function askJudge() {
    const text = clueText.trim();
    if (!text) {
      setClueError('Record the clue or type what the clue-giver said.');
      return;
    }
    if (!word) {
      setClueError('Load a secret word first.');
      return;
    }
    setJudging(true);
    setClueError('');
    setVerdict(null);
    setPending(null);
    try {
      const result = await judgeClue({
        clue: text,
        secretWord: word.word,
        forbiddenWords: word.forbidden_words || [],
        history: turnClues,
      });
      const review = await db.entities.AiReview.create({
        session_id: session.id,
        game_key: 'sayless',
        kind: 'clue',
        round_number: session.current_round,
        secret_word: word.word,
        transcript: text,
        decision: result.verdict,
        reason: result.reason,
        confidence: result.confidence,
        directness: result.directness,
        status: 'pending',
      });
      const payload = { ...result, reviewId: review.id, transcript: text };
      setVerdict(payload);
      if (result.confidence < 0.65) setPending(payload);
      else await applyVerdict(result, review.id, false, text);
    } catch (err) {
      setClueError('The AI referee could not judge this clue right now. Keep playing and use the host pad below.');
    } finally {
      setJudging(false);
    }
  }

  async function approvePending() {
    if (!pending) return;
    const current = pending;
    setPending(null);
    await applyVerdict(
      {
        verdict: current.verdict,
        reason: current.reason,
        confidence: current.confidence,
        directness: current.directness,
      },
      current.reviewId,
      true,
      current.transcript
    );
  }

  async function rejectPending() {
    if (!pending) return;
    if (pending.reviewId) await db.entities.AiReview.update(pending.reviewId, { status: 'rejected' });
    setPending(null);
    setVerdict(null);
    await loadReviews();
  }

  async function markCorrect() {
    if (!word || scoring) return;
    setScoring(true);
    try {
      await awardCorrect();
    } finally {
      setScoring(false);
    }
  }

  async function awardCorrect() {
    const fast = timer.running && timer.elapsed <= 15;
    await addEvent({
      team: turn.team,
      kind: 'scored',
      points: 3,
      rule_key: 'correct',
      reason: `Guessed “${word.word}”`,
      player_name: turn.guesser,
      transcript: clueText,
    });
    if (fast) {
      await addEvent({
        team: turn.team,
        kind: 'bonus',
        points: 1,
        rule_key: 'fast',
        reason: 'Guessed in the first 15 seconds',
        player_name: turn.guesser,
      });
    }
    onAlert({
      title: 'Correct!',
      message: `${turn.guesser} got “${word.word}”${fast ? ' in the first 15 seconds' : ''}.`,
      commentary: fast ? 'Lightning fast — that is a bonus point.' : 'Lovely teamwork.',
      spoken: `Correct! Three points${fast ? ' plus one for speed' : ''}.`,
    });
    nextWord();
  }

  async function markPass() {
    if (!word || scoring) return;
    setScoring(true);
    try {
      await addEvent({
        team: turn.team,
        kind: 'penalty',
        points: -1,
        rule_key: 'pass',
        reason: `Passed “${word.word}”`,
        player_name: turn.giver,
      });
      nextWord();
    } finally {
      setScoring(false);
    }
  }

  async function handleGestureFrame(blob) {
    setGestureBusy(true);
    setGestureError('');
    try {
      const { uris, urls } = await uploadEvidence([blob]);
      const result = await checkGesture({ frameUrl: urls[0], secretWord: word?.word || '' });
      const review = await db.entities.AiReview.create({
        session_id: session.id,
        game_key: 'sayless',
        kind: 'gesture',
        round_number: session.current_round,
        secret_word: word?.word || '',
        decision: result.possibleGesture ? 'POSSIBLE_GESTURE' : 'NO_GESTURE',
        reason: result.reason,
        confidence: result.confidence,
        status: 'pending',
        evidence_uris: uris,
      });
      setGesture({ ...result, reviewId: review.id });
    } catch (err) {
      setGestureError('The gesture snapshot could not be checked. If you saw something, use the host pad.');
    } finally {
      setGestureBusy(false);
    }
  }

  async function applyGesture() {
    if (!gesture) return;
    await addEvent({
      team: turn.team,
      kind: 'penalty',
      points: -2,
      rule_key: 'gesture',
      reason: gesture.reason,
      player_name: turn.giver,
      source: 'ai',
      confidence: gesture.confidence,
    });
    if (gesture.reviewId) await db.entities.AiReview.update(gesture.reviewId, { status: 'applied' });
    onAlert({
      title: 'Gesture call',
      message: gesture.reason,
      points: -2,
      teamName: turn.teamName,
      spoken: 'Careful! Gestures cannot give the answer away. Minus two points.',
    });
    setGesture(null);
    setShowGesture(false);
  }

  async function dismissGesture() {
    if (gesture?.reviewId) await db.entities.AiReview.update(gesture.reviewId, { status: 'rejected' });
    setGesture(null);
  }

  if (step === 'setup') {
    return (
      <div className="space-y-4">
        <div className="card-soft p-5">
          <h3 className="font-display text-base font-semibold">Choose the word bank</h3>
          <p className="text-[11px] text-ink/45">One bank per turn. The host can edit these words any time.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-[#E6DCC9] bg-white px-3 py-2.5 text-sm"
            >
              {WORD_CATEGORIES.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </select>
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="rounded-xl border border-[#E6DCC9] bg-white px-3 py-2.5 text-sm"
            >
              {WORD_LEVELS.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          {wordError && <p className="mt-2 text-xs text-coral-dark">{wordError}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={loadBank} className="flex-1 rounded-full bg-deep text-cream hover:bg-deep-dark">
              Load word bank
            </Button>
            <Button variant="outline" onClick={() => setBankOpen(true)} className="rounded-full border-[#E6DCC9]">
              Edit words
            </Button>
          </div>
        </div>
        <BankEditor open={bankOpen} onOpenChange={setBankOpen} defaultCategory={category} defaultLevel={level} />
      </div>
    );
  }

  if (step === 'handoff') {
    return (
      <div className="space-y-4">
        <div className="card-soft p-6 text-center">
          <Users className="mx-auto h-7 w-7 text-deep" />
          <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-ink/40">Pass the device</p>
          <h3 className="mt-1 font-display text-2xl font-semibold">{turn.giver} gives the clues</h3>
          <p className="mt-1 text-sm text-ink/55">
            {turn.guesser} guesses. {opponent.name} watches but stays quiet.
          </p>
          <p className="mx-auto mt-3 max-w-xs text-[11px] leading-relaxed text-ink/45">
            Only the clue-giver should see the next screen. {game.turnSeconds} seconds, one secret word at a time.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={revealWord} className="rounded-full bg-deep py-3 text-cream hover:bg-deep-dark">
              I’m {turn.giver} — show my word
            </Button>
            <Button variant="ghost" onClick={() => setStep('setup')} className="rounded-full text-ink/50">
              Change bank ({bankWords.length} words loaded)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const clockDone = timer.finished || endedEarly;
  const timerPercent = Math.round((timer.remaining / game.turnSeconds) * 100);

  return (
    <div className="space-y-4">
      <WordCard word={word} hidden={hidden} onToggle={() => setHidden((value) => !value)} />

      <div className="card-soft p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-deep" />
            <span className="num font-display text-2xl font-semibold">{formatTime(timer.remaining)}</span>
          </div>
          <div className="flex gap-2">
            {!timer.running ? (
              <Button size="sm" onClick={timer.start} disabled={clockDone} className="rounded-full bg-deep text-cream hover:bg-deep-dark">
                <Play className="mr-1 h-3.5 w-3.5" /> {timer.elapsed > 0 ? 'Resume' : 'Start clock'}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={timer.pause} className="rounded-full border-[#E6DCC9]">
                <Pause className="mr-1 h-3.5 w-3.5" /> Pause
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                timer.reset(game.turnSeconds);
                setEndedEarly(false);
              }}
              className="rounded-full text-ink/45"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className={`h-full transition-all ${timerPercent < 25 ? 'bg-coral' : 'bg-deep'}`}
            style={{ width: `${Math.max(0, timerPercent)}%` }}
          />
        </div>
        {clockDone && (
          <p className="mt-2 rounded-xl bg-sand-light/70 px-3 py-2 text-[11px] font-medium text-sand-dark">
            {endedEarly ? 'The turn ended after a repeated violation.' : 'Time is up.'} Press “Complete round” below when the
            score is settled.
          </p>
        )}
      </div>

      <div className="card-soft p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold">Next clue</h3>
            <p className="text-[11px] text-ink/45">
              Record just the clue — guesses and chatter stay out of the clip. Or type what was said.
            </p>
          </div>
          <RecordButton onText={(text) => setClueText((current) => (current ? `${current} ${text}` : text))} disabled={clockDone} />
        </div>
        <Textarea
          value={clueText}
          onChange={(event) => setClueText(event.target.value)}
          placeholder="“You might see one on a long journey…”"
          className="mt-2 min-h-[64px] rounded-xl border-[#E6DCC9] bg-white text-sm"
        />
        {clueError && <p className="mt-1 text-[11px] text-coral-dark">{clueError}</p>}
        <Button
          onClick={askJudge}
          disabled={judging || clockDone}
          className="mt-2 w-full rounded-full bg-deep text-cream hover:bg-deep-dark"
        >
          {judging ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          {judging ? 'Judging the clue…' : 'Judge this clue'}
        </Button>
      </div>

      <VerdictCard
        verdict={verdict}
        pending={pending}
        onApprove={approvePending}
        onReject={rejectPending}
        onDismiss={() => {
          setVerdict(null);
          setPending(null);
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={markCorrect}
          disabled={clockDone || !word}
          className="h-14 rounded-2xl bg-deep text-base text-cream hover:bg-deep-dark"
        >
          <Check className="mr-1.5 h-5 w-5" /> Correct guess
        </Button>
        <Button
          onClick={markPass}
          disabled={clockDone || !word}
          variant="outline"
          className="h-14 rounded-2xl border-coral/40 text-base text-coral-dark hover:bg-coral-light"
        >
          <X className="mr-1.5 h-5 w-5" /> Pass (-1)
        </Button>
      </div>

      <div className="card-soft p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Gesture check</h3>
            <p className="text-[11px] text-ink/45">Optional: a snapshot is sent to the referee, then you confirm.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowGesture((value) => !value)} className="rounded-full border-[#E6DCC9]">
            <Camera className="mr-1 h-3.5 w-3.5" /> {showGesture ? 'Hide' : 'Check'}
          </Button>
        </div>

        {showGesture && (
          <div className="mt-3 space-y-2">
            <CameraSurface
              onFrame={handleGestureFrame}
              note="A single snapshot of the clue-giver. No video is kept, and nothing is deducted without your say."
            />
            {gestureBusy && (
              <p className="flex items-center gap-2 text-[11px] text-ink/50">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking the snapshot…
              </p>
            )}
            {gestureError && <p className="text-[11px] text-coral-dark">{gestureError}</p>}
            {gesture && (
              <div className="rounded-2xl border border-sand bg-sand-light/50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sand-dark">Needs host confirmation</p>
                <p className="mt-1 text-sm text-ink/75">
                  {gesture.possibleGesture ? 'Possible gesture that reveals the answer.' : 'No revealing gesture seen.'} {gesture.reason}
                </p>
                <p className="text-[11px] text-ink/45">Confidence {Math.round((gesture.confidence || 0) * 100)}%</p>
                <div className="mt-2 flex gap-2">
                  <Button onClick={applyGesture} disabled={!gesture.possibleGesture} className="flex-1 rounded-full bg-deep text-cream hover:bg-deep-dark">
                    Deduct 2 points
                  </Button>
                  <Button variant="outline" onClick={dismissGesture} className="flex-1 rounded-full border-[#E6DCC9] bg-white">
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {turnClues.length > 0 && (
        <div className="rounded-2xl border border-[#EFE5D5] bg-white/70 p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">This turn’s clues</p>
          <ul className="mt-1.5 space-y-1">
            {turnClues.map((entry, index) => (
              <li key={`${entry.clue}-${index}`} className="text-xs text-ink/65">
                <span className="font-semibold text-ink/45">{entry.verdict.replace('_', ' ')}:</span> “{entry.clue}”
              </li>
            ))}
          </ul>
        </div>
      )}

      <ClueHistory reviews={reviews} />

      <p className="flex items-start gap-2 rounded-2xl bg-white/60 px-3 py-2 text-[11px] leading-relaxed text-ink/45">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        When the referee is unsure it asks you instead of deducting. The host always has the final say — every call is in the
        event log, and you can undo any of them.
      </p>

      <BankEditor open={bankOpen} onOpenChange={setBankOpen} defaultCategory={category} defaultLevel={level} />
    </div>
  );
}
import React, { useEffect, useRef, useState } from 'react';
import { Camera, CircleStop, Loader2, ShieldCheck, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startRecording } from '@/lib/media';
import { formatTime } from '@/lib/useCountdown';

export default function CameraSurface({ audio = false, recordLabel = 'Record', onRecorded, onFrame, note }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clipUrl, setClipUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const stoppedRef = useRef(null);
  const timerRef = useRef(null);
  const clipRef = useRef('');

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (clipRef.current) URL.revokeObjectURL(clipRef.current);
    },
    []
  );

  async function enable() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('denied');
      setError('This browser does not allow camera access. You can still play and score manually.');
      return;
    }
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setStatus('live');
    } catch (err) {
      setStatus('denied');
      setError(
        audio
          ? 'Camera or microphone permission was denied. Allow access in your browser, or keep playing and score manually.'
          : 'Camera permission was denied. Allow access in your browser, or keep playing and score manually.'
      );
    }
  }

  function stopCamera() {
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
  }

  function startRec() {
    if (!streamRef.current) return;
    const { recorder, stopped } = startRecording(streamRef.current);
    recorderRef.current = recorder;
    stoppedRef.current = stopped;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
  }

  async function stopRec() {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const blob = await stoppedRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    if (clipRef.current) URL.revokeObjectURL(clipRef.current);
    clipRef.current = url;
    setClipUrl(url);
    if (onRecorded) onRecorded(blob, url);
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError('Wait for the preview to appear, then capture again.');
      return;
    }
    setBusy(true);
    setError('');
    const canvas = document.createElement('canvas');
    const ratio = Math.min(1, 1000 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * ratio);
    canvas.height = Math.round(video.videoHeight * ratio);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    setBusy(false);
    if (blob && onFrame) onFrame(blob);
  }

  return (
    <div className="space-y-3">
      {status === 'idle' && (
        <div className="rounded-2xl border border-dashed border-[#D9CDB8] bg-white/70 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-deep/5 text-deep">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink/85">Camera consent</p>
              <p className="text-xs leading-relaxed text-ink/55">
                {note || 'Frame the play surface only — no faces needed. The recording stays on this device until you ask the AI referee to review it.'}
              </p>
            </div>
          </div>
          <Button onClick={enable} className="mt-3 w-full rounded-full bg-deep text-cream hover:bg-deep-dark">
            <Camera className="mr-1.5 h-4 w-4" /> {audio ? 'Allow camera & microphone' : 'Allow camera'}
          </Button>
        </div>
      )}

      {status === 'requesting' && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#E6DCC9] bg-white/70 p-4 text-sm text-ink/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Waiting for your permission…
        </div>
      )}

      {status === 'denied' && (
        <div className="rounded-2xl border border-coral/40 bg-coral-light/50 p-4">
          <p className="text-sm text-coral-dark">{error}</p>
          <Button onClick={enable} variant="outline" className="mt-3 rounded-full border-coral/40 bg-white text-coral-dark">
            <Camera className="mr-1.5 h-4 w-4" /> Try again
          </Button>
        </div>
      )}

      <div className={status === 'live' ? 'space-y-2' : 'hidden'}>
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
          {recording && (
            <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-coral px-2.5 py-1 text-[11px] font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC {formatTime(seconds)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {onFrame && (
            <Button onClick={capture} disabled={busy} variant="outline" className="rounded-full border-[#E6DCC9]">
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Camera className="mr-1 h-4 w-4" />} Capture
            </Button>
          )}
          {onRecorded && !recording && (
            <Button onClick={startRec} className="rounded-full bg-deep text-cream hover:bg-deep-dark">
              <Video className="mr-1 h-4 w-4" /> {recordLabel}
            </Button>
          )}
          {onRecorded && recording && (
            <Button onClick={stopRec} className="rounded-full bg-coral text-white hover:bg-coral-dark">
              <CircleStop className="mr-1 h-4 w-4" /> Stop & keep
            </Button>
          )}
          <Button variant="ghost" onClick={stopCamera} className="rounded-full text-ink/50">
            Turn off
          </Button>
        </div>
      </div>

      {clipUrl && <video src={clipUrl} controls className="w-full rounded-2xl bg-black" />}
      {error && status !== 'denied' && <p className="text-xs text-coral-dark">{error}</p>}
    </div>
  );
}
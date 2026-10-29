import React, { useRef, useState } from 'react';
import { Loader2, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startRecording, transcribeBlob } from '@/lib/media';

export default function RecordButton({ onText, label = 'Record clue', disabled }) {
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const stoppedRef = useRef(null);

  async function begin() {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Speech capture is not supported in this browser. Type the clue instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const { recorder, stopped } = startRecording(stream);
      recorderRef.current = recorder;
      stoppedRef.current = stopped;
      setState('recording');
    } catch (err) {
      setError('Microphone permission was denied. Type the clue instead.');
    }
  }

  async function finish() {
    if (!recorderRef.current) return;
    recorderRef.current.stop();
    setState('working');
    const blob = await stoppedRef.current;
    if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    try {
      const text = await transcribeBlob(blob);
      if (text) onText(text);
      else setError('No speech was recognised. Type the clue instead.');
    } catch (err) {
      setError('The recording could not be transcribed. Type the clue instead.');
    }
    setState('idle');
  }

  return (
    <div>
      {state === 'idle' && (
        <Button type="button" variant="outline" onClick={begin} disabled={disabled} className="rounded-full border-[#E6DCC9]">
          <Mic className="mr-1.5 h-4 w-4" /> {label}
        </Button>
      )}
      {state === 'recording' && (
        <Button type="button" onClick={finish} className="rounded-full bg-coral text-white hover:bg-coral-dark">
          <Square className="mr-1.5 h-4 w-4" /> Stop & transcribe
        </Button>
      )}
      {state === 'working' && (
        <Button type="button" disabled className="rounded-full bg-deep/70 text-cream">
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Transcribing…
        </Button>
      )}
      {error && <p className="mt-1 text-[11px] text-coral-dark">{error}</p>}
    </div>
  );
}
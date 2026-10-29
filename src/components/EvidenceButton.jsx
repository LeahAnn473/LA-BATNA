import React, { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { signUri } from '@/lib/media';

export default function EvidenceButton({ uris, label = 'Evidence' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!uris || uris.length === 0) return null;

  async function open() {
    setBusy(true);
    setError('');
    try {
      const url = await signUri(uris[0], 900);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError('Could not open the evidence.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-1 rounded-full border border-[#E6DCC9] bg-white px-2.5 py-1 text-[11px] font-medium text-ink/60 transition-colors hover:border-deep hover:text-deep"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
        {label}
      </button>
      {error && <span className="text-[11px] text-coral-dark">{error}</span>}
    </span>
  );
}
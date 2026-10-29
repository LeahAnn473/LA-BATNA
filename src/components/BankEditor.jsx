const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { WORD_CATEGORIES, WORD_LEVELS } from '@/lib/gameConfig';
import { suggestForbidden } from '@/lib/ai';

function splitWords(value) {
  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export default function BankEditor({ open, onOpenChange, defaultCategory = 'animals', defaultLevel = 'easy' }) {
  const [words, setWords] = useState([]);
  const [category, setCategory] = useState(defaultCategory);
  const [level, setLevel] = useState(defaultLevel);
  const [word, setWord] = useState('');
  const [forbidden, setForbidden] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await db.entities.WordBank.filter({ category, level }, { limit: 60 });
        const items = Array.isArray(result) ? result : result.items || [];
        if (alive) setWords(items);
      } catch (err) {
        if (alive) setError('The word bank could not be loaded. Check your connection and try again.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, category, level]);

  async function reload() {
    const result = await db.entities.WordBank.filter({ category, level }, { limit: 60 });
    setWords(Array.isArray(result) ? result : result.items || []);
  }

  async function addWord() {
    if (!word.trim()) {
      setError('Type the secret word first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await db.entities.WordBank.create({
        word: word.trim().toLowerCase(),
        category,
        level,
        forbidden_words: splitWords(forbidden),
      });
      setWord('');
      setForbidden('');
      await reload();
    } catch (err) {
      setError('The word could not be saved. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function suggest() {
    if (!word.trim()) {
      setError('Type the secret word, then ask the AI for forbidden words.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const list = await suggestForbidden({ word: word.trim(), category });
      setForbidden(list.join(', '));
    } catch (err) {
      setError('The AI could not suggest forbidden words right now. You can type them yourself.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    await db.entities.WordBank.delete(id);
    await reload();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] max-w-lg overflow-y-auto rounded-[1.75rem] border-[#E6DCC9] bg-cream">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Word bank</DialogTitle>
          <DialogDescription className="text-sm text-ink/55">
            Every secret word comes with forbidden words the clue-giver cannot say.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="flex-1 rounded-xl border border-[#E6DCC9] bg-white px-3 py-2 text-sm"
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
            className="rounded-xl border border-[#E6DCC9] bg-white px-3 py-2 text-sm"
          >
            {WORD_LEVELS.map((entry) => (
              <option key={entry.key} value={entry.key}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 rounded-2xl border border-[#E6DCC9] bg-white p-3">
          <input
            value={word}
            onChange={(event) => setWord(event.target.value)}
            placeholder="New secret word"
            className="w-full rounded-xl border border-[#E6DCC9] px-3 py-2 text-sm"
          />
          <input
            value={forbidden}
            onChange={(event) => setForbidden(event.target.value)}
            placeholder="Forbidden words, comma separated"
            className="w-full rounded-xl border border-[#E6DCC9] px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={addWord} disabled={busy} className="flex-1 rounded-full bg-deep text-cream hover:bg-deep-dark">
              {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />} Add word
            </Button>
            <Button onClick={suggest} disabled={busy} variant="outline" className="rounded-full border-[#E6DCC9]">
              <Sparkles className="mr-1 h-4 w-4" /> Suggest
            </Button>
          </div>
          {error && <p className="text-[11px] text-coral-dark">{error}</p>}
        </div>

        {loading ? (
          <p className="py-4 text-center text-sm text-ink/45">Loading the word bank…</p>
        ) : words.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink/45">No words in this bank yet. Add the first one above.</p>
        ) : (
          <ul className="divide-y divide-[#F1E8D8] rounded-2xl border border-[#E6DCC9] bg-white">
            {words.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink/85">{entry.word}</p>
                  <p className="text-[11px] text-ink/45">
                    Forbidden: {(entry.forbidden_words || []).join(', ') || 'none set'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(entry.id)}
                  className="rounded-full p-1.5 text-ink/35 hover:bg-coral-light hover:text-coral-dark"
                  aria-label={`Delete ${entry.word}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
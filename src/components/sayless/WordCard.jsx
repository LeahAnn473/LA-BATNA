import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function WordCard({ word, hidden, onToggle }) {
  if (!word) return null;

  return (
    <div className="rounded-[1.5rem] bg-deep p-5 text-cream">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-cream/50">Secret word · clue-giver only</p>
          <p className="mt-1 font-display text-3xl font-semibold">
            {hidden ? '••••••' : word.word}
          </p>
          <p className="text-[11px] text-cream/50">
            {word.category?.replace('_', ' ')} · {word.level}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full bg-white/10 p-2 text-cream/80 transition-colors hover:bg-white/20"
          aria-label={hidden ? 'Show the word' : 'Hide the word'}
        >
          {hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>

      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-cream/45">Never say</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {(word.forbidden_words || []).length === 0 && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-cream/60">No forbidden words set</span>
          )}
          {(word.forbidden_words || []).map((entry) => (
            <span key={entry} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-cream/85">
              {entry}
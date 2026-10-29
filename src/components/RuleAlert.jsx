import React, { useEffect } from 'react';
import { AlertTriangle, Undo2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { announce } from '@/lib/speech';

export default function RuleAlert({ alert, onClose, onUndo }) {
  useEffect(() => {
    if (!alert) return;
    announce(alert.spoken || `${alert.title}. ${alert.message || ''}`);
  }, [alert]);

  if (!alert) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-[1.75rem] border-sand/60 bg-cream p-6">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-coral-light text-coral-dark">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center font-display text-2xl">{alert.title}</DialogTitle>
          <DialogDescription className="text-center text-base leading-relaxed text-ink/70">{alert.message}</DialogDescription>
        </DialogHeader>

        {typeof alert.points === 'number' && (
          <p className="mx-auto rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-coral-dark">
            {alert.points > 0 ? `+${alert.points}` : alert.points} points{alert.teamName ? ` · ${alert.teamName}` : ''}
          </p>
        )}
        {alert.commentary && <p className="text-center text-sm italic text-ink/55">“{alert.commentary}”</p>}

        <div className="mt-1 flex gap-2">
          {onUndo && (
            <Button variant="outline" onClick={onUndo} className="flex-1 rounded-full border-[#E6DCC9]">
              <Undo2 className="mr-1 h-4 w-4" /> Undo
            </Button>
          )}
          <Button onClick={onClose} className="flex-1 rounded-full bg-deep text-cream hover:bg-deep-dark">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import {Card} from '@/components/Card';
import type {Command} from '@/data/commands';
import {CopyIcon} from '@/components/Icons';
import {useToast} from '@/components/Toast';

export function CommandList({items}: {items: Command[]}) {
  const toast = useToast();

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.push('Copied', 'success');
    } catch {
      toast.push('Copy failed', 'error');
    }
  }

  return (
    <div className="space-y-3 overflow-y-auto">
      {items.map((cmd) => (
        <Card key={cmd.name} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{cmd.name}</div>
              <div className="mt-1 text-xs text-white/60">{cmd.description}</div>
            </div>

            <button
              onClick={() => copy(cmd.name)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
              aria-label="Copy command"
              title="Copy"
            >
              <CopyIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Copy</span>
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

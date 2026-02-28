'use client';

import * as React from 'react';
import {Spinner} from '@/components/Spinner';

type Guild = {id: string; name: string; icon?: string | null; isAdmin: boolean};

export function ServerPicker({locale}: {locale: string}) {
  const [loading, setLoading] = React.useState(true);
  const [guilds, setGuilds] = React.useState<Guild[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me/guilds');
        if (res.status === 401) {
          window.location.href = `/api/auth/discord/login?next=/${locale}/dashboard/select-server`;
          return;
        }
        const data = await res.json();
        setGuilds(data.guilds || []);
      } catch (e: any) {
        setError(e?.message || 'Failed');
      } finally {
        setLoading(false);
      }
    })();
  }, [locale]);

  async function selectGuild(id: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/guild/select', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({guildId: id})
      });
      if (!res.ok) throw new Error('Select failed');
      window.location.href = `/${locale}/dashboard/subscriptions`;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="text-sm font-semibold">Select a server</div>
      <div className="mt-2 text-xs text-white/60">Choose a server you manage.</div>

      {loading && (
        <div className="mt-6 flex items-center gap-3 text-sm text-white/70">
          <Spinner />
          Loading...
        </div>
      )}

      {!loading && error && (
        <div className="mt-6 text-sm text-red-300">{error}</div>
      )}

      {!loading && !error && guilds.length === 0 && (
        <div className="mt-6 text-sm text-white/70">You don’t have any servers</div>
      )}

      {!loading && !error && guilds.length > 0 && (
        <div className="mt-6 space-y-2">
          {guilds.map((g) => (
            <button
              key={g.id}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left hover:bg-white/10"
              onClick={() => selectGuild(g.id)}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/10" />
                <div>
                  <div className="text-sm font-semibold">{g.name}</div>
                  <div className="text-xs text-white/50">{g.isAdmin ? 'Admin' : 'Limited'}</div>
                </div>
              </div>
              <div className="text-white/60">→</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

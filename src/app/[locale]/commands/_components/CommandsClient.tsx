'use client';

import * as React from 'react';
import {CategorySidebar} from './CategorySidebar';
import {CommandSearch} from './CommandSearch';
import {CommandList} from './CommandList';
import type {Command} from '@/data/commands';

export function CommandsClient({
  locale,
  categories,
  commands
}: {
  locale: string;
  categories: string[];
  commands: Command[];
}) {
  const [category, setCategory] = React.useState(categories[0] || 'All');
  const [q, setQ] = React.useState('');

  const filtered = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    return commands.filter((c) => {
      const matchCategory = category === 'All' || c.category === category;
      const matchQuery =
        qq.length === 0 ||
        c.name.toLowerCase().includes(qq) ||
        c.description.toLowerCase().includes(qq);
      return matchCategory && matchQuery;
    });
  }, [commands, category, q]);

  return (
    <div className="grid grid-cols-1 items-start gap-5 overflow-visible md:gap-6">
      <CategorySidebar locale={locale} categories={categories} value={category} onChange={setCategory} />

      <section className="space-y-4">
        <CommandSearch value={q} onChange={setQ} />
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            No commands found
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <CommandList items={filtered} />
          </div>
        )}
      </section>
    </div>
  );
}

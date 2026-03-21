'use client';

import * as React from 'react';
import type {Command} from '@/data/commands';
import {CategorySidebar} from './CategorySidebar';
import {CommandList} from './CommandList';

export function CommandsClient({
  locale,
  categories,
  commands
}: {
  locale: string;
  categories: string[];
  commands: Command[];
}) {
  const isAr = locale === 'ar';
  const allValue = categories[0] ?? 'All';
  const [category, setCategory] = React.useState(allValue);
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return commands.filter((command) => {
      const byCategory = category === allValue || command.category === category;
      const byQuery =
        normalized.length === 0 ||
        command.name.toLowerCase().includes(normalized) ||
        command.description.toLowerCase().includes(normalized);

      return byCategory && byQuery;
    });
  }, [allValue, category, commands, query]);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10">
      <CategorySidebar
        locale={locale}
        categories={categories}
        selectedCategory={category}
        onSelectCategory={setCategory}
        query={query}
        onChangeQuery={setQuery}
      />

      <section className="min-w-0">
        {filtered.length === 0 ? (
          <div className="rounded-[16px] border border-white/[0.08] bg-[#14161d] px-5 py-4 text-sm text-white/70">
            {isAr ? 'لم يتم العثور على أوامر.' : 'No commands found.'}
          </div>
        ) : (
          <CommandList items={filtered} locale={locale} />
        )}
      </section>
    </div>
  );
}

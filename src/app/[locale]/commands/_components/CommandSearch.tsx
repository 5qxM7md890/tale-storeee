'use client';

export function CommandSearch({value, onChange}: {value: string; onChange: (v: string) => void}) {
  return (
    <input
      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/40"
      placeholder="Search for command"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

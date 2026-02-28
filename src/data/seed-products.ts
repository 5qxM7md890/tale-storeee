export type SeedPricing = {
  id: string;
  periodMonths: 1 | 3 | 6 | 12;
  unitMonthlyCents: number;
};

export type SeedProduct = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  pricing: SeedPricing[];
};

// Prices from FateStore (USD cents per month).
const BASE = [
  {slug: 'system-bot', name: 'System Bot', description: 'Bot that helps organize the server with full system.', monthly: 484},
  {slug: 'music-bot', name: 'Music Bot', description: 'Music bot for voice channels.', monthly: 29},
  {slug: 'voice-groups', name: 'Voice Groups', description: 'Voice groups system for your server.', monthly: 54},
  {slug: 'broadcast-bot', name: 'Broadcast Bot', description: 'Broadcast messages to your members.', monthly: 453},
  {slug: 'games-bot', name: 'Games Bot', description: 'Games & fun commands for your community.', monthly: 400},
  {slug: 'bank-bot', name: 'Bank Bot', description: 'Bank / economy system for your server.', monthly: 400},
  {slug: 'coins-bot', name: 'Coins Bot', description: 'Coins system and rewards.', monthly: 400},
  {slug: 'tickets-bot', name: 'Tickets Bot', description: 'Tickets support system.', monthly: 400},
  {slug: 'streak-bot', name: 'Streak Bot', description: 'Daily streaks and engagement.', monthly: 267}
] as const;

const PERIODS: Array<1 | 3 | 6 | 12> = [1, 3, 6, 12];

export const seedProducts: SeedProduct[] = BASE.map((p) => ({
  id: `seed_${p.slug}`,
  slug: p.slug,
  name: p.name,
  description: p.description,
  pricing: PERIODS.map((m) => ({
    id: `seed_${p.slug}_${m}`,
    periodMonths: m,
    unitMonthlyCents: p.monthly
  }))
}));

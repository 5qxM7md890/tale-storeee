import {PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

// FateStore seed products (monthly price in USD cents)
const seedProducts = [
  {slug: 'system-bot', name: 'System Bot', description: 'Bot that helps organize the server with full system.', monthly: 484},
  {slug: 'music-bot', name: 'Music Bot', description: 'Music bot for voice channels.', monthly: 29},
  {slug: 'voice-groups', name: 'Voice Groups', description: 'Voice groups system for your server.', monthly: 54},
  {slug: 'broadcast-bot', name: 'Broadcast Bot', description: 'Broadcast messages to your members.', monthly: 453},
  {slug: 'games-bot', name: 'Games Bot', description: 'Games & fun commands for your community.', monthly: 400},
  {slug: 'bank-bot', name: 'Bank Bot', description: 'Bank / economy system for your server.', monthly: 400},
  {slug: 'coins-bot', name: 'Coins Bot', description: 'Coins system and rewards.', monthly: 400},
  {slug: 'tickets-bot', name: 'Tickets Bot', description: 'Tickets support system.', monthly: 400},
  {slug: 'streak-bot', name: 'Streak Bot', description: 'Daily streaks and engagement.', monthly: 267}
];

const periods = [1, 3, 6, 12];

async function main() {
  for (const p of seedProducts) {
    const product = await prisma.product.upsert({
      where: {slug: p.slug},
      update: {name: p.name, description: p.description},
      create: {slug: p.slug, name: p.name, description: p.description}
    });

    for (const months of periods) {
      await prisma.pricingOption.upsert({
        where: {productId_periodMonths: {productId: product.id, periodMonths: months}},
        update: {unitMonthlyCents: p.monthly},
        create: {productId: product.id, periodMonths: months, unitMonthlyCents: p.monthly}
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

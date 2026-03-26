import {spawn} from 'node:child_process';
import {PrismaClient} from '@prisma/client';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {stdio: 'inherit', ...opts});
    p.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
  });
}

const prisma = new PrismaClient();

try {
  const count = await prisma.product.count();
  await prisma.$disconnect();

  if (count > 0) {
    console.log(`[seed] products already exist (${count}). skipping.`);
    process.exit(0);
  }

  console.log('[seed] products table empty. running prisma db seed...');
  await run('npx', ['prisma', 'db', 'seed']);
  console.log('[seed] done.');
} catch (e) {
  try {
    await prisma.$disconnect();
  } catch {}
  console.error(e);
  process.exit(1);
}

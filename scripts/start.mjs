import {spawn} from 'node:child_process';

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {stdio: 'inherit', ...opts});
    p.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`));
    });
  });
}

try {
  // 1) Ensure Prisma Client exists
  await run('npx', ['prisma', 'generate']);

  // 2) Apply production DB migrations
  if (process.env.DATABASE_URL) {
    await run('npx', ['prisma', 'migrate', 'deploy']);

    // 3) Seed products if empty (idempotent)
    await run('node', ['scripts/seed-if-empty.mjs']);
  } else {
    console.log('[start] DATABASE_URL not set, skipping migrate/seed.');
  }

  // 4) Start Next
  await run('npx', ['next', 'start', '-p', process.env.PORT || '3000']);
} catch (e) {
  console.error(e);
  process.exit(1);
}

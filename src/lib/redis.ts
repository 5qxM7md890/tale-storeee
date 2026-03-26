import Redis from 'ioredis';

const url = process.env.REDIS_URL;

export const redis = url
  ? new Redis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true
    })
  : null;

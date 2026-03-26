import crypto from 'crypto';

export function sha256Hex(data: string | Buffer) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function hmacSha256Hex(secret: string, data: string) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function timingSafeEqualHex(a: string, b: string) {
  const abuf = Buffer.from(a, 'hex');
  const bbuf = Buffer.from(b, 'hex');
  if (abuf.length !== bbuf.length) return false;
  return crypto.timingSafeEqual(abuf, bbuf);
}

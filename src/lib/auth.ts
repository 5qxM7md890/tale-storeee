import {cookies} from 'next/headers';
import {SignJWT, jwtVerify} from 'jose';
import crypto from 'crypto';
import {prisma} from './db';

export const SESSION_COOKIE_NAME = 'fs_session';

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set');
  return new TextEncoder().encode(secret);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  };
}

export async function signSessionToken(sessionId: string) {
  return new SignJWT({sid: sessionId})
    .setProtectedHeader({alg: 'HS256'})
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecretKey());
}

// ✅ Added back: used by Discord callback route
export async function createSessionCookie(sessionId: string) {
  const token = await signSessionToken(sessionId);

  // Next 16: cookies() is async
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

// ✅ Next 16: cookies() is async
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const {payload} = await jwtVerify(token, getSecretKey());
    const sid = payload.sid;
    if (typeof sid !== 'string') return null;

    const session = await prisma.session.findUnique({
      where: {id: sid},
      include: {user: true}
    });

    if (!session) return null;
    return session;
  } catch {
    return null;
  }
}

export function randomState() {
  return crypto.randomBytes(16).toString('hex');
}

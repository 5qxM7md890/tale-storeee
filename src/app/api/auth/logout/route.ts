import {NextResponse} from 'next/server';
import {getSession, SESSION_COOKIE_NAME} from '@/lib/auth';
import {prisma} from '@/lib/db';

export async function POST() {
  const session = await getSession();

  if (session) {
    await prisma.session.delete({where: {id: session.id}}).catch(() => {});
  }

  const res = NextResponse.json({ok: true});
  // ✅ clear cookie via response (works in Next 16 types)
  res.cookies.set(SESSION_COOKIE_NAME, '', {httpOnly: true, path: '/', maxAge: 0});
  return res;
}

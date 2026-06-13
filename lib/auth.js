import { cookies } from 'next/headers'
import { prisma } from './prisma'

// NOTE: This project does not have a full authentication system yet. This is
// a minimal, cookie-based session used to identify "the current student" so
// the referral programme (codes, credits, dashboards) can be wired up end to
// end. Swap this out for real auth (passwords/OAuth/etc.) without touching
// the referral logic in lib/referrals.js.
export const SESSION_COOKIE = 'unick_uid'

export async function getSessionUserId() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value ?? null
}

export async function getCurrentUser() {
  const userId = await getSessionUserId()
  if (!userId) return null
  return prisma.user.findUnique({ where: { id: userId } })
}

export async function setSessionUserId(userId) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) return null
  return user
}

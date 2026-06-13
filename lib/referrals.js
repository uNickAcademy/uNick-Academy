import { prisma } from './prisma'
import {
  REFERRAL_BONUS_PLN,
  QUALIFYING_PURCHASE_MIN_PLN,
  QUALIFYING_PURCHASE_TYPES,
  CREDIT_INELIGIBLE_PURCHASE_TYPES,
  MIN_LESSONS_FOR_REFERRER_REWARD,
  MAX_CREDIT_REDEMPTION_RATIO,
} from './constants'

// ---------------------------------------------------------------------------
// Normalisation helpers (used for abuse / duplicate-account detection)
// ---------------------------------------------------------------------------

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

// A looser normalisation that catches common "create another account with
// basically the same email" tricks (gmail dot/plus tricks etc.). Two emails
// that only differ in this way are not blocked outright (they may be
// legitimately different people), but the referral is flagged for review.
export function looseEmailKey(email) {
  const normalized = normalizeEmail(email)
  const [local, domain] = normalized.split('@')
  if (!domain) return normalized
  const strippedTag = local.split('+')[0]
  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com'
  const finalLocal = isGmail ? strippedTag.replace(/\./g, '') : strippedTag
  return `${finalLocal}@${domain}`
}

// Keeps only digits and the last 9 of them, which matches Polish numbers
// regardless of country-code/spacing formatting (e.g. "+48 123 456 789" and
// "123-456-789" normalize to the same value).
export function normalizePhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  return digits.slice(-9)
}

// ---------------------------------------------------------------------------
// Referral eligibility validation (rule #3)
// ---------------------------------------------------------------------------

const ELIGIBILITY_ERRORS = {
  invalid_code: 'This referral code does not exist.',
  self_referral: 'You cannot use your own referral code.',
  already_referred: 'This account has already used a referral code.',
  existing_student: 'Referral codes are only for brand new students.',
}

// Checks whether `candidate` (the new/prospective student) is allowed to
// redeem `referrer`'s referral code. Returns either
//   { ok: false, reason, message }
// or
//   { ok: true, flagged, flagReason }
export function checkReferralEligibility({ referrer, candidate }) {
  if (!referrer) {
    return { ok: false, reason: 'invalid_code', message: ELIGIBILITY_ERRORS.invalid_code }
  }

  if (referrer.id === candidate.id) {
    return { ok: false, reason: 'self_referral', message: ELIGIBILITY_ERRORS.self_referral }
  }

  if (candidate.referralReceived) {
    return { ok: false, reason: 'already_referred', message: ELIGIBILITY_ERRORS.already_referred }
  }

  if (candidate.purchases && candidate.purchases.length > 0) {
    return { ok: false, reason: 'existing_student', message: ELIGIBILITY_ERRORS.existing_student }
  }

  if (normalizeEmail(candidate.email) === normalizeEmail(referrer.email)) {
    return { ok: false, reason: 'self_referral', message: ELIGIBILITY_ERRORS.self_referral }
  }

  const candidatePhone = normalizePhone(candidate.phone)
  const referrerPhone = normalizePhone(referrer.phone)
  if (candidatePhone && referrerPhone && candidatePhone === referrerPhone) {
    return { ok: false, reason: 'self_referral', message: ELIGIBILITY_ERRORS.self_referral }
  }

  // Not blocked, but worth a second look from an admin.
  let flagged = false
  let flagReason = null
  if (looseEmailKey(candidate.email) === looseEmailKey(referrer.email)) {
    flagged = true
    flagReason = 'Referred email looks like a variant of the referrer\'s email.'
  }

  return { ok: true, flagged, flagReason }
}

// ---------------------------------------------------------------------------
// Applying a referral code (rules #1-#3)
// ---------------------------------------------------------------------------

export class ReferralError extends Error {
  constructor(reason, message) {
    super(message)
    this.reason = reason
  }
}

// Redeems `code` for `candidateUserId`. Creates the Referral row (status
// "pending") and grants the new student their 50 PLN bonus as a *pending*
// credit (not yet usable - see rule #4).
export async function applyReferralCode({ candidateUserId, code }) {
  const normalizedCode = (code || '').trim().toUpperCase()

  const candidate = await prisma.user.findUnique({
    where: { id: candidateUserId },
    include: { referralReceived: true, purchases: true },
  })
  if (!candidate) throw new ReferralError('not_found', 'Account not found.')

  const referrer = await prisma.user.findUnique({ where: { referralCode: normalizedCode } })

  const eligibility = checkReferralEligibility({ referrer, candidate })
  if (!eligibility.ok) {
    throw new ReferralError(eligibility.reason, eligibility.message)
  }

  return prisma.$transaction(async (tx) => {
    const referral = await tx.referral.create({
      data: {
        code: normalizedCode,
        referrerId: referrer.id,
        referredId: candidate.id,
        flagged: eligibility.flagged,
        flagReason: eligibility.flagReason,
      },
    })

    await tx.creditTransaction.create({
      data: {
        userId: candidate.id,
        amount: REFERRAL_BONUS_PLN,
        reason: 'referred_signup_bonus',
        status: 'pending',
        referralId: referral.id,
        note: 'Welcome bonus for using a referral code (becomes usable after a qualifying purchase).',
      },
    })

    return referral
  })
}

// ---------------------------------------------------------------------------
// Purchases & qualification (rules #4-#5)
// ---------------------------------------------------------------------------

export function computeIsQualifyingPurchase({ amount, type }) {
  return amount >= QUALIFYING_PURCHASE_MIN_PLN || QUALIFYING_PURCHASE_TYPES.includes(type)
}

// Records a purchase for `userId`. If it qualifies the user's referral
// (rule #4), the referral becomes "qualified" and the referred student's
// signup bonus becomes spendable. Also re-checks whether the referrer's
// reward conditions (rule #5) are now met.
export async function recordPurchase({ userId, amount, type, status = 'paid' }) {
  const purchase = await prisma.purchase.create({
    data: {
      userId,
      amount,
      type,
      status,
      isQualifying: computeIsQualifyingPurchase({ amount, type }),
    },
  })

  if (purchase.status === 'paid' && purchase.isQualifying) {
    await qualifyReferralForPurchase(purchase)
  }

  return purchase
}

async function qualifyReferralForPurchase(purchase) {
  const referral = await prisma.referral.findUnique({ where: { referredId: purchase.userId } })
  if (!referral || referral.status !== 'pending') return

  await prisma.$transaction(async (tx) => {
    await tx.referral.update({
      where: { id: referral.id },
      data: {
        status: 'qualified',
        qualifiedAt: new Date(),
        qualifyingPurchaseId: purchase.id,
      },
    })

    // Activate the referred student's signup bonus.
    await tx.creditTransaction.updateMany({
      where: { referralId: referral.id, reason: 'referred_signup_bonus', status: 'pending' },
      data: { status: 'active' },
    })
  })

  await tryRewardReferrer(referral.id)
}

// ---------------------------------------------------------------------------
// Lessons & referrer reward (rule #5)
// ---------------------------------------------------------------------------

export async function recordLesson({ userId, attended = true, isTrial = false, purchaseId = null }) {
  const lesson = await prisma.lesson.create({
    data: { userId, attended, isTrial, purchaseId },
  })

  if (attended && !isTrial) {
    const referral = await prisma.referral.findUnique({ where: { referredId: userId } })
    if (referral && referral.status === 'qualified') {
      await tryRewardReferrer(referral.id)
    }
  }

  return lesson
}

async function getAttendedLessonCount(userId) {
  return prisma.lesson.count({ where: { userId, attended: true, isTrial: false } })
}

// Grants the referrer their 50 PLN bonus once the referred student has:
//  - a qualifying purchase that is still "paid" (not refunded/cancelled), and
//  - attended at least MIN_LESSONS_FOR_REFERRER_REWARD lessons.
// Flagged referrals stop at "reward_pending" for an admin to approve.
export async function tryRewardReferrer(referralId) {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: { qualifyingPurchase: true },
  })
  if (!referral || referral.status !== 'qualified') return referral

  if (!referral.qualifyingPurchase || referral.qualifyingPurchase.status !== 'paid') return referral

  const lessonCount = await getAttendedLessonCount(referral.referredId)
  if (lessonCount < MIN_LESSONS_FOR_REFERRER_REWARD) return referral

  if (referral.flagged) {
    return prisma.referral.update({ where: { id: referral.id }, data: { status: 'reward_pending' } })
  }

  return grantReferrerReward(referral.id)
}

// Actually grants the referrer's credit and marks the referral "rewarded".
// Used both by the automatic flow above and by admin approval.
export async function grantReferrerReward(referralId) {
  return prisma.$transaction(async (tx) => {
    const referral = await tx.referral.findUnique({ where: { id: referralId } })
    if (!referral) throw new ReferralError('not_found', 'Referral not found.')

    // Idempotent: if the bonus was already granted, just make sure the
    // status/timestamp reflect "rewarded" without paying out twice.
    const alreadyGranted = await tx.creditTransaction.findFirst({
      where: { referralId: referral.id, reason: 'referrer_bonus' },
    })
    if (alreadyGranted) {
      return tx.referral.update({
        where: { id: referral.id },
        data: { status: 'rewarded', rewardedAt: referral.rewardedAt ?? new Date() },
      })
    }

    await tx.creditTransaction.create({
      data: {
        userId: referral.referrerId,
        amount: REFERRAL_BONUS_PLN,
        reason: 'referrer_bonus',
        status: 'active',
        referralId: referral.id,
        note: 'Reward for a successful referral.',
      },
    })

    return tx.referral.update({
      where: { id: referral.id },
      data: { status: 'rewarded', rewardedAt: new Date() },
    })
  })
}

// ---------------------------------------------------------------------------
// Refunds / cancellations (rules #5 & #7)
// ---------------------------------------------------------------------------

// Updates a purchase's status. If the purchase was the one that qualified a
// referral and it's no longer "paid", reverses any credit already granted
// for that referral and marks it "cancelled".
export async function updatePurchaseStatus({ purchaseId, status }) {
  const purchase = await prisma.purchase.update({ where: { id: purchaseId }, data: { status } })

  if (status === 'paid') return purchase

  const referral = await prisma.referral.findUnique({
    where: { qualifyingPurchaseId: purchase.id },
  })
  if (!referral) return purchase
  if (referral.status === 'rejected' || referral.status === 'cancelled') return purchase

  await reverseReferralCredits(referral.id)

  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: 'cancelled', cancelledAt: new Date() },
  })

  return purchase
}

// Claws back any active referral credits (both the referred student's
// signup bonus and, if already granted, the referrer's bonus) by inserting
// offsetting ledger entries. The original entries are left untouched so the
// ledger stays a full audit trail.
export async function reverseReferralCredits(referralId) {
  // A signup bonus that never became active (qualifying purchase never
  // happened) is simply voided - there's nothing to "reverse".
  await prisma.creditTransaction.updateMany({
    where: { referralId, reason: 'referred_signup_bonus', status: 'pending' },
    data: { status: 'cancelled' },
  })

  const grants = await prisma.creditTransaction.findMany({
    where: {
      referralId,
      status: 'active',
      reason: { in: ['referred_signup_bonus', 'referrer_bonus'] },
      amount: { gt: 0 },
    },
  })

  for (const grant of grants) {
    const alreadyReversed = await prisma.creditTransaction.findFirst({
      where: { referralId, reason: 'referral_reversal', userId: grant.userId },
    })
    if (alreadyReversed) continue

    await prisma.creditTransaction.create({
      data: {
        userId: grant.userId,
        amount: -grant.amount,
        reason: 'referral_reversal',
        status: 'active',
        referralId,
        note: 'Referral credit reversed (qualifying purchase refunded/cancelled).',
      },
    })
  }
}

// ---------------------------------------------------------------------------
// Credit balances & redemption (rule #6)
// ---------------------------------------------------------------------------

export async function getCreditSummary(userId) {
  const transactions = await prisma.creditTransaction.findMany({ where: { userId } })

  const balance = transactions
    .filter((t) => t.status === 'active')
    .reduce((sum, t) => sum + t.amount, 0)

  const pending = transactions
    .filter((t) => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)

  return { balance: round2(balance), pending: round2(pending), transactions }
}

function round2(n) {
  return Math.round(n * 100) / 100
}

// How much account credit can be applied to a purchase of `amount` and
// `type`: never for trial lessons, and never more than
// MAX_CREDIT_REDEMPTION_RATIO of the invoice (rule #6).
export async function getMaxCreditRedemption({ userId, amount, type }) {
  if (CREDIT_INELIGIBLE_PURCHASE_TYPES.includes(type)) return 0

  const { balance } = await getCreditSummary(userId)
  if (balance <= 0) return 0

  const cap = amount * MAX_CREDIT_REDEMPTION_RATIO
  return round2(Math.max(0, Math.min(balance, cap)))
}

// Applies up to `amount` of credit to `purchaseId`, recording a redemption
// ledger entry and updating the purchase's `creditApplied`.
export async function redeemCredit({ userId, purchaseId, amount }) {
  if (amount <= 0) return null

  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } })
  if (!purchase || purchase.userId !== userId) throw new ReferralError('not_found', 'Purchase not found.')

  const maxRedeemable = await getMaxCreditRedemption({ userId, amount: purchase.amount, type: purchase.type })
  const redeemed = round2(Math.min(amount, maxRedeemable))
  if (redeemed <= 0) return null

  return prisma.$transaction(async (tx) => {
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -redeemed,
        reason: 'redemption',
        status: 'active',
        purchaseId,
        note: 'Account credit applied to a purchase.',
      },
    })

    return tx.purchase.update({
      where: { id: purchaseId },
      data: { creditApplied: { increment: redeemed } },
    })
  })
}

// ---------------------------------------------------------------------------
// Student-facing referral overview (rule #10)
// ---------------------------------------------------------------------------

export async function getStudentReferralOverview(userId) {
  const [user, credit, referralsMade, referralReceived, purchaseCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    getCreditSummary(userId),
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { referred: true },
    }),
    prisma.referral.findUnique({ where: { referredId: userId } }),
    prisma.purchase.count({ where: { userId } }),
  ])

  return {
    referralCode: user.referralCode,
    creditBalance: credit.balance,
    pendingCredit: credit.pending,
    // A student can redeem a referral code as long as they haven't already
    // used one and haven't made their first purchase yet (rule #2).
    canApplyReferralCode: !referralReceived && purchaseCount === 0,
    referralReceived: referralReceived ? { status: referralReceived.status } : null,
    referrals: referralsMade.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      qualifiedAt: r.qualifiedAt,
      rewardedAt: r.rewardedAt,
      // Only a privacy-safe hint about who it is - no email/phone.
      referredFirstName: maskName(r.referred.name),
    })),
  }
}

function maskName(name) {
  if (!name) return 'Student'
  const trimmed = name.trim()
  const first = trimmed.split(/\s+/)[0]
  if (first.length <= 1) return `${first}.`
  return `${first[0]}${'*'.repeat(Math.min(first.length - 1, 4))}`
}

// ---------------------------------------------------------------------------
// Admin overview & actions (rules #7, #9)
// ---------------------------------------------------------------------------

export async function listReferralsForAdmin() {
  const referrals = await prisma.referral.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      referrer: true,
      referred: true,
      qualifyingPurchase: true,
    },
  })

  return Promise.all(
    referrals.map(async (r) => ({
      id: r.id,
      status: r.status,
      flagged: r.flagged,
      flagReason: r.flagReason,
      adminNote: r.adminNote,
      code: r.code,
      createdAt: r.createdAt,
      qualifiedAt: r.qualifiedAt,
      rewardedAt: r.rewardedAt,
      cancelledAt: r.cancelledAt,
      referrer: { id: r.referrer.id, name: r.referrer.name, email: r.referrer.email },
      referred: { id: r.referred.id, name: r.referred.name, email: r.referred.email, phone: r.referred.phone },
      qualifyingPurchase: r.qualifyingPurchase
        ? { id: r.qualifyingPurchase.id, amount: r.qualifyingPurchase.amount, type: r.qualifyingPurchase.type, status: r.qualifyingPurchase.status }
        : null,
      lessonsAttended: await getAttendedLessonCount(r.referredId),
    }))
  )
}

const ADMIN_SETTABLE_STATUSES = ['pending', 'qualified', 'reward_pending', 'rewarded', 'rejected', 'cancelled']

// Manual status override by an admin (rule #9). Handles the credit
// side-effects of moving into or out of "rewarded"/"cancelled"/"rejected".
export async function adminSetReferralStatus({ referralId, status, adminNote }) {
  if (!ADMIN_SETTABLE_STATUSES.includes(status)) {
    throw new ReferralError('invalid_status', `Unknown referral status: ${status}`)
  }

  const referral = await prisma.referral.findUnique({ where: { id: referralId } })
  if (!referral) throw new ReferralError('not_found', 'Referral not found.')

  if ((status === 'rejected' || status === 'cancelled') && referral.status !== status) {
    await reverseReferralCredits(referral.id)
  }

  const data = { status, adminNote: adminNote ?? referral.adminNote }
  if (status === 'cancelled') data.cancelledAt = new Date()

  await prisma.referral.update({ where: { id: referral.id }, data })

  if (status === 'rewarded') {
    return grantReferrerReward(referral.id)
  }

  return prisma.referral.findUnique({ where: { id: referral.id } })
}

// Manual credit add/remove for a user (rule #9).
export async function adminAdjustCredit({ userId, amount, note }) {
  if (!amount) throw new ReferralError('invalid_amount', 'Amount must be non-zero.')

  return prisma.creditTransaction.create({
    data: {
      userId,
      amount,
      reason: 'admin_adjustment',
      status: 'active',
      note: note || 'Manual adjustment by admin.',
    },
  })
}

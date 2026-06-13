// Demo data covering every referral status, so the student and admin
// dashboards have something to show out of the box.
//
// Run with: npm run db:seed

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

let codeCounter = 0
function nextReferralCode() {
  codeCounter += 1
  return `UNICK-DEMO${codeCounter}`
}

async function createUser({ name, email, phone, isAdmin = false }) {
  return prisma.user.create({
    data: { name, email, phone, isAdmin, referralCode: nextReferralCode() },
  })
}

async function main() {
  await prisma.creditTransaction.deleteMany()
  await prisma.lesson.deleteMany()
  await prisma.referral.deleteMany()
  await prisma.purchase.deleteMany()
  await prisma.user.deleteMany()

  await createUser({ name: 'Anna Admin', email: 'admin@unick-academy.pl', phone: '+48500100100', isAdmin: true })

  // --- Scenario 1: pending - referred student signed up, no purchase yet ---
  const marta = await createUser({ name: 'Marta Kowalska', email: 'marta@example.com', phone: '+48600100001' })
  const piotr = await createUser({ name: 'Piotr Lewandowski', email: 'piotr@example.com', phone: '+48600100002' })

  const ref1 = await prisma.referral.create({
    data: { code: marta.referralCode, referrerId: marta.id, referredId: piotr.id, status: 'pending' },
  })
  await prisma.creditTransaction.create({
    data: { userId: piotr.id, amount: 50, reason: 'referred_signup_bonus', status: 'pending', referralId: ref1.id, note: 'Welcome bonus, pending qualifying purchase.' },
  })

  // --- Scenario 2: qualified - qualifying purchase made, but <4 lessons yet ---
  const karolina = await createUser({ name: 'Karolina Zielinska', email: 'karolina@example.com', phone: '+48600100003' })
  const dawid = await createUser({ name: 'Dawid Lis', email: 'dawid@example.com', phone: '+48600100004' })

  const dawidPurchase = await prisma.purchase.create({
    data: { userId: dawid.id, amount: 250, type: 'single_lesson', status: 'paid', isQualifying: true },
  })
  const ref2 = await prisma.referral.create({
    data: {
      code: karolina.referralCode,
      referrerId: karolina.id,
      referredId: dawid.id,
      status: 'qualified',
      qualifiedAt: new Date(),
      qualifyingPurchaseId: dawidPurchase.id,
    },
  })
  await prisma.creditTransaction.create({
    data: { userId: dawid.id, amount: 50, reason: 'referred_signup_bonus', status: 'active', referralId: ref2.id, note: 'Usable after qualifying purchase.' },
  })
  await prisma.lesson.create({ data: { userId: dawid.id, purchaseId: dawidPurchase.id, attended: true } })

  // --- Scenario 3: rewarded - full happy path ---
  const ewa = await createUser({ name: 'Ewa Mazur', email: 'ewa@example.com', phone: '+48600100005' })
  const filip = await createUser({ name: 'Filip Wozniak', email: 'filip@example.com', phone: '+48600100006' })

  const filipPurchase = await prisma.purchase.create({
    data: { userId: filip.id, amount: 600, type: 'package', status: 'paid', isQualifying: true },
  })
  const ref3 = await prisma.referral.create({
    data: {
      code: ewa.referralCode,
      referrerId: ewa.id,
      referredId: filip.id,
      status: 'rewarded',
      qualifiedAt: new Date(),
      rewardedAt: new Date(),
      qualifyingPurchaseId: filipPurchase.id,
    },
  })
  await prisma.creditTransaction.create({
    data: { userId: filip.id, amount: 50, reason: 'referred_signup_bonus', status: 'active', referralId: ref3.id },
  })
  await prisma.creditTransaction.create({
    data: { userId: ewa.id, amount: 50, reason: 'referrer_bonus', status: 'active', referralId: ref3.id },
  })
  for (let i = 0; i < 5; i++) {
    await prisma.lesson.create({ data: { userId: filip.id, purchaseId: filipPurchase.id, attended: true } })
  }

  // --- Scenario 4: rejected - admin rejected a flagged referral ---
  const grzegorz = await createUser({ name: 'Grzegorz Kot', email: 'grzegorz.kot@example.com', phone: '+48600100007' })
  const hanna = await createUser({ name: 'Hanna Kot', email: 'grzegorz.kot+ref@example.com', phone: '+48600100008' })

  await prisma.referral.create({
    data: {
      code: grzegorz.referralCode,
      referrerId: grzegorz.id,
      referredId: hanna.id,
      status: 'rejected',
      flagged: true,
      flagReason: "Referred email looks like a variant of the referrer's email.",
      adminNote: 'Looks like the same person signing up twice - rejected.',
    },
  })
  // The signup bonus never became usable, so it's cancelled outright.
  await prisma.creditTransaction.create({
    data: { userId: hanna.id, amount: 50, reason: 'referred_signup_bonus', status: 'cancelled', note: 'Referral rejected by admin.' },
  })

  // --- Scenario 5: cancelled - qualifying purchase later refunded ---
  const iza = await createUser({ name: 'Iza Nowak', email: 'iza@example.com', phone: '+48600100009' })
  const jakub = await createUser({ name: 'Jakub Duda', email: 'jakub@example.com', phone: '+48600100010' })

  const jakubPurchase = await prisma.purchase.create({
    data: { userId: jakub.id, amount: 220, type: 'single_lesson', status: 'refunded', isQualifying: true },
  })
  const ref5 = await prisma.referral.create({
    data: {
      code: iza.referralCode,
      referrerId: iza.id,
      referredId: jakub.id,
      status: 'cancelled',
      qualifiedAt: new Date(),
      cancelledAt: new Date(),
      qualifyingPurchaseId: jakubPurchase.id,
    },
  })
  await prisma.creditTransaction.create({
    data: { userId: jakub.id, amount: 50, reason: 'referred_signup_bonus', status: 'active', referralId: ref5.id },
  })
  await prisma.creditTransaction.create({
    data: { userId: jakub.id, amount: -50, reason: 'referral_reversal', status: 'active', referralId: ref5.id, note: 'Qualifying purchase was refunded.' },
  })

  // --- Scenario 6: reward_pending - flagged referral awaiting admin review ---
  const klara = await createUser({ name: 'Klara Wisniewska', email: 'klara@example.com', phone: '+48600100011' })
  const lukasz = await createUser({ name: 'Lukasz Pawlak', email: 'lukasz@example.com', phone: '+48600100012' })

  const lukaszPurchase = await prisma.purchase.create({
    data: { userId: lukasz.id, amount: 300, type: 'package', status: 'paid', isQualifying: true },
  })
  const ref6 = await prisma.referral.create({
    data: {
      code: klara.referralCode,
      referrerId: klara.id,
      referredId: lukasz.id,
      status: 'reward_pending',
      flagged: true,
      flagReason: 'Multiple referrals from the same household - please verify.',
      qualifiedAt: new Date(),
      qualifyingPurchaseId: lukaszPurchase.id,
    },
  })
  await prisma.creditTransaction.create({
    data: { userId: lukasz.id, amount: 50, reason: 'referred_signup_bonus', status: 'active', referralId: ref6.id },
  })
  for (let i = 0; i < 4; i++) {
    await prisma.lesson.create({ data: { userId: lukasz.id, purchaseId: lukaszPurchase.id, attended: true } })
  }

  console.log('Seed data created.')
  console.log('')
  console.log('Demo accounts (sign in with just the email on /login):')
  console.log('  admin@unick-academy.pl   - admin panel')
  console.log('  marta@example.com        - referrer, 1 pending referral')
  console.log('  karolina@example.com     - referrer, 1 qualified referral')
  console.log('  ewa@example.com          - referrer, 1 rewarded referral (+50 PLN credit)')
  console.log('  klara@example.com        - referrer, 1 referral awaiting admin review')
  console.log('  piotr@example.com        - new student with a pending 50 PLN bonus')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

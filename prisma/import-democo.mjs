// Imports the Democo company roster: creates the company, the teachers, and
// every student with their teacher/schedule assignment. Safe to re-run -
// students are matched (and updated) by email.
//
// Run with: npm run db:import-democo

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { randomInt } from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const students = JSON.parse(readFileSync(path.join(__dirname, 'data', 'democo.json'), 'utf-8'))

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I to avoid confusion

async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    let segment = ''
    for (let i = 0; i < 6; i++) segment += ALPHABET[randomInt(ALPHABET.length)]
    const code = `UNICK-${segment}`
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }
  throw new Error('Could not generate a unique referral code, please retry')
}

// "08:00:00" -> "08:00"
function toHourMinute(time) {
  if (!time) return null
  return time.slice(0, 5)
}

async function main() {
  const company = await prisma.company.upsert({
    where: { name: 'Democo' },
    update: {},
    create: { name: 'Democo' },
  })

  const teacherNames = [...new Set(students.map((s) => s.teacher).filter(Boolean))]
  const teachers = {}
  for (const name of teacherNames) {
    teachers[name] = await prisma.teacher.upsert({
      where: { name },
      update: {},
      create: { name },
    })
  }

  let created = 0
  let updated = 0

  for (const s of students) {
    const name = `${s.firstName} ${s.lastName}`.trim()
    const existing = await prisma.user.findUnique({ where: { email: s.email } })

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name, phone: s.phone, companyId: company.id },
        })
      : await prisma.user.create({
          data: {
            name,
            email: s.email,
            phone: s.phone,
            companyId: company.id,
            referralCode: await generateUniqueReferralCode(),
          },
        })

    if (existing) updated += 1
    else created += 1

    await prisma.enrollment.upsert({
      where: { studentId: user.id },
      update: {
        teacherId: s.teacher ? teachers[s.teacher].id : null,
        mode: s.mode,
        dayOfWeek: s.day,
        startTime: toHourMinute(s.time),
        level: s.level,
        notes: s.note,
      },
      create: {
        studentId: user.id,
        teacherId: s.teacher ? teachers[s.teacher].id : null,
        mode: s.mode,
        dayOfWeek: s.day,
        startTime: toHourMinute(s.time),
        level: s.level,
        notes: s.note,
      },
    })
  }

  console.log(`Democo import complete: ${created} students created, ${updated} updated.`)
  console.log(`Teachers: ${teacherNames.join(', ')}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

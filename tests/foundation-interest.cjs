/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks = {}) {
  const source = fs.readFileSync(file, 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: file,
  }).outputText
  const loadedModule = {exports: {}}
  const localRequire = id => Object.prototype.hasOwnProperty.call(mocks, id) ? mocks[id] : require(id)
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {filename: file})(localRequire, loadedModule, loadedModule.exports)
  return loadedModule.exports
}

const options = load('src/lib/foundation/options.ts')
const schedule = load('src/lib/foundation/schedule.ts')
const validation = load('src/lib/foundation/validation.ts', {'./options': options})
const record = load('src/lib/foundation/record.ts')
const statistics = load('src/lib/foundation/statistics.ts', {'./options': options})

const birthDateForAge = age => `${2026 - age}-01-01`
const base = {
  participantFirstName: 'Jan Kowalski',
  birthDate: '2012-01-01',
  municipality: 'tarnowo_podgorne',
  residenceConfirmed: true,
  activities: ['teenpreneurs', 'art_performance_9_13'],
  primaryActivity: 'teenpreneurs',
  availableDays: ['monday', 'friday'],
  timeSlots: ['15:00–17:00', '17:00–19:00'],
  organizationalNeeds: 'Dostęp bez schodów',
  contactName: 'Anna Kowalska',
  email: 'anna@example.com',
  phone: '666 661 750',
  consentDeclaration: true,
  consentContact: true,
  privacyAcknowledged: true,
  startedAt: Date.now() - 5000,
}

assert.equal(options.calculateAgeOnDate('2016-11-01'), 10)
assert.equal(options.calculateAgeOnDate('2016-11-02'), 9)
assert.equal(options.calculateAgeOnDate('2012-02-29'), 14)
assert.equal(options.calculateAgeOnDate('2012-02-30'), null)
console.log('OK: birthdays and leap days')

const coursesByMunicipality = {
  tarnowo_podgorne: ['teenpreneurs', 'art_performance_9_13'],
  kazmierz: ['teenage_talk', 'podcasts_audio_video'],
  rokietnica: ['podcasts_audio_video', 'teenage_talk'],
  szamotuly: ['podcasts_audio_video', 'teenage_talk'],
}

for (const municipality of options.municipalityOptions.map(item => item.value)) {
  for (let age = 10; age <= 18; age += 1) {
    const eligible = options.activitiesForParticipant(age, municipality)
    const expected = options.activityOptions.filter(activity =>
      coursesByMunicipality[municipality].includes(activity.value)
      && age >= activity.minAge && age <= activity.maxAge)
    assert.deepEqual(eligible.map(activity => activity.value), expected.map(activity => activity.value), `${municipality}, ${age}: unexpected location filter`)
    assert.ok(eligible.length > 0, `${municipality}, ${age}: no eligible course`)
    for (const activity of eligible) {
      const result = validation.validateFoundationInterest({
        ...base,
        birthDate: birthDateForAge(age),
        municipality,
        activities: [activity.value],
        primaryActivity: activity.value,
      })
      assert.equal(result.ok, true, `${municipality}, ${age}, ${activity.value}`)
    }
  }
}
console.log('OK: all municipalities, ages and eligible courses')

assert.equal(validation.validateFoundationInterest({...base, municipality: 'kazmierz', activities: ['teenage_talk'], primaryActivity: 'teenage_talk'}).ok, true)
assert.equal(validation.validateFoundationInterest({...base, municipality: 'kazmierz', activities: ['teenpreneurs'], primaryActivity: 'teenpreneurs'}).ok, false)
assert.equal(validation.validateFoundationInterest({...base, municipality: 'kazmierz', birthDate: birthDateForAge(12), activities: ['teenage_talk'], primaryActivity: 'teenage_talk'}).ok, false)
assert.equal(schedule.courseScheduleDescription('rokietnica', 'podcasts_audio_video'), 'Czwartki, godz. 16:30. Sala OSP, ul. Szkolna 18B, 62-090 Rokietnica.')
assert.equal(schedule.courseScheduleDescription('kazmierz', 'teenpreneurs'), null)
assert.equal(schedule.courseScheduleDescription('szamotuly', 'teenage_talk'), 'Poniedziałki po południu. Godziny i adres podamy po potwierdzeniu sali.')
console.log('OK: revised Kaźmierz registration, confirmed timetable and unconfirmed Szamotuły venue')

const forgedAge = validation.validateFoundationInterest({...base, birthDate: birthDateForAge(10), participantAge: 18, activities: ['art_performance_9_13'], primaryActivity: 'art_performance_9_13'})
assert.equal(forgedAge.ok, true)
assert.equal(forgedAge.data.participantAge, 10)
assert.equal(validation.validateFoundationInterest({...base, municipality: 'other'}).ok, false)
assert.equal(validation.validateFoundationInterest({...base, residenceConfirmed: false}).ok, false)
assert.equal(validation.validateFoundationInterest({...base, consentContact: false}).ok, false)
assert.equal(validation.validateFoundationInterest({...base, startedAt: Date.now()}).ok, false)
console.log('OK: server derives age and rejects invalid location, consents and bot traps')

const valid = validation.validateFoundationInterest(base)
assert.equal(valid.ok, true)
const databaseRecord = record.toFoundationRecord(valid.data)
assert.equal(databaseRecord.municipality, 'tarnowo_podgorne')
assert.equal(databaseRecord.participant_age, 14)
assert.deepEqual(databaseRecord.available_days, ['monday', 'friday'])
const details = record.readFoundationDetails(databaseRecord.organizational_needs)
assert.equal(details.birthDate, '2012-01-01')
assert.equal(details.residenceConfirmed, true)
assert.equal(details.notes, 'Dostęp bez schodów')
assert.equal(record.readFoundationDetails('Starsza uwaga').notes, 'Starsza uwaga')
assert.equal(statistics.activityLabel('art_performance_9_13', '2026-08-04'), 'Art & Performance, 9–13 lat')
assert.equal(statistics.activityLabel('art_performance_9_13', '2026-10-14'), 'Art & Creative Performance, 10–16 lat')
console.log('OK: compatible database envelope and historical labels')

let inserted = null
let notificationCount = 0
let databaseError = null
const next = {NextResponse: {json: (body, init) => ({body, status: init?.status ?? 200})}}
const route = load('src/app/api/foundation-interest/route.ts', {
  'next/server': next,
  '@/lib/foundation/validation': validation,
  '@/lib/foundation/record': record,
  '@/lib/foundation/statistics': statistics,
  '@/lib/supabase/server': {
    createAdminClient: () => ({
      from: () => ({
        insert: value => {
          inserted = value
          return {select: () => ({single: async () => ({data: databaseError ? null : {id: 'test-id'}, error: databaseError})})}
        },
      }),
    }),
  },
  '@/lib/email/send': {
    sendFoundationInterestConfirmation: async () => { notificationCount += 1 },
    notifyFoundationEmail: async () => { notificationCount += 1 },
  },
})

const request = payload => ({
  headers: {get: name => name === 'origin' ? 'https://unick-academy.pl' : name === 'content-length' ? '1000' : null},
  nextUrl: {origin: 'https://unick-academy.pl'},
  json: async () => payload,
})

;(async () => {
  const response = await route.POST(request(base))
  assert.equal(response.status, 201)
  assert.equal(inserted.participant_first_name, 'Jan Kowalski')
  assert.equal(notificationCount, 2)

  const crossSite = request(base)
  crossSite.headers.get = name => name === 'sec-fetch-site' ? 'cross-site' : null
  assert.equal((await route.POST(crossSite)).status, 403)

  databaseError = {code: 'test'}
  assert.equal((await route.POST(request(base))).status, 500)
  console.log('PASS: validation, API save, notifications, origin protection and DB failure')
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})

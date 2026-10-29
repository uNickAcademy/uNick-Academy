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
const groups = load('src/lib/foundation/groups.ts', {'./options': options, './schedule': schedule})
const validation = load('src/lib/foundation/validation.ts', {'./options': options, './groups': groups})
const record = load('src/lib/foundation/record.ts')
const statistics = load('src/lib/foundation/statistics.ts', {'./options': options})
const declarations = load('src/lib/foundation/declarations.ts')

// Reproduce the reported panel: 27 declarations, 30 course indications,
// but only one Teenage Talk indication. None of these are real applicant data.
const statisticsRows = [
  ...Array.from({length: 13}, () => ({activities: ['art_performance_9_13'], primary_activity: 'art_performance_9_13'})),
  ...Array.from({length: 11}, () => ({activities: ['teenpreneurs'], primary_activity: 'teenpreneurs'})),
  ...Array.from({length: 2}, () => ({activities: ['podcasts_audio_video'], primary_activity: 'podcasts_audio_video'})),
  {activities: ['teenage_talk'], primary_activity: 'teenage_talk'},
].map(row => ({...row, municipality: 'tarnowo_podgorne', preferred_locations: ['szamotuly'], participant_age: 14}))
statisticsRows[0].activities.push('teenpreneurs')
statisticsRows[1].activities.push('teenpreneurs')
statisticsRows[2].activities.push('podcasts_audio_video')
statisticsRows[0].participant_age = 10
const allStatistics = statistics.buildFoundationStatistics(statisticsRows)
assert.equal(allStatistics.totalDeclarations, 27)
assert.equal(allStatistics.activitySelections, 30)
assert.deepEqual(allStatistics.courses.map(course => [course.value, course.count, course.firstChoice]), [
  ['teenpreneurs', 13, 11], ['podcasts_audio_video', 3, 2],
  ['teenage_talk', 1, 1], ['art_performance_9_13', 13, 13],
])
assert.equal(allStatistics.locations.find(item => item.value === 'tarnowo_podgorne').count, 27)
assert.equal(allStatistics.locations.find(item => item.value === 'szamotuly').count, 0)
assert.equal(allStatistics.ages.find(item => item.value === '10').count, 1)
assert.equal(statistics.MAX_FOUNDATION_GROUP_SIZE, 12)
const legacyStatistics = statistics.buildFoundationStatistics([{activities: ['creative_diy']}])
assert.equal(legacyStatistics.totalDeclarations, 1)
assert.equal(legacyStatistics.courses.find(course => course.value === 'creative_diy').count, 1)
assert.equal(legacyStatistics.locations.find(item => item.value === 'unknown').count, 1)
console.log('OK: all 27 declarations, separate course interests, 10–18 ages and actual residence')

const mockDeclarationReader = (records, failAtOffset = null) => ({
  from: () => {
    const query = {
      select: () => query,
      order: () => query,
      range: async (from, to) => from === failAtOffset
        ? {data: null, error: {message: 'simulated read error'}}
        : {data: records.slice(from, to + 1), error: null},
    }
    return query
  },
})

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

for (const residence of options.municipalityOptions.map(item => item.value)) {
  for (const courseMunicipality of options.projectLocationOptions.map(item => item.value)) {
    for (let age = 10; age <= 18; age += 1) {
      for (const activity of options.activitiesForParticipant(age, courseMunicipality)) {
        assert.equal(validation.validateFoundationInterest({
          ...base, municipality: residence, courseMunicipality,
          birthDate: birthDateForAge(age), activities: [activity.value], primaryActivity: activity.value,
        }).ok, true, `${residence} → ${courseMunicipality}, age ${age}, ${activity.value}`)
      }
    }
  }
}
const crossMunicipalityPayload = {
  ...base, municipality: 'tarnowo_podgorne', courseMunicipality: 'rokietnica',
  activities: ['teenage_talk'], primaryActivity: 'teenage_talk',
}
const crossMunicipality = validation.validateFoundationInterest(crossMunicipalityPayload)
assert.equal(crossMunicipality.ok, true)
const crossRecord = record.toFoundationRecord(crossMunicipality.data)
assert.equal(crossRecord.municipality, 'tarnowo_podgorne')
assert.equal(crossRecord.primary_location, 'rokietnica')
assert.deepEqual(crossRecord.preferred_locations, ['rokietnica'])
assert.equal(validation.validateFoundationInterest({...crossMunicipalityPayload, municipality: 'other'}).ok, false)
assert.equal(validation.validateFoundationInterest({...crossMunicipalityPayload, courseMunicipality: ''}).ok, false)
assert.equal(validation.validateFoundationInterest({...crossMunicipalityPayload, courseMunicipality: 'other'}).ok, false)
assert.equal(validation.validateFoundationInterest({...crossMunicipalityPayload, courseMunicipality: null}).ok, false)
assert.equal(validation.validateFoundationInterest({...crossMunicipalityPayload, birthDate: birthDateForAge(12)}).ok, false)
assert.equal(validation.validateFoundationInterest({...crossMunicipalityPayload, activities: ['teenpreneurs'], primaryActivity: 'teenpreneurs'}).ok, false)
console.log('OK: all residence/venue combinations; separate storage; age and offered-course restrictions preserved')

assert.equal(groups.foundationGroupOptions.length, 8)
assert.equal(new Set(groups.foundationGroupOptions.map(group => group.id)).size, 8)
const mixedGroupsPayload = {
  ...base,
  selectedGroups: ['tarnowo_podgorne:teenpreneurs', 'rokietnica:teenage_talk'],
  primaryGroup: 'rokietnica:teenage_talk',
  // Group choices, not untrusted legacy fields, determine the saved activities.
  activities: ['creative_diy'], primaryActivity: 'creative_diy', courseMunicipality: 'kazmierz',
}
const mixedGroups = validation.validateFoundationInterest(mixedGroupsPayload)
assert.equal(mixedGroups.ok, true)
assert.deepEqual(mixedGroups.data.activities, ['teenpreneurs', 'teenage_talk'])
assert.equal(mixedGroups.data.primaryActivity, 'teenage_talk')
assert.equal(mixedGroups.data.courseMunicipality, 'rokietnica')
const mixedRecord = record.toFoundationRecord(mixedGroups.data)
assert.deepEqual(mixedRecord.preferred_locations, ['tarnowo_podgorne', 'rokietnica'])
assert.equal(mixedRecord.primary_location, 'rokietnica')
const mixedDetails = record.readFoundationDetails(mixedRecord.organizational_needs)
assert.equal(mixedDetails.primaryGroup, 'rokietnica:teenage_talk')
assert.deepEqual(mixedDetails.selectedGroups.map(group => group.id), mixedGroupsPayload.selectedGroups)
assert.ok(mixedDetails.selectedGroups[0].label.includes('16:30'))
assert.ok(mixedDetails.selectedGroups[1].label.includes('Szkolna 18B'))
const sameCourseDifferentPlaces = validation.validateFoundationInterest({
  ...base,
  selectedGroups: ['kazmierz:podcasts_audio_video', 'rokietnica:podcasts_audio_video'],
  primaryGroup: 'kazmierz:podcasts_audio_video',
})
assert.equal(sameCourseDifferentPlaces.ok, true)
assert.deepEqual(sameCourseDifferentPlaces.data.activities, ['podcasts_audio_video'])
assert.equal(sameCourseDifferentPlaces.data.selectedGroups.length, 2)
for (const invalidGroups of [[], ['other:teenpreneurs'], ['tarnowo_podgorne:teenpreneurs', 'fake'], ['rokietnica:teenage_talk', {}], null]) {
  assert.equal(validation.validateFoundationInterest({...mixedGroupsPayload, selectedGroups: invalidGroups}).ok, false)
}
assert.equal(validation.validateFoundationInterest({...mixedGroupsPayload, primaryGroup: 'kazmierz:teenage_talk'}).ok, false)
assert.equal(validation.validateFoundationInterest({...mixedGroupsPayload, municipality: 'other'}).ok, false)
assert.equal(validation.validateFoundationInterest({...mixedGroupsPayload, birthDate: birthDateForAge(12)}).ok, false)
assert.equal(validation.validateFoundationInterest({...base, birthDate: birthDateForAge(18), selectedGroups: ['rokietnica:podcasts_audio_video'], primaryGroup: 'rokietnica:podcasts_audio_video'}).ok, false)
assert.equal(record.readFoundationDetails(JSON.stringify({schema: 'kreatorzy-2026-10', birthDate: '2012-01-01', residenceConfirmed: true, notes: 'Starsza uwaga'})).birthDate, '2012-01-01')
assert.deepEqual(record.readFoundationDetails(JSON.stringify({schema: 'kreatorzy-2026-10', birthDate: '2012-01-01'})).selectedGroups, [])
console.log('OK: eight groups; mixed venues; snapshots; invalid and age-ineligible groups rejected; legacy details readable')

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
  const manyDeclarations = Array.from({length: 1205}, (_, index) => ({id: String(index)}))
  assert.equal((await declarations.listFoundationDeclarations(mockDeclarationReader(manyDeclarations))).data.length, 1205)
  const partialFailure = await declarations.listFoundationDeclarations(mockDeclarationReader(manyDeclarations, 500))
  assert.equal(partialFailure.data, null)
  assert.ok(partialFailure.error)
  console.log('OK: all pages loaded; partial failure never becomes misleading statistics')

  const exportClient = {
    ...mockDeclarationReader(statisticsRows),
    auth: {getUser: async () => ({data: {user: {id: 'admin-test'}}})},
    from: table => table === 'profiles'
      ? {select: () => ({eq: () => ({single: async () => ({data: {role: 'admin'}})})})}
      : mockDeclarationReader(statisticsRows).from(table),
  }
  const exportRoute = load('src/app/api/admin/foundation-interest/route.ts', {
    'next/server': next,
    '@/lib/foundation/statistics': statistics,
    '@/lib/foundation/record': record,
    '@/lib/foundation/declarations': declarations,
    '@/lib/supabase/server': {createClient: async () => exportClient},
  })
  const csvResponse = await exportRoute.GET({nextUrl: new URL('https://example.test/api/admin/foundation-interest?format=csv')})
  assert.equal(csvResponse.status, 200)
  const csv = await csvResponse.text()
  assert.ok(csv.includes('"zgłoszenia łącznie";"27"'))
  assert.ok(csv.includes('"Teenpreneurs, 13–18 lat";"13";"11"'))
  assert.ok(!csv.includes('STATYSTYKI TEENAGE TALK'))
  assert.ok(!csv.includes('maks. 16 osób'))
  assert.ok(csv.includes('"selected_groups_labels"'))
  console.log('OK: admin CSV exports the same complete statistics as the panel')

  const response = await route.POST(request(base))
  assert.equal(response.status, 201)
  assert.equal(inserted.participant_first_name, 'Jan Kowalski')
  assert.equal(notificationCount, 2)

  assert.equal((await route.POST(request(crossMunicipalityPayload))).status, 201)
  assert.equal(inserted.municipality, 'tarnowo_podgorne')
  assert.equal(inserted.primary_location, 'rokietnica')
  assert.equal(notificationCount, 4)

  assert.equal((await route.POST(request(mixedGroupsPayload))).status, 201)
  assert.deepEqual(inserted.preferred_locations, ['tarnowo_podgorne', 'rokietnica'])
  assert.equal(record.readFoundationDetails(inserted.organizational_needs).selectedGroups.length, 2)
  assert.equal(notificationCount, 6)

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

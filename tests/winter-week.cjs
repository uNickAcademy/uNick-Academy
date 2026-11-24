/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks = {}) {
  const source = fs.readFileSync(file, 'utf8')
  const code = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
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
const foundationValidation = load('src/lib/foundation/validation.ts', {'./options': options, './groups': groups})
const event = load('src/lib/winter/event.ts')
const winter = load('src/lib/winter/validation.ts', {
  '../foundation/options': options,
  '../foundation/groups': groups,
  '../foundation/validation': foundationValidation,
  './event': event,
})

const teenpreneurs = 'tarnowo_podgorne:teenpreneurs'
const base = {
  participantName: 'Jan Kowalski',
  birthDate: '2012-01-01',
  municipality: 'tarnowo_podgorne',
  residenceConfirmed: true,
  regularParticipant: true,
  regularGroups: [teenpreneurs],
  attendanceDeclaration: true,
  rulesAccepted: true,
  specialNeeds: 'Spokojniejsze warunki pracy',
  contactName: 'Anna Kowalska',
  email: 'Anna@Example.com',
  phone: '666 661 750',
  consentContact: true,
  privacyAcknowledged: true,
  startedAt: Date.now() - 5000,
  // Autofill used to fill a hidden trap field and block real families.
  uniBallPotwierdzenie: 'Antoni Rudd',
}
const check = (overrides = {}) => winter.validateWinterRegistration({...base, ...overrides})

const ok = check()
assert.equal(ok.ok, true)
assert.equal(ok.data.participantAge, 14)
assert.equal(ok.data.email, 'anna@example.com')
assert.equal(ok.data.phone, '+48666661750')
assert.equal(ok.data.regularGroups.length, 1)
assert.equal(ok.data.regularGroups[0].id, teenpreneurs)

// Priority is optional: someone outside regular groups can still apply.
const outside = check({regularParticipant: false, regularGroups: [teenpreneurs]})
assert.equal(outside.ok, true)
assert.equal(outside.data.regularParticipant, false)
assert.deepEqual(outside.data.regularGroups, [])

assert.equal(check({regularParticipant: undefined}).ok, false)
assert.equal(check({regularParticipant: true, regularGroups: []}).ok, false)
assert.equal(check({regularGroups: ['nope:nope']}).ok, false)
// Teenpreneurs is 13-18, so a 12 year old cannot claim that group.
assert.equal(check({birthDate: '2014-01-01'}).ok, false)
assert.equal(check({birthDate: '2016-11-02'}).ok, false)
assert.equal(check({birthDate: '2007-11-01'}).ok, false)
assert.equal(check({municipality: 'poznan'}).ok, false)
for (const field of ['residenceConfirmed', 'attendanceDeclaration', 'rulesAccepted', 'consentContact', 'privacyAcknowledged']) {
  assert.equal(check({[field]: false}).ok, false, field)
}
assert.equal(check({participantName: 'Jan'}).ok, false)
assert.equal(check({contactName: 'Anna'}).ok, false)
assert.equal(check({email: 'nie-email'}).ok, false)
assert.equal(check({phone: '123'}).ok, false)
assert.equal(check({startedAt: Date.now()}).ok, false)

const record = winter.toWinterRecord(ok.data)
assert.equal(record.participant_age, 14)
assert.equal(record.regular_participant, true)
assert.equal(record.special_needs, 'Spokojniejsze warunki pracy')
assert.equal(record.consent_version, event.WINTER.consentVersion)
console.log('OK: winter week validation, priority groups, consents and record mapping')

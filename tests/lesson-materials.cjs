/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

function load(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const loaded = { exports: {} }
  const localRequire = id => Object.hasOwn(mocks, id) ? mocks[id] : require(id)
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(localRequire, loaded, loaded.exports)
  return loaded.exports
}

let cookie
process.env.LESSON_MATERIALS_SECRET = 'test-only-secret'
const access = load('src/lib/lesson-materials/access.ts', {
  'next/headers': { cookies: async () => ({ get: () => cookie ? { value: cookie } : undefined }) },
  '@/app/lib/site-config': { siteConfig: { url: 'https://unick-academy.pl' } },
})
const contacts = load('src/lib/lesson-materials/contacts.ts', {
  '@/lib/supabase/server': {},
})

async function run() {
  assert.equal(await access.hasMaterialsAccess(), false)
  cookie = access.createMaterialsSession()
  assert.equal(await access.hasMaterialsAccess(), true)
  const original = cookie
  cookie = original.replace(/^\d+/, '9999999999')
  assert.equal(await access.hasMaterialsAccess(), false)
  cookie = original.slice(0, -1) + (original.endsWith('a') ? 'b' : 'a')
  assert.equal(await access.hasMaterialsAccess(), false)
  cookie = '../../etc/passwd'
  assert.equal(await access.hasMaterialsAccess(), false)
  cookie = original
  const realNow = Date.now
  Date.now = () => realNow() + (access.SESSION_SECONDS + 1) * 1000
  assert.equal(await access.hasMaterialsAccess(), false)
  Date.now = realNow

  const token = access.createAccessToken()
  assert.match(token, access.accessTokenPattern)
  assert.notEqual(token, access.createAccessToken())
  assert.match(access.hashAccessToken(token), /^[0-9a-f]{64}$/)
  assert.notEqual(access.hashRequestClient('192.0.2.1'), access.hashRequestClient('192.0.2.2'))
  const url = new URL(access.materialsActionUrl('confirm', 'pl', token))
  assert.equal(url.searchParams.has('token'), false)
  assert.equal(url.hash, '#' + token)

  const id = '28a11bde-9e32-4fc7-98c5-fc89119a4a5c'
  const unsubscribe = new URL(access.materialsUnsubscribeUrl(id, 'pl')).hash.slice(1)
  assert.equal(access.unsubscribeContactId(unsubscribe), id)
  assert.equal(access.unsubscribeContactId(unsubscribe.replace(id, '18a11bde-9e32-4fc7-98c5-fc89119a4a5c')), null)
  assert.equal(access.unsubscribeContactId(token), null)

  const consent = { newsletter_opted_in_at: '2026-11-18T12:00:00.000Z', newsletter_unsubscribed_at: null }
  assert.equal(contacts.hasMaterialNewsletterConsent(consent), true)
  assert.equal(contacts.hasMaterialNewsletterConsent({ ...consent, newsletter_opted_in_at: null }), false)
  assert.equal(contacts.hasMaterialNewsletterConsent({ ...consent, newsletter_unsubscribed_at: '2026-11-18T13:00:00.000Z' }), false)
  assert.equal(contacts.hasMaterialNewsletterConsent({ ...consent, newsletter_unsubscribed_at: '2026-11-18T11:00:00.000Z' }), true)
  console.log('Verified signed access cookies, expiry, tamper rejection, fragment-only links and newsletter eligibility')
}
run().catch(error => { console.error(error); process.exitCode = 1 })

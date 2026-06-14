#!/usr/bin/env node
/**
 * One-off helper that creates the "uNick Teachers Academy Membership" Stripe
 * product and its monthly/annual prices in PLN, EUR and USD (see
 * lib/constants.js for the amounts). Safe to re-run: existing prices are
 * matched by lookup_key and left untouched.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_test_... npm run setup:stripe
 *
 * After it finishes, copy the printed price IDs into .env.local.
 */

const fs = require('fs')
const path = require('path')

// Load .env.local if present, without adding a dotenv dependency.
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  }
}

const Stripe = require('stripe')

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Set STRIPE_SECRET_KEY before running this script.')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })

const PRODUCT_NAME = 'uNick Teachers Academy Membership'

// Amounts must stay in sync with lib/constants.js PRICES.
const PLANS = [
  { plan: 'monthly', interval: 'month', amounts: { usd: 600, eur: 500, pln: 2000 } },
  { plan: 'annual', interval: 'year', amounts: { usd: 6000, eur: 5000, pln: 20000 } },
]

async function findOrCreateProduct() {
  const existing = await stripe.products.search({ query: `name:"${PRODUCT_NAME}"` })
  if (existing.data.length > 0) return existing.data[0]
  return stripe.products.create({ name: PRODUCT_NAME })
}

async function findOrCreatePrice(product, plan, interval, currency, unitAmount) {
  const lookupKey = `academy_${plan}_${currency}`
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 })
  if (existing.data.length > 0) return existing.data[0]

  return stripe.prices.create({
    product: product.id,
    currency,
    unit_amount: unitAmount,
    recurring: { interval },
    lookup_key: lookupKey,
    nickname: `${plan} (${currency.toUpperCase()})`,
    // Amounts are net (tax-exclusive) - Stripe Tax adds VAT on top.
    tax_behavior: 'exclusive',
  })
}

async function main() {
  const product = await findOrCreateProduct()
  console.log(`Product: ${product.name} (${product.id})`)
  console.log('\nAdd these to .env.local / your hosting provider:\n')

  for (const { plan, interval, amounts } of PLANS) {
    for (const [currency, unitAmount] of Object.entries(amounts)) {
      const price = await findOrCreatePrice(product, plan, interval, currency, unitAmount)
      const envKey = `STRIPE_PRICE_${plan.toUpperCase()}_${currency.toUpperCase()}`
      console.log(`${envKey}=${price.id}`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

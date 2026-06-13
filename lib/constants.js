// Central place for the referral programme's business rules so they can be
// tuned without hunting through the codebase.

// Reward granted to both the referrer and the referred student.
export const REFERRAL_BONUS_PLN = 50

// A purchase "qualifies" a referral if it's at least this amount...
export const QUALIFYING_PURCHASE_MIN_PLN = 200

// ...or if it's one of these purchase types (a full package / month), no
// matter the amount.
export const QUALIFYING_PURCHASE_TYPES = ['package', 'monthly']

// Purchase types that can never be paid for with account credit.
export const CREDIT_INELIGIBLE_PURCHASE_TYPES = ['trial']

// Referrer only gets rewarded once the referred student attended this many
// lessons (in addition to the qualifying purchase staying valid).
export const MIN_LESSONS_FOR_REFERRER_REWARD = 4

// Account credit can cover at most this fraction of a single invoice/payment.
export const MAX_CREDIT_REDEMPTION_RATIO = 0.5

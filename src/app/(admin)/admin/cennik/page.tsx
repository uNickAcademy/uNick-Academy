import { getPricingPlans, getDiscountCodes } from '@/lib/supabase/queries'
import { PricingView } from './PricingView'

export const dynamic = 'force-dynamic'

export default async function CennikPage() {
  const [plans, codes] = await Promise.all([getPricingPlans(), getDiscountCodes()])

  return (
    <PricingView
      plans={plans.map((p) => ({
        id: p.id, name: p.name, lessonsPerWeek: p.lessons_per_week,
        pricePerLesson: Number(p.price_per_lesson), isActive: p.is_active,
      }))}
      codes={codes.map((c) => ({
        id: c.id, code: c.code,
        percentOff: c.percent_off != null ? Number(c.percent_off) : null,
        amountOff: c.amount_off != null ? Number(c.amount_off) : null,
        description: c.description ?? '',
        validUntil: c.valid_until ?? '',
        maxUses: c.max_uses ?? null,
        timesUsed: c.times_used,
        isActive: c.is_active,
      }))}
    />
  )
}

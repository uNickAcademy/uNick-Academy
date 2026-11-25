import { z } from 'zod'

export function validNip(value: string) {
  if (!/^\d{10}$/.test(value)) return false
  const digits = [...value].map(Number)
  const checksum = [6, 5, 7, 2, 3, 4, 5, 6, 7].reduce((sum, weight, index) => sum + weight * digits[index], 0) % 11
  return checksum < 10 && checksum === digits[9]
}

export const checkoutSchema = z.object({
  value: z.union([z.literal(250), z.literal(500), z.literal(1000), z.literal(5000)]),
  buyerName: z.string().trim().min(2).max(100).refine(value => !/[\x00-\x1f\x7f]/.test(value)),
  buyerEmail: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  gift: z.boolean(),
  terms: z.literal(true),
  idempotencyKey: z.string().uuid(),
  invoice: z.object({ taxId: z.string().max(20).transform(value => value.replace(/[\s-]/g, '')).refine(validNip), name: z.string().trim().min(2).max(200), address: z.string().trim().min(5).max(300) }).strict().optional(),
}).strict()

export const notificationSchema = z.object({
  order: z.object({
    orderId: z.string().min(1).max(128),
    extOrderId: z.string().uuid(),
    merchantPosId: z.string().min(1).max(64),
    currencyCode: z.literal('PLN'),
    totalAmount: z.string().regex(/^\d+$/),
    status: z.enum(['PENDING', 'WAITING_FOR_CONFIRMATION', 'COMPLETED', 'CANCELED']),
  }).passthrough(),
}).passthrough()

export type CheckoutInput = z.infer<typeof checkoutSchema>

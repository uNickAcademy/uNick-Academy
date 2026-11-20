import { lessonMaterials } from '@/app/lib/lesson-materials'

export const CONVERSATION_MATERIAL = 'conversation-cards'

export function materialRequestTopic(topic: unknown): string | null {
  if (topic === CONVERSATION_MATERIAL) return CONVERSATION_MATERIAL
  return lessonMaterials.find(material => material.slug === topic)?.slug ?? null
}

export function materialAccessPath(topic: unknown, language: 'pl' | 'en') {
  const slug = materialRequestTopic(topic)
  if (slug === CONVERSATION_MATERIAL) return `/${language}/conversation-cards`
  return `/${language}/meterials${slug ? `/${slug}` : ''}`
}

import type { SupabaseClient } from '@supabase/supabase-js'
import { siteConfig, foundationConfig } from '@/app/lib/site-config'
import pl from '@/app/lib/dictionaries/pl'

// Wiedza Agenta Skrzynki o szkole. Trzy źródła, od najważniejszego:
//  1. to, co zespół sam wpisał lub potwierdził w panelu (notatki + zapamiętane
//     odpowiedzi),
//  2. profil wyciągnięty z historii „Wysłanych" (jak i co szkoła odpisuje),
//  3. fakty ze strony internetowej (dane kontaktowe + FAQ), czytane wprost
//     z kodu strony, żeby agent nie rozjechał się z tym, co widzi klient.

export type KnowledgeItem = { id: string; topic: string; answer: string; source: string; created_at: string }

export type AgentState = {
  enabled: boolean
  auto_reply: boolean
  owner_notes: string
  signature: string
  learned_profile: string
  learned_profile_at: string | null
  last_run_at: string | null
  last_run_summary: Record<string, unknown> | null
  last_error: string | null
}

const DEFAULT_STATE: AgentState = {
  enabled: true,
  auto_reply: false,
  owner_notes: '',
  signature: '',
  learned_profile: '',
  learned_profile_at: null,
  last_run_at: null,
  last_run_summary: null,
  last_error: null,
}

export async function loadState(admin: SupabaseClient): Promise<AgentState> {
  const { data } = await admin.from('inbox_agent_state').select('*').eq('id', true).maybeSingle()
  return { ...DEFAULT_STATE, ...(data ?? {}) } as AgentState
}

export async function saveState(admin: SupabaseClient, patch: Partial<AgentState>): Promise<void> {
  await admin.from('inbox_agent_state').upsert({ id: true, ...patch, updated_at: new Date().toISOString() })
}

export async function loadKnowledge(admin: SupabaseClient): Promise<KnowledgeItem[]> {
  const { data } = await admin
    .from('inbox_agent_knowledge')
    .select('id, topic, answer, source, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  return (data ?? []) as KnowledgeItem[]
}

type FaqItem = { title: string; text: string }

// Zbiera wszystkie bloki FAQ ze słownika strony, gdziekolwiek są.
function collectFaq(node: unknown, out: FaqItem[], depth = 0): void {
  if (!node || typeof node !== 'object' || depth > 6) return
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'faq' && value && typeof value === 'object') {
      const items = (value as { items?: unknown }).items
      if (Array.isArray(items)) {
        for (const it of items) {
          const item = it as Partial<FaqItem>
          if (typeof item.title === 'string' && typeof item.text === 'string') out.push({ title: item.title, text: item.text })
        }
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      collectFaq(value, out, depth + 1)
    }
  }
}

export function websiteFacts(): string {
  const a = siteConfig.address
  const faq: FaqItem[] = []
  collectFaq(pl, faq)
  const seen = new Set<string>()
  const faqLines = faq
    .filter((f) => (seen.has(f.title) ? false : (seen.add(f.title), true)))
    .map((f) => `- ${f.title} ${f.text}`)

  return [
    `Nazwa: ${siteConfig.name}, szkoła języka angielskiego.`,
    `Adres (zajęcia stacjonarne): ul. ${a.streetAddress}, ${a.village}, ${a.postalCode} ${a.addressLocality} (${a.municipality}).`,
    `Telefon: ${siteConfig.phone.display}. E-mail: ${siteConfig.email}. Strona: ${siteConfig.url}.`,
    `Formularz zapisu: ${siteConfig.url}/sign-me-up. Kontakt i konsultacja: ${siteConfig.url}/kontakt. Logowanie ucznia: ${siteConfig.url}/login.`,
    `Fundacja: ${foundationConfig.name} (KRS ${foundationConfig.krs}, NIP ${foundationConfig.nip}), ten sam adres.`,
    '',
    'Pytania i odpowiedzi ze strony internetowej:',
    ...faqLines,
  ].join('\n')
}

// Blok wiedzy wklejany do promptu. Kolejność ma znaczenie: przy sprzeczności
// wygrywa to, co wyżej.
export function buildKnowledgeBlock(state: AgentState, knowledge: KnowledgeItem[]): string {
  const parts: string[] = []
  if (state.owner_notes.trim()) {
    parts.push(`## Notatki zespołu (najważniejsze, obowiązują zawsze)\n${state.owner_notes.trim()}`)
  }
  if (knowledge.length > 0) {
    parts.push(
      `## Odpowiedzi potwierdzone przez zespół\n${knowledge
        .map((k) => `- Temat: ${k.topic}\n  Odpowiedź: ${k.answer.replace(/\n+/g, ' ')}`)
        .join('\n')}`,
    )
  }
  if (state.learned_profile.trim()) {
    parts.push(`## Czego nauczyła historia wysłanych odpowiedzi\n${state.learned_profile.trim()}`)
  }
  parts.push(`## Fakty ze strony internetowej\n${websiteFacts()}`)
  return parts.join('\n\n')
}

// Kim jest nadawca według naszej bazy: uczeń, rodzic, nauczyciel czy nowa
// osoba. Do promptu trafia tylko rola i imię, nic więcej z kartoteki.
export async function describeSender(admin: SupabaseClient, email: string): Promise<string> {
  const lines: string[] = []
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, role')
      .ilike('email', email)
      .limit(1)
      .maybeSingle()
    if (profile) {
      const role = profile.role === 'teacher' ? 'nauczyciel' : profile.role === 'student' ? 'uczeń lub rodzic ucznia' : String(profile.role)
      lines.push(`Ma konto w naszym systemie jako: ${role} (${profile.full_name ?? 'bez imienia'}).`)
    }
    const { data: lead } = await admin
      .from('leads')
      .select('created_at')
      .ilike('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lead) {
      lines.push(`Wysłał(a) zgłoszenie przez formularz na stronie dnia ${new Date(lead.created_at as string).toLocaleDateString('pl-PL')}.`)
    }
  } catch {
    // brak dostępu do kartoteki nie blokuje odpowiedzi
  }
  return lines.length ? lines.join(' ') : 'Nie ma tego adresu w naszym systemie: prawdopodobnie nowa osoba albo kontakt spoza szkoły.'
}

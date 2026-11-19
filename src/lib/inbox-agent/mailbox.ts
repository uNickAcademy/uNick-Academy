import { ImapFlow, type MessageStructureObject } from 'imapflow'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'
import MailComposer from 'nodemailer/lib/mail-composer'
import { escapeHtml, signatureHtml, signatureText } from './signature'
import { AGENT_HEADER, CATEGORIES, CREATE_NEXT_TO, REVIEW_FOLDER, type CategoryKey, type InboxConfig } from './config'

// Warstwa pocztowa Agenta Skrzynki: IMAP (czytanie, foldery, przenoszenie)
// i SMTP (wysyłka odpowiedzi z tej samej skrzynki, żeby szły z właściwego
// adresu i lądowały w „Wysłanych" jak maile pisane ręcznie).
//
// Zasada nadrzędna: agent NIGDY niczego nie usuwa. Jedyne operacje na
// istniejących wiadomościach to przeniesienie do folderu i flaga „odpowiedziano".

export type MailAddress = { address: string; name: string }

export type FetchedMail = {
  uid: number
  messageId: string
  from: MailAddress
  replyTo: MailAddress | null
  to: string
  subject: string
  date: Date
  flags: Set<string>
  text: string
  inReplyTo: string | null
  references: string[]
  attachmentNames: string[]
  // Załączniki wideo rozpoznane ze struktury MIME (bez pobierania samego
  // nagrania) oraz linki do nagrań znalezione w treści.
  videoAttachments: string[]
  videoLinks: string[]
  // Wiadomość z automatu (newsletter, no-reply, autoresponder, lista
  // mailingowa, nasz własny agent). Na takie nigdy nie odpowiadamy sami.
  automated: boolean
  automatedReason: string | null
}

export type FolderMap = {
  inbox: string
  sent: string | null
  review: string
  categories: Record<CategoryKey, string>
}

export async function openMailbox(cfg: InboxConfig): Promise<ImapFlow> {
  const client = new ImapFlow({
    host: cfg.imapHost,
    port: cfg.imapPort,
    secure: cfg.imapPort === 993,
    auth: { user: cfg.user, pass: cfg.password },
    logger: false,
    // Funkcja na Vercel ma skończony czas życia: lepiej szybko zgłosić błąd
    // połączenia niż wisieć do limitu.
    connectionTimeout: 20_000,
    greetingTimeout: 15_000,
    socketTimeout: 120_000,
  })
  // Bez tego zerwane połączenie rzuca nieobsłużony 'error' i kładzie proces.
  client.on('error', (err: Error) => {
    console.error('[AgentSkrzynki] Błąd połączenia IMAP:', err.message)
  })
  await client.connect()
  return client
}

export async function closeMailbox(client: ImapFlow): Promise<void> {
  try {
    await client.logout()
  } catch {
    client.close()
  }
}

// Tworzy brakujące podfoldery i zwraca mapę ścieżek. Najpierw próbuje
// podfolderu skrzynki odbiorczej (INBOX/Nazwa). Część serwerów nie pozwala
// na podfoldery w INBOX: wtedy folder powstaje na głównym poziomie.
export async function ensureFolders(client: ImapFlow): Promise<FolderMap> {
  let list = await client.list()
  const byPath = () => new Map(list.map((m) => [m.path.toLowerCase(), m.path]))
  const inboxEntry = list.find((m) => m.path.toUpperCase() === 'INBOX')
  const delimiter = inboxEntry?.delimiter || list.find((m) => m.delimiter)?.delimiter || '.'

  const wanted = [REVIEW_FOLDER, ...CATEGORIES.map((c) => c.folder)]
  const resolved = new Map<string, string>()

  for (const name of wanted) {
    const existing = byPath()
    const nested = `INBOX${delimiter}${name}`
    // Folder, który już istnieje pod tą nazwą (gdziekolwiek w drzewie), ma
    // pierwszeństwo: nie tworzymy obok niego duplikatu.
    const found = existing.get(nested.toLowerCase()) ?? existing.get(name.toLowerCase())
      ?? list.find((m) => m.name.trim().toLowerCase() === name.toLowerCase())?.path
    if (found) {
      resolved.set(name, found)
      continue
    }
    let createdPath: string | null = null
    const candidates = [nested, name]
    const siblingName = CREATE_NEXT_TO[name]
    const sibling = siblingName ? list.find((m) => m.name.trim().toLowerCase() === siblingName.toLowerCase()) : undefined
    if (sibling) {
      const d = sibling.delimiter || delimiter
      const parent = sibling.path.includes(d) ? sibling.path.slice(0, sibling.path.lastIndexOf(d)) : ''
      candidates.unshift(parent ? `${parent}${d}${name}` : name)
    }
    for (const candidate of candidates) {
      try {
        const res = await client.mailboxCreate(candidate)
        createdPath = res.path
        break
      } catch {
        // próbujemy kolejny wariant ścieżki
      }
    }
    if (!createdPath) throw new Error(`Nie udało się utworzyć folderu „${name}" w skrzynce.`)
    try {
      await client.mailboxSubscribe(createdPath)
    } catch {
      // subskrypcja jest opcjonalna: folder i tak istnieje
    }
    resolved.set(name, createdPath)
    list = await client.list()
  }

  const special = (flag: string, names: string[]) => {
    const bySpecial = list.find((m) => m.specialUse === flag)
    if (bySpecial) return bySpecial.path
    const lowered = names.map((n) => n.toLowerCase())
    const byName = list.find((m) => lowered.includes(m.name.toLowerCase()))
    return byName?.path ?? null
  }

  const categories = {} as Record<CategoryKey, string>
  for (const c of CATEGORIES) categories[c.key] = resolved.get(c.folder)!

  return {
    inbox: inboxEntry?.path ?? 'INBOX',
    sent: special('\\Sent', ['Sent', 'Sent Items', 'Sent Messages', 'Wysłane', 'Elementy wysłane']),
    review: resolved.get(REVIEW_FOLDER)!,
    categories,
  }
}

// Szuka istniejącego folderu po nazwie, bez tworzenia czegokolwiek.
export async function findFolder(client: ImapFlow, name: string): Promise<{ inbox: string; path: string | null; allNames: string[] }> {
  const list = await client.list()
  const wanted = name.trim().toLowerCase()
  const inbox = list.find((m) => m.path.toUpperCase() === 'INBOX')?.path ?? 'INBOX'
  const match = list.find((m) => m.name.trim().toLowerCase() === wanted) ?? list.find((m) => m.path.toLowerCase() === wanted)
  return { inbox, path: match?.path ?? null, allNames: list.map((m) => m.name) }
}

export async function listUids(client: ImapFlow, folder: string): Promise<number[]> {
  const lock = await client.getMailboxLock(folder)
  try {
    const uids = await client.search({ all: true }, { uid: true })
    return (uids || []).sort((a, b) => b - a) // najnowsze najpierw
  } finally {
    lock.release()
  }
}

const NO_REPLY_LOCAL = /^(no-?reply|do-?not-?reply|donotreply|nie-?odpowiadaj|mailer-daemon|postmaster|bounces?|notifications?|notify|newsletter|mailing|news|automat|system|alerts?)([+._-].*)?$/i

function firstAddress(value: unknown): MailAddress | null {
  const obj = value as { value?: { address?: string; name?: string }[] } | undefined
  const first = obj?.value?.find((v) => v.address)
  if (!first?.address) return null
  return { address: first.address.toLowerCase(), name: (first.name || '').trim() }
}

function headerText(headers: Map<string, unknown>, key: string): string {
  const v = headers.get(key)
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v !== null && 'text' in v) return String((v as { text: unknown }).text ?? '')
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

function detectAutomated(headers: Map<string, unknown>, from: MailAddress, ownAddress: string): string | null {
  if (headers.has(AGENT_HEADER.toLowerCase())) return 'wiadomość wysłana przez agenta'
  if (from.address === ownAddress.toLowerCase()) return 'nadawcą jest nasza własna skrzynka'
  const autoSubmitted = headerText(headers, 'auto-submitted').toLowerCase()
  if (autoSubmitted && autoSubmitted !== 'no') return 'autoresponder (Auto-Submitted)'
  const precedence = headerText(headers, 'precedence').toLowerCase()
  if (/bulk|list|junk|auto_reply/.test(precedence)) return 'wysyłka masowa (Precedence)'
  if (headers.has('list-id') || headers.has('list-unsubscribe')) return 'lista mailingowa'
  if (headers.has('x-autoreply') || headers.has('x-autorespond') || headers.has('x-auto-response-suppress')) return 'autoresponder'
  const local = from.address.split('@')[0] ?? ''
  if (NO_REPLY_LOCAL.test(local)) return 'adres typu no-reply'
  return null
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── Wykrywanie nagrań wideo ─────────────────────────────────────────────────

const VIDEO_EXT = /\.(mp4|m4v|mov|avi|wmv|webm|mkv|3gp|mpe?g|flv)$/i

// Serwisy, przez które kandydaci zwykle przysyłają swoje nagrania.
const VIDEO_HOSTS = [
  'youtube.com', 'youtu.be', 'vimeo.com', 'loom.com', 'drive.google.com', 'dropbox.com',
  'wetransfer.com', 'we.tl', '1drv.ms', 'onedrive.live.com', 'sharepoint.com', 'icloud.com',
  'streamable.com', 'wistia.com', 'vidyard.com', 'screencast.com', 'tiktok.com', 'veed.io',
]

// Fragmenty, po których serwer poczty wyszukuje kandydatów (wyszukiwanie po
// stronie serwera, bez pobierania wiadomości).
const VIDEO_SEARCH_TERMS = [
  'youtu', 'vimeo.com', 'loom.com', 'drive.google.com', 'dropbox.com', 'wetransfer', 'we.tl/',
  '1drv.ms', 'onedrive', 'streamable.com', 'wistia', 'vidyard', 'intro video', 'video intro',
  'introduction video', 'video introduction', 'introductory video', 'demo lesson', 'demo video',
  'nagranie', 'filmik', 'wideo',
]

export function videoParts(node: MessageStructureObject | undefined): string[] {
  const out: string[] = []
  const walk = (n: MessageStructureObject | undefined) => {
    if (!n) return
    const name = n.dispositionParameters?.filename || n.parameters?.name || ''
    if ((n.type || '').toLowerCase().startsWith('video/') || VIDEO_EXT.test(name)) {
      out.push(name || n.type)
    }
    for (const c of n.childNodes ?? []) walk(c)
  }
  walk(node)
  return out
}

export function extractVideoLinks(text: string): string[] {
  const urls = text.match(/https?:\/\/[^\s<>"')\]]+/gi) ?? []
  const found = new Set<string>()
  for (const raw of urls) {
    const url = raw.replace(/[.,;:!?]+$/, '')
    let host = ''
    try {
      host = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    } catch {
      continue
    }
    if (VIDEO_HOSTS.some((h) => host === h || host.endsWith(`.${h}`)) || VIDEO_EXT.test(new URL(url).pathname)) {
      found.add(url.length > 200 ? `${url.slice(0, 200)}…` : url)
    }
    if (found.size >= 8) break
  }
  return [...found]
}

// Maile w folderze, w których może być nagranie: wyszukiwanie po treści na
// serwerze plus struktura MIME (sam opis części, bez pobierania nagrań).
export async function findVideoCandidates(client: ImapFlow, folder: string): Promise<number[]> {
  const lock = await client.getMailboxLock(folder)
  try {
    const exists = client.mailbox && typeof client.mailbox === 'object' ? client.mailbox.exists : 0
    if (!exists) return []
    const uids = new Set<number>()
    const byText = await client.search(
      { or: [...VIDEO_SEARCH_TERMS.map((t) => ({ body: t })), { subject: 'video' }, { subject: 'intro' }] },
      { uid: true },
    )
    for (const u of byText || []) uids.add(u)
    const structures = await client.fetchAll('1:*', { uid: true, bodyStructure: true })
    for (const m of structures) if (videoParts(m.bodyStructure).length > 0) uids.add(m.uid)
    return [...uids].sort((a, b) => b - a)
  } finally {
    lock.release()
  }
}

// Pobiera wiadomości z folderu. `maxBytes` ucina źródło: do samego sortowania
// wystarcza początek treści, a załączników i tak nie analizujemy.
export async function fetchMails(
  client: ImapFlow,
  folder: string,
  uids: number[],
  maxBytes: number,
  ownAddress: string,
): Promise<FetchedMail[]> {
  if (uids.length === 0) return []
  const lock = await client.getMailboxLock(folder)
  try {
    const raw = await client.fetchAll(
      uids.join(','),
      { uid: true, flags: true, internalDate: true, envelope: true, bodyStructure: true, source: { start: 0, maxLength: maxBytes } },
      { uid: true },
    )
    const out: FetchedMail[] = []
    for (const msg of raw) {
      if (!msg.source) continue
      try {
        const parsed = await simpleParser(msg.source, { skipImageLinks: true })
        const headers = parsed.headers as Map<string, unknown>
        const envFrom = msg.envelope?.from?.[0]
        const from = firstAddress(parsed.from) ?? {
          address: (envFrom?.address || 'nieznany@nieznany').toLowerCase(),
          name: envFrom?.name || '',
        }
        const refs = parsed.references
        const date = parsed.date ?? (msg.internalDate instanceof Date ? msg.internalDate : new Date(msg.internalDate ?? Date.now()))
        const messageId = (parsed.messageId || msg.envelope?.messageId || '').trim()
          // Wiadomość bez Message-ID nadal trzeba jednoznacznie rozpoznać.
          || `<brak-id-${from.address}-${date.getTime()}@agent-skrzynki>`
        const automatedReason = detectAutomated(headers, from, ownAddress)
        out.push({
          uid: msg.uid,
          messageId,
          from,
          replyTo: firstAddress(parsed.replyTo),
          to: headerText(headers, 'to'),
          subject: (parsed.subject || msg.envelope?.subject || '(bez tematu)').trim(),
          date,
          flags: msg.flags ?? new Set<string>(),
          text: cleanText(parsed.text || ''),
          inReplyTo: parsed.inReplyTo || null,
          references: Array.isArray(refs) ? refs : refs ? [refs] : [],
          attachmentNames: (parsed.attachments || []).map((a) => a.filename || 'załącznik').slice(0, 10),
          videoAttachments: videoParts(msg.bodyStructure).slice(0, 10),
          videoLinks: extractVideoLinks(`${parsed.text || ''}\n${typeof parsed.html === 'string' ? parsed.html : ''}`),
          automated: automatedReason !== null,
          automatedReason,
        })
      } catch (err) {
        console.error(`[AgentSkrzynki] Nie udało się odczytać wiadomości uid=${msg.uid}:`, (err as Error).message)
      }
    }
    return out.sort((a, b) => b.date.getTime() - a.date.getTime())
  } finally {
    lock.release()
  }
}

export async function moveMail(client: ImapFlow, fromFolder: string, uid: number, toFolder: string): Promise<boolean> {
  if (fromFolder === toFolder) return true
  const lock = await client.getMailboxLock(fromFolder)
  try {
    const res = await client.messageMove(String(uid), toFolder, { uid: true })
    return !!res
  } finally {
    lock.release()
  }
}

export async function markAnswered(client: ImapFlow, folder: string, uid: number): Promise<void> {
  const lock = await client.getMailboxLock(folder)
  try {
    await client.messageFlagsAdd(String(uid), ['\\Answered', '\\Seen'], { uid: true })
  } finally {
    lock.release()
  }
}

// Wiadomość po przeniesieniu dostaje nowy UID, a człowiek mógł ją w
// międzyczasie przełożyć ręcznie. Dlatego zawsze szukamy po Message-ID.
export async function findByMessageId(
  client: ImapFlow,
  folder: string,
  messageId: string,
): Promise<{ uid: number; flags: Set<string> } | null> {
  const lock = await client.getMailboxLock(folder)
  try {
    const uids = await client.search({ header: { 'message-id': messageId } }, { uid: true })
    if (!uids || uids.length === 0) return null
    const uid = uids[uids.length - 1]
    const msg = await client.fetchOne(String(uid), { uid: true, flags: true }, { uid: true })
    return { uid, flags: msg ? msg.flags ?? new Set<string>() : new Set<string>() }
  } finally {
    lock.release()
  }
}

// Ostatnie wiadomości z „Wysłanych": cała historia odpowiedzi (do nauki stylu
// i faktów) albo tylko korespondencja z jednym adresem (kontekst rozmowy).
export async function recentSent(
  client: ImapFlow,
  sentFolder: string,
  opts: { toAddress?: string; limit: number; maxBytes: number },
  ownAddress: string,
): Promise<FetchedMail[]> {
  const lock = await client.getMailboxLock(sentFolder)
  let uids: number[]
  try {
    const found = await client.search(opts.toAddress ? { to: opts.toAddress } : { all: true }, { uid: true })
    uids = (found || []).sort((a, b) => b - a).slice(0, opts.limit)
  } finally {
    lock.release()
  }
  return fetchMails(client, sentFolder, uids, opts.maxBytes, ownAddress)
}

export type OutgoingReply = {
  to: string
  subject: string
  text: string
  html: string
  inReplyTo: string | null
  references: string[]
}

function buildRaw(cfg: InboxConfig, reply: OutgoingReply): Promise<Buffer> {
  const composer = new MailComposer({
    from: { name: cfg.fromName, address: cfg.user },
    to: reply.to,
    subject: reply.subject,
    text: reply.text,
    html: reply.html,
    inReplyTo: reply.inReplyTo ?? undefined,
    references: reply.references.length ? reply.references : undefined,
    headers: { [AGENT_HEADER]: '1' },
  })
  return composer.compile().build()
}

// Wysyła odpowiedź przez SMTP skrzynki i odkłada kopię do „Wysłanych".
export async function sendReply(client: ImapFlow, cfg: InboxConfig, folders: FolderMap, reply: OutgoingReply): Promise<void> {
  const raw = await buildRaw(cfg, reply)
  const transporter = nodemailer.createTransport({
    host: cfg.smtpHost,
    port: cfg.smtpPort,
    secure: cfg.smtpPort === 465,
    auth: { user: cfg.user, pass: cfg.password },
    connectionTimeout: 20_000,
    socketTimeout: 60_000,
  })
  await transporter.sendMail({ envelope: { from: cfg.user, to: reply.to }, raw })
  if (folders.sent) {
    try {
      await client.append(folders.sent, raw, ['\\Seen'])
    } catch (err) {
      // Mail już poszedł. Brak kopii w „Wysłanych" to kosmetyka, nie awaria.
      console.error('[AgentSkrzynki] Nie udało się zapisać kopii w Wysłanych:', (err as Error).message)
    }
  }
}

export function replySubject(subject: string): string {
  return /^\s*(re|odp)\s*:/i.test(subject) ? subject : `Re: ${subject}`
}

// Treść odpowiedzi z podpisem i cytatem oryginału, jak w zwykłej odpowiedzi
// pisanej z programu pocztowego. Dwie wersje: HTML (z podpisem marki: logo,
// strona, media społecznościowe) i zwykły tekst.
export function composeReply(
  body: string,
  signatureName: string,
  original: { from: MailAddress; date: Date; text: string },
): { text: string; html: string } {
  const trimmed = body.trim()
  // Odpowiedź po polsku dostaje polski nagłówek cytatu, każda inna angielski.
  const polish = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(trimmed)
  const when = original.date.toLocaleString(polish ? 'pl-PL' : 'en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Warsaw' })
  const who = original.from.name ? `${original.from.name} <${original.from.address}>` : original.from.address
  const quoteHeader = polish ? `W dniu ${when} ${who} napisał(a):` : `On ${when}, ${who} wrote:`
  const originalText = original.text.slice(0, 6000)

  const text = `${trimmed}\n\n${signatureText(signatureName)}\n\n${quoteHeader}\n${originalText.split('\n').map((l) => `> ${l}`).join('\n')}\n`

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;">${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f2937;">
${paragraphs}
${signatureHtml(signatureName)}
<div style="margin-top:26px;font-size:13px;color:#6b7280;">${escapeHtml(quoteHeader)}</div>
<blockquote style="margin:6px 0 0;padding:0 0 0 12px;border-left:3px solid #e5e7eb;color:#6b7280;font-size:13px;">${escapeHtml(originalText).replace(/\n/g, '<br>')}</blockquote>
</div></body></html>`

  return { text, html }
}

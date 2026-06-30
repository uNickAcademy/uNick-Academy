/**
 * GUS REGON (BIR1.1) lookup — fetches a company's official registry data
 * (name, REGON, address) by NIP. Requires GUS_API_KEY env var (free key from
 * https://api.stat.gov.pl/Home/RegonApi). If unset, isGusConfigured() returns
 * false and callers should degrade gracefully.
 */

import { XMLParser } from 'fast-xml-parser'

const PROD_URL = 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc'
const NS = 'http://CIS/BIR/PUBL/2014/07'
const ACTION_BASE = 'http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl'

const parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: true })

export function isGusConfigured(): boolean {
  return !!process.env.GUS_API_KEY
}

function getServiceUrl(): string {
  return process.env.GUS_API_URL || PROD_URL
}

async function soapRequest(action: string, bodyXml: string, sid?: string): Promise<string> {
  const serviceUrl = getServiceUrl()
  const envelope =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://www.w3.org/2005/08/addressing">` +
    `<soap:Header><wsa:To>${serviceUrl}</wsa:To><wsa:Action>${ACTION_BASE}/${action}</wsa:Action></soap:Header>` +
    `<soap:Body>${bodyXml}</soap:Body>` +
    `</soap:Envelope>`

  const headers: Record<string, string> = {
    'Content-Type': `application/soap+xml; charset=utf-8; action="${ACTION_BASE}/${action}"`,
  }
  if (sid) headers['sid'] = sid

  const res = await fetch(serviceUrl, { method: 'POST', headers, body: envelope })
  const text = await res.text()
  if (!res.ok) throw new Error(`GUS ${action}: błąd ${res.status}`)
  return text
}

async function login(key: string): Promise<string> {
  const body = `<Zaloguj xmlns="${NS}"><pKluczUzytkownika>${key}</pKluczUzytkownika></Zaloguj>`
  const xml = await soapRequest('Zaloguj', body)
  const parsed = parser.parse(xml)
  const sid = parsed?.Envelope?.Body?.ZalogujResponse?.ZalogujResult
  if (!sid) throw new Error('GUS: logowanie nie powiodło się — sprawdź GUS_API_KEY')
  return String(sid)
}

async function logout(sid: string): Promise<void> {
  const body = `<Wyloguj xmlns="${NS}"><pIdentyfikatorSesji>${sid}</pIdentyfikatorSesji></Wyloguj>`
  await soapRequest('Wyloguj', body, sid)
}

export interface GusCompany {
  name: string
  nip: string
  regon: string | null
  address: {
    street: string | null
    city: string | null
    postal_code: string | null
    country: string
  }
}

export async function lookupByNip(nip: string): Promise<GusCompany> {
  const key = process.env.GUS_API_KEY
  if (!key) throw new Error('Wyszukiwanie GUS nie jest skonfigurowane (brak GUS_API_KEY)')

  const cleanNip = nip.replace(/[^0-9]/g, '')
  if (cleanNip.length !== 10) throw new Error('Podaj poprawny NIP (10 cyfr)')

  const sid = await login(key)
  try {
    const body =
      `<DaneSzukajPodmioty xmlns="${NS}">` +
      `<pParametryWyszukiwania xmlns:dat="${NS}/DataContract"><dat:Nip>${cleanNip}</dat:Nip></pParametryWyszukiwania>` +
      `</DaneSzukajPodmioty>`
    const xml = await soapRequest('DaneSzukajPodmioty', body, sid)
    const parsed = parser.parse(xml)
    const resultXml = parsed?.Envelope?.Body?.DaneSzukajPodmiotyResponse?.DaneSzukajPodmiotyResult
    if (!resultXml) throw new Error('GUS: brak odpowiedzi z usługi')

    const inner = parser.parse(String(resultXml))
    const dane = inner?.root?.dane
    if (!dane) throw new Error('Nie znaleziono podmiotu o podanym NIP w bazie GUS')

    const street = [dane.Ulica, dane.NrNieruchomosci].filter(Boolean).join(' ')
    const fullStreet = dane.NrLokalu ? `${street}/${dane.NrLokalu}` : street

    return {
      name: String(dane.Nazwa ?? '').trim(),
      nip: String(dane.Nip ?? cleanNip),
      regon: dane.Regon ? String(dane.Regon) : null,
      address: {
        street: fullStreet || null,
        city: dane.Miejscowosc ? String(dane.Miejscowosc) : null,
        postal_code: dane.KodPocztowy ? String(dane.KodPocztowy) : null,
        country: 'Polska',
      },
    }
  } finally {
    await logout(sid).catch(() => { /* best-effort */ })
  }
}

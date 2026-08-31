'use client'

import { useState } from 'react'
import { RotateCcw, Send, Mail } from 'lucide-react'

type Tryb = 'pierwszy' | 'przypomnienie'

type Preview = {
  tryb: Tryb
  doWyslania: number
  wTejPartii: number
  uwaga: string | null
  pominieto: {
    b2b: number
    juzSieZalogowali: number
    majaZaplanowaneLekcje: number
    brakMaila: number
    wypisaniZWysylek: number
    juzWyslane: number
    bezPierwszejWiadomosci: number
    rodzenstwoPodTymSamymAdresem: number
  }
  odbiorcy: { email: string; imie: string; kod: string }[]
  podgladTematu: string | null
}

const OPISY: Record<Tryb, { etykieta: string; opis: string }> = {
  pierwszy: {
    etykieta: 'Pierwsza wiadomość',
    opis: 'Do osób, które nie dostały jeszcze od nas nic o nowej platformie.',
  },
  przypomnienie: {
    etykieta: 'Przypomnienie',
    opis: 'Do tych, którzy dostali pierwszą wiadomość i mimo to nigdy się nie zalogowali.',
  },
}

async function callComeback(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/communication/comeback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Nie udało się')
  return data
}

export function ComebackCampaign() {
  const [tryb, setTryb] = useState<Tryb>('pierwszy')

  const [loadingPreview, setLoadingPreview] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [testTo, setTestTo] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const [sendingAll, setSendingAll] = useState(false)
  const [postep, setPostep] = useState<string | null>(null)
  const [sendResult, setSendResult] = useState<string | null>(null)

  function zmienTryb(nowy: Tryb) {
    setTryb(nowy)
    // Podgląd dotyczy konkretnego trybu. Zostawiony na ekranie po przełączeniu
    // pokazywałby liczby z poprzedniej listy, a przycisk wysyłki działałby już
    // na innej — to najprostszy sposób, żeby wysłać nie to, co się widzi.
    setPreview(null)
    setSendResult(null)
    setPostep(null)
  }

  async function handlePreview() {
    setLoadingPreview(true); setPreviewError(null); setSendResult(null); setPostep(null)
    try {
      const data = await callComeback({ tryb })
      setPreview(data)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Błąd')
    } finally {
      setLoadingPreview(false)
    }
  }

  async function handleSendTest() {
    if (!testTo.trim()) { setTestResult('Podaj adres e-mail.'); return }
    setSendingTest(true); setTestResult(null)
    try {
      const data = await callComeback({ testTo: testTo.trim(), tryb })
      setTestResult(`Wysłano na ${data.wyslanoNa} (kod testowy: ${data.uzytyKod}). Sprawdź skrzynkę.`)
    } catch (err) {
      setTestResult('Błąd: ' + (err instanceof Error ? err.message : 'nie udało się'))
    } finally {
      setSendingTest(false)
    }
  }

  async function handleSendAll() {
    if (!preview) return
    if (!confirm(`Wysłać do ${preview.doWyslania} odbiorców? Tej operacji nie można cofnąć.`)) return

    setSendingAll(true); setSendResult(null); setPostep(null)

    // Serwer wysyła partiami, bo Resend ma limit wiadomości na sekundę,
    // a funkcja na Vercelu limit czasu. Klikamy raz, a przeglądarka dowozi
    // kolejne partie, aż lista się skończy.
    let wyslane = 0
    const nieudane: string[] = []
    try {
      for (let partia = 0; partia < 30; partia++) {
        const data = await callComeback({ confirm: true, tryb })
        wyslane += data.wyslano as number
        nieudane.push(...(data.nieudane as string[]))
        setPostep(`Wysłano ${wyslane} z ${preview.doWyslania}...`)
        if ((data.zostalo as number) <= 0) break
      }
      setSendResult(
        `Wysłano: ${wyslane}. Nieudane: ${nieudane.length}` +
        (nieudane.length ? ` (${nieudane.slice(0, 5).join(', ')}${nieudane.length > 5 ? ' i inne' : ''})` : '') + '.'
      )
      setPreview(null)
    } catch (err) {
      setSendResult(
        `Przerwane po ${wyslane} wysłanych: ` + (err instanceof Error ? err.message : 'nie udało się') +
        ' Kliknij „Podgląd odbiorców" i wyślij ponownie, żeby dokończyć resztę listy.'
      )
    } finally {
      setPostep(null)
      setSendingAll(false)
    }
  }

  const p = preview?.pominieto

  return (
    <div className="mt-10 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-1"><RotateCcw size={18} />Kampania „powrót"</h2>
      <p className="text-sm text-gray-500 mb-5">
        Mail do nieaktywnych uczniów indywidualnych: nowa platforma i osobisty kod polecenia.
        Jeden adres dostaje jedną wiadomość, nawet gdy ma u nas dwoje dzieci. Klienci B2B,
        osoby już zalogowane i wypisane z wysyłek są pomijane zawsze.
      </p>

      <div className="flex flex-wrap gap-2 mb-2">
        {(Object.keys(OPISY) as Tryb[]).map((t) => (
          <button
            key={t}
            onClick={() => zmienTryb(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              tryb === t
                ? 'bg-[#1E3282] text-white border-[#1E3282]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {OPISY[t].etykieta}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mb-6">{OPISY[tryb].opis}</p>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={handlePreview} disabled={loadingPreview}
            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60">
            {loadingPreview ? 'Ładowanie...' : 'Podgląd odbiorców'}
          </button>
        </div>

        {previewError && <div className="text-sm text-[#B4321E] bg-red-50 rounded-xl px-4 py-3">{previewError}</div>}

        {preview && p && (
          <div className="text-sm text-[#1E3282] bg-[#EAF3FF] rounded-xl px-4 py-3 space-y-1">
            <p>Do wysłania: <strong>{preview.doWyslania}</strong> adresów.</p>
            <p className="text-xs opacity-80">
              Pominięci — B2B: {p.b2b}, już zalogowani: {p.juzSieZalogowali},
              aktywni: {p.majaZaplanowaneLekcje}, bez maila: {p.brakMaila},
              wypisani: {p.wypisaniZWysylek}, już wysłane: {p.juzWyslane},
              rodzeństwo pod tym samym adresem: {p.rodzenstwoPodTymSamymAdresem}
              {tryb === 'przypomnienie' ? `, bez pierwszej wiadomości: ${p.bezPierwszejWiadomosci}` : ''}.
            </p>
            {preview.uwaga && <p className="text-xs text-[#B4321E] font-semibold">{preview.uwaga}</p>}
            {preview.podgladTematu && <p className="text-xs opacity-80">Temat: „{preview.podgladTematu}"</p>}
          </div>
        )}

        <div className="flex gap-2 items-stretch">
          <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="twoj@email.com"
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1E3282]" />
          <button onClick={handleSendTest} disabled={sendingTest}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap">
            <Mail size={16} />{sendingTest ? 'Wysyłanie...' : 'Wyślij test'}
          </button>
        </div>
        {testResult && <div className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3">{testResult}</div>}
        <p className="text-xs text-gray-400">
          Test nie zużywa odbiorcy z listy kampanii, więc nie blokuje nikomu właściwej wysyłki.
        </p>

        {preview && (
          <button onClick={handleSendAll} disabled={sendingAll || preview.doWyslania === 0}
            className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
            <Send size={16} />{sendingAll ? (postep ?? 'Wysyłanie...') : `Wyślij do wszystkich (${preview.doWyslania})`}
          </button>
        )}
        {sendResult && <div className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3">{sendResult}</div>}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { RotateCcw, Send, Mail } from 'lucide-react'

type Preview = {
  doWyslania: number
  uwaga: string | null
  pominieto: { b2b: number; majaZaplanowaneLekcje: number; brakMaila: number; juzWyslane: number }
  odbiorcy: { email: string; imie: string; kod: string }[]
  podgladTematu: string | null
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
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [testTo, setTestTo] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  const [sendingAll, setSendingAll] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  async function handlePreview() {
    setLoadingPreview(true); setPreviewError(null); setSendResult(null)
    try {
      const data = await callComeback({})
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
      const data = await callComeback({ testTo: testTo.trim() })
      setTestResult(`✅ Wysłano na ${data.wyslanoNa} (kod testowy: ${data.uzytyKod}). Sprawdź skrzynkę.`)
    } catch (err) {
      setTestResult('Błąd: ' + (err instanceof Error ? err.message : 'nie udało się'))
    } finally {
      setSendingTest(false)
    }
  }

  async function handleSendAll() {
    if (!preview) return
    if (!confirm(`Wysłać do ${preview.doWyslania} odbiorców? Tej operacji nie można cofnąć.`)) return
    setSendingAll(true); setSendResult(null)
    try {
      const data = await callComeback({ confirm: true })
      setSendResult(`✅ Wysłano: ${data.wyslano}. Nieudane: ${data.nieudane.length}.`)
      setPreview(null)
    } catch (err) {
      setSendResult('Błąd: ' + (err instanceof Error ? err.message : 'nie udało się'))
    } finally {
      setSendingAll(false)
    }
  }

  return (
    <div className="mt-10 pt-8 border-t border-gray-200">
      <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-1"><RotateCcw size={18} />Kampania „powrót"</h2>
      <p className="text-sm text-gray-500 mb-6">
        Mail do nieaktywnych uczniów: nowa platforma + osobisty kod polecenia. Wysyła się tylko raz na osobę
        (pomija już wysłanych, aktywnych i klientów B2B).
      </p>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button onClick={handlePreview} disabled={loadingPreview}
            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-60">
            {loadingPreview ? 'Ładowanie...' : 'Podgląd odbiorców'}
          </button>
        </div>

        {previewError && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{previewError}</div>}

        {preview && (
          <div className="text-sm text-[#1E3282] bg-[#EAF3FF] rounded-xl px-4 py-3 space-y-1">
            <p>Do wysłania: <strong>{preview.doWyslania}</strong> odbiorców.</p>
            <p className="text-xs opacity-80">
              Pominięci — B2B: {preview.pominieto.b2b}, aktywni: {preview.pominieto.majaZaplanowaneLekcje},
              bez maila: {preview.pominieto.brakMaila}, już wysłane: {preview.pominieto.juzWyslane}.
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
            <Send size={16} />{sendingAll ? 'Wysyłanie...' : `Wyślij do wszystkich (${preview.doWyslania})`}
          </button>
        )}
        {sendResult && <div className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-3">{sendResult}</div>}
      </div>
    </div>
  )
}

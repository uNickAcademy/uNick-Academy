import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Bot, AlertTriangle, TrendingUp, Users } from "lucide-react"
import { formatPLN, formatPercent, formatMonth } from "@/lib/ufos/formatters"
import { AiCfoChat } from "./AiCfoChat"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "AI CFO" }

export default async function AiCfoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const currentMonth = new Date()
  currentMonth.setDate(1)
  const currentMonthStr = currentMonth.toISOString().slice(0, 10)

  const { data: monthStats } = await supabase
    .schema("ufos")
    .from("monthly_summary")
    .select("total_revenue, total_margin, avg_margin_pct, completed_lessons")
    .eq("period", currentMonthStr)
    .single()

  const hasApiKey = !!process.env.ANTHROPIC_API_KEY

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy-500 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-500">AI CFO</h1>
            <p className="text-sm text-brand-subtle">Asystent finansowy · {formatMonth(currentMonthStr)}</p>
          </div>
        </div>
      </div>

      {/* Ostrzeżenie o ograniczeniach AI */}
      <div className="card border-l-4 border-l-brand-amber mb-6 py-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-brand-amber shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-navy-500">AI CFO jest doradcą, nie decydentem</p>
            <p className="text-xs text-brand-subtle mt-0.5">
              Nie może: wykonywać przelewów · wysyłać deklaracji · zamykać miesiąca · zmieniać danych historycznych · podejmować decyzji podatkowych
            </p>
          </div>
        </div>
      </div>

      {!hasApiKey && (
        <div className="card border border-dashed border-brand-amber mb-6 py-5">
          <div className="text-center">
            <p className="text-sm font-medium text-navy-500 mb-1">Klucz API Anthropic nie jest skonfigurowany</p>
            <p className="text-xs text-brand-subtle">
              Dodaj <code className="bg-brand-muted px-1 rounded">ANTHROPIC_API_KEY</code> do zmiennych środowiskowych Vercel, aby aktywować AI CFO.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kontekst finansowy */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-brand-subtle uppercase tracking-wide">
            Kontekst finansowy
          </h2>
          <div className="card py-4">
            <p className="text-xs text-brand-subtle mb-1">Przychody</p>
            <p className="text-lg font-bold text-navy-500">
              {formatPLN(Number(monthStats?.total_revenue ?? 0))}
            </p>
          </div>
          <div className="card py-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-brand-green" />
              <p className="text-xs text-brand-subtle">Marża brutto</p>
            </div>
            <p className="text-lg font-bold text-brand-green">
              {formatPLN(Number(monthStats?.total_margin ?? 0))}
            </p>
            <p className="text-xs text-brand-subtle">
              {formatPercent(Number(monthStats?.avg_margin_pct ?? 0))}
            </p>
          </div>
          <div className="card py-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-3.5 h-3.5 text-navy-400" />
              <p className="text-xs text-brand-subtle">Lekcje</p>
            </div>
            <p className="text-lg font-bold text-navy-500">
              {monthStats?.completed_lessons ?? 0}
            </p>
          </div>

          <div className="card py-4 bg-brand-muted">
            <p className="text-xs font-medium text-navy-500 mb-2">Przykładowe pytania</p>
            <ul className="space-y-1.5 text-xs text-brand-subtle">
              <li>• Kto generuje najwyższą marżę?</li>
              <li>• Co zagraża przychodom?</li>
              <li>• Jak porównać do poprzedniego miesiąca?</li>
              <li>• Co zrobić z zaległościami uczniów?</li>
            </ul>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 card">
          <AiCfoChat />
        </div>
      </div>
    </div>
  )
}

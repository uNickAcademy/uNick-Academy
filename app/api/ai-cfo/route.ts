import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, convertToCoreMessages } from "ai"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const maxDuration = 30

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      error: "ANTHROPIC_API_KEY nie jest skonfigurowany"
    }, { status: 503 })
  }

  const { messages } = await req.json()

  // Zbierz kontekst finansowy
  const currentMonth = new Date()
  currentMonth.setDate(1)
  const currentMonthStr = currentMonth.toISOString().slice(0, 10)

  const [{ data: monthStats }, { data: teacherStats }, { data: debtors }] = await Promise.all([
    supabase.schema("ufos").from("monthly_summary")
      .select("*").eq("period", currentMonthStr).single(),
    supabase.schema("ufos").from("teacher_profitability")
      .select("teacher_name, completed_lessons, revenue_generated, total_cost, total_margin, margin_pct")
      .eq("period", currentMonthStr).order("total_margin", { ascending: false }),
    supabase.schema("ufos").from("students_with_debt")
      .select("student_name, credit_balance, teacher_name")
      .lt("credit_balance", 0).order("credit_balance", { ascending: true }).limit(10),
  ])

  const totalDebt = (debtors ?? []).reduce((s, d) => s + Math.abs(Number(d.credit_balance) || 0), 0)

  const systemPrompt = `Jesteś uFOS AI CFO — asystentem finansowym dla uNick Academy Group.
Dziś jest ${new Date().toLocaleDateString("pl-PL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

=== DANE FINANSOWE (${currentMonthStr}) ===

Podsumowanie miesiąca:
- Lekcje zrealizowane: ${monthStats?.completed_lessons ?? 0}
- Lekcje zaplanowane: ${monthStats?.upcoming_lessons ?? 0}
- Lekcje odwołane: ${monthStats?.missed_lessons ?? 0}
- Przychody: ${Number(monthStats?.total_revenue ?? 0).toFixed(2)} PLN
- Koszty nauczycieli: ${Number(monthStats?.total_teacher_cost ?? 0).toFixed(2)} PLN
- Marża brutto: ${Number(monthStats?.total_margin ?? 0).toFixed(2)} PLN
- Średnia marża %: ${Number(monthStats?.avg_margin_pct ?? 0).toFixed(1)}%

Rentowność nauczycieli:
${(teacherStats ?? []).map(t =>
  `- ${t.teacher_name}: ${t.completed_lessons} lekcji, przychód ${Number(t.revenue_generated ?? 0).toFixed(0)} PLN, koszt ${Number(t.total_cost ?? 0).toFixed(0)} PLN, marża ${Number(t.total_margin ?? 0).toFixed(0)} PLN (${Number(t.margin_pct ?? 0).toFixed(1)}%)`
).join("\n") || "- Brak danych"}

Zaległości płatnicze (${(debtors ?? []).length} uczniów, łącznie ${totalDebt.toFixed(0)} PLN):
${(debtors ?? []).map(d => `- ${d.student_name}: ${Number(d.credit_balance).toFixed(0)} PLN`).join("\n") || "- Brak zaległości"}

=== ZASADY AI ===
NIGDY nie możesz:
- wykonywać przelewów ani inicjować płatności
- wysyłać deklaracji podatkowych
- zamykać miesiąca bez zatwierdzenia przez CFO
- zmieniać danych historycznych
- podejmować autonomicznych decyzji podatkowych
- trwale usuwać dokumentów

ZAWSZE:
- Odpowiadasz po polsku
- Podajesz rekomendacje z wyjaśnieniem
- Zaznaczasz że decyzja należy do CFO
- Cytuj konkretne liczby z kontekstu

Bądź zwięzły, konkretny i pomocny.`.trim()

  const anthropic = createAnthropic({ apiKey })

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: convertToCoreMessages(messages),
  })

  return result.toDataStreamResponse()
}

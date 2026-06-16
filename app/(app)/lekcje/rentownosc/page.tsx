import type { Metadata } from "next"
import { TrendingUp, ArrowDownToLine } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export const metadata: Metadata = { title: "Rentowność kursów" }

export default function RentownoscPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-500">Rentowność kursów</h1>
        <p className="text-sm text-brand-subtle mt-1">
          Marże brutto, koszty nauczycieli i przychody per kurs i grupa
        </p>
      </div>

      <div className="card">
        <EmptyState
          icon={TrendingUp}
          title="Brak danych do analizy"
          description="Zaimportuj dane lekcyjne, aby zobaczyć rentowność per kurs, grupę i nauczyciela."
          action={
            <a href="/import" className="btn-primary">
              <ArrowDownToLine className="w-4 h-4" />
              Importuj dane
            </a>
          }
        />
      </div>
    </div>
  )
}

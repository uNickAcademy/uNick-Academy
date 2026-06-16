import type { Metadata } from "next"
import { BookOpen, ArrowDownToLine } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export const metadata: Metadata = { title: "Lekcje" }

export default function LekcjePage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-navy-500">Lekcje</h1>
          <p className="text-sm text-brand-subtle mt-1">
            Przegląd wszystkich lekcji, grup i kursów
          </p>
        </div>
        <a href="/import" className="btn-primary">
          <ArrowDownToLine className="w-4 h-4" />
          Importuj dane
        </a>
      </div>

      <div className="card">
        <EmptyState
          icon={BookOpen}
          title="Brak danych lekcyjnych"
          description="Zaimportuj dane z aplikacji uNick Academy, aby zobaczyć historię lekcji, grupy i kursy."
          action={
            <a href="/import" className="btn-primary">
              Rozpocznij import
            </a>
          }
        />
      </div>
    </div>
  )
}

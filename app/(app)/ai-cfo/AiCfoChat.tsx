"use client"

import { useChat } from "@ai-sdk/react"
import { Send, Bot, User, AlertTriangle } from "lucide-react"
import { useRef, useEffect } from "react"

const SUGGESTED_QUESTIONS = [
  "Jak wygląda marżowość w tym miesiącu?",
  "Którzy nauczyciele generują najniższy zysk?",
  "Ile wynoszą łączne zaległości uczniów?",
  "Co powinienem sprawdzić przed zamknięciem miesiąca?",
]

export function AiCfoChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/ai-cfo",
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-[600px]">
      {/* Wiadomości */}
      <div className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 text-navy-300 mx-auto mb-3" />
            <p className="text-sm text-brand-subtle mb-1">Zadaj pytanie finansowe</p>
            <p className="text-xs text-brand-subtle">AI analizuje dane z bieżącego miesiąca</p>

            <div className="mt-6 space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleInputChange({ target: { value: q } } as React.ChangeEvent<HTMLInputElement>)}
                  className="block w-full text-left text-sm px-4 py-2.5 rounded-lg border border-[#E8EBF0] hover:bg-brand-muted/60 hover:border-navy-200 text-navy-500 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-navy-500 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-navy-500 text-white"
                  : "bg-brand-muted text-navy-500 border border-[#E8EBF0]"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-brand-muted border border-[#E8EBF0] flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-navy-400" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-navy-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-brand-muted border border-[#E8EBF0] rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-navy-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-navy-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-navy-300 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-brand-red">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              {error.message.includes("ANTHROPIC_API_KEY") || error.message.includes("503")
                ? "Klucz API Anthropic nie jest skonfigurowany. Dodaj ANTHROPIC_API_KEY do zmiennych środowiskowych."
                : "Błąd połączenia z AI. Spróbuj ponownie."}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E8EBF0] pt-4 mt-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Zapytaj o dane finansowe..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-[#E8EBF0] rounded-lg text-sm text-navy-500 placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn-primary text-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-brand-subtle mt-2 text-center">
          AI CFO jest doradcą — wszelkie decyzje wymagają zatwierdzenia przez CFO.
        </p>
      </div>
    </div>
  )
}

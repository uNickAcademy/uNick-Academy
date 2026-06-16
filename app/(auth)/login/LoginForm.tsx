"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function LoginForm() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError("Nieprawidłowy email lub hasło.")
      setLoading(false)
      return
    }

    router.push("/dashboard/cfo")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy-500 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 bg-white placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors"
          placeholder="milena@unick-academy.pl"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-navy-500 mb-1">
          Hasło
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-[#E8EBF0] rounded-md text-sm text-navy-500 bg-white placeholder:text-brand-subtle focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-brand-red">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary justify-center py-2.5"
      >
        {loading ? "Logowanie…" : "Zaloguj się"}
      </button>
    </form>
  )
}

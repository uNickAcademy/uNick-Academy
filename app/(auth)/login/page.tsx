import { LoginForm } from "./LoginForm"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Logowanie" }

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-navy-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">u</span>
            </div>
            <div>
              <div className="text-xl font-bold text-navy-500">uFOS</div>
              <div className="text-xs text-brand-subtle -mt-0.5">Financial Operating System</div>
            </div>
          </div>
        </div>

        {/* Karta logowania */}
        <div className="card">
          <h1 className="text-xl font-semibold text-navy-500 mb-1">Zaloguj się</h1>
          <p className="text-sm text-brand-subtle mb-6">
            Wewnętrzny system finansowy grupy uNick Academy
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-xs text-brand-subtle mt-6">
          uNick Academy Group © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

import { Poppins, Lora } from 'next/font/google'
import './tp.css'
import { TpAnalytics } from '@/components/teenpreneurs/TpAnalytics'

// Sub-brand fonts, loaded only for /teenpreneurs so the rest of the
// platform keeps its own typography and bundle.
const poppins = Poppins({
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

const lora = Lora({
  variable: '--font-lora',
  style: ['normal', 'italic'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export default function TeenpreneursLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`tp-root min-h-screen ${poppins.variable} ${lora.variable}`}>
      {children}
      <TpAnalytics />
    </div>
  )
}

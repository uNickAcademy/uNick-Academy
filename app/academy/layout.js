import { Poppins, Lora } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-poppins',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
})

export const metadata = {
  title: 'uNick Teachers Academy',
  description:
    'A growing library of ESL/EFL lesson plans for English teachers worldwide, created by Nick Rudd.',
}

export default function AcademyLayout({ children }) {
  return (
    <div
      className={`${poppins.variable} ${lora.variable} font-body bg-white text-navy min-h-screen flex flex-col`}
    >
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

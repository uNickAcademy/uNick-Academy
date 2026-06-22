import './globals.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

export const metadata = {
  title: 'uNick Teachers Academy',
  description:
    'A growing library of ESL/EFL lesson plans for English teachers worldwide, created by Nick Rudd.',
}

export default function AcademyLayout({ children }) {
  return (
    <div className="academy-shell font-body bg-warm-white text-ink min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <span className="text-2xl font-black text-[#23479E]">
            uNick Academy
          </span>
          <p className="mt-3 text-sm leading-relaxed">
            Szkoła języka angielskiego z sercem. Uczymy skutecznie, bo sami uwielbiamy angielski.
          </p>
          <p className="mt-4 text-sm">
            <a href="mailto:hello@unick-academy.pl" className="hover:text-white transition-colors">
              hello@unick-academy.pl
            </a>
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Oferta</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dla-siebie" className="hover:text-white transition-colors">Dla siebie</Link></li>
            <li><Link href="/dla-firm" className="hover:text-white transition-colors">Dla firm</Link></li>
            <li><Link href="/nauczyciele" className="hover:text-white transition-colors">Nauczyciele</Link></li>
            <li><Link href="/zapisy" className="hover:text-white transition-colors">Zapisz się</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Informacje</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            <li><Link href="/kontakt" className="hover:text-white transition-colors">Kontakt</Link></li>
            <li><Link href="/polityka-prywatnosci" className="hover:text-white transition-colors">Polityka prywatności</Link></li>
            <li><Link href="/regulamin" className="hover:text-white transition-colors">Regulamin</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-gray-800 text-sm text-center">
        © {new Date().getFullYear()} uNick Academy. Wszelkie prawa zastrzeżone.
      </div>
    </footer>
  )
}

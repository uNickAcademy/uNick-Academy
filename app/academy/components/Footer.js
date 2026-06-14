import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-navy text-white mt-12">
      <div className="max-w-5xl mx-auto px-4 py-8 text-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} uNick Teachers Academy. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href="/academy" className="hover:text-sky">Home</Link>
          <Link href="/academy/library" className="hover:text-sky">Library</Link>
          <Link href="/academy/pricing" className="hover:text-sky">Pricing</Link>
        </nav>
      </div>
    </footer>
  )
}

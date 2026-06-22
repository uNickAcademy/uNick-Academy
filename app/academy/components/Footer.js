import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-navy text-white mt-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-8">
          <div>
            <Link href="/academy" className="flex items-center gap-2.5 mb-3">
              <span className="inline-flex items-center justify-center p-[3px] rounded-[10px] bg-white/10 border border-white/20">
                <Image src="/brand/shield.png" alt="" width={20} height={25} />
              </span>
              <span className="font-heading font-bold text-base tracking-tight">
                <span className="text-brand-bright">uNick</span> Academy
              </span>
            </Link>
            <p className="text-sm text-white/60 max-w-[280px] leading-relaxed">
              Ready-to-teach ESL lesson plans for English teachers worldwide.
            </p>
          </div>

          <div className="flex gap-12 text-sm">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Academy</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/academy/library" className="text-white/70 hover:text-white transition-colors">Library</Link>
                <Link href="/academy/pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link>
                <Link href="/academy/talk-to-unickorn/demo" className="text-white/70 hover:text-white transition-colors">Try uNickorn</Link>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Account</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/login" className="text-white/70 hover:text-white transition-colors">Log in</Link>
                <Link href="/academy/signup" className="text-white/70 hover:text-white transition-colors">Sign up</Link>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Main site</h4>
              <nav className="flex flex-col gap-2">
                <Link href="/en" className="text-white/70 hover:text-white transition-colors">Homepage</Link>
                <Link href="/en/meet-us" className="text-white/70 hover:text-white transition-colors">Meet us</Link>
                <Link href="/en/contact" className="text-white/70 hover:text-white transition-colors">Contact</Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-white/40">
          <p>&copy; {new Date().getFullYear()} uNick Academy. All rights reserved.</p>
          <p>hello@unick-academy.pl</p>
        </div>
      </div>
    </footer>
  )
}

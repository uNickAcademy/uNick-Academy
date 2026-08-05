import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'
import CookieBanner from '@/app/components/CookieBanner'
import GoogleAnalytics from '@/app/components/GoogleAnalytics'
import { getDictionary } from '@/app/lib/dictionaries'

// GA4 i baner zgody były wcześniej wpięte wyłącznie w layout stron
// marketingowych ([locale]), więc `/zapisy` — jedyne miejsce, w którym
// dochodzi do konwersji — nie było w ogóle mierzone. Baner jest tu potrzebny
// razem z GA: ktoś, kto wejdzie prosto z reklamy na `/zapisy`, nie miał gdzie
// wyrazić zgody, a bez zgody skrypt się nie ładuje.
//
// Te strony są polskojęzyczne, stąd słownik na sztywno.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const dict = getDictionary('pl')

  return (
    <>
      <Navbar />
      <div className="pt-16 flex flex-col flex-1">
        {children}
      </div>
      <Footer />
      <CookieBanner locale="pl" dict={dict} />
      <GoogleAnalytics />
    </>
  )
}

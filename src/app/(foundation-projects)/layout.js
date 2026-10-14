import '../[locale]/marketing.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CookieBanner from '../components/CookieBanner'
import GoogleAnalytics from '../components/GoogleAnalytics'
import MetaPixel from '../components/MetaPixel'
import { AttributionCapture } from '../components/AttributionCapture'
import { ConsultationProvider } from '../components/ConsultationProvider'
import { SetHtmlLang } from '../components/SetHtmlLang'
import JsonLd from '../components/JsonLd'
import { getDictionary } from '../lib/dictionaries'
import { siteGraph } from '../lib/structured-data'

export default function FoundationProjectLayout({ children }) {
  const locale = 'pl'
  const dict = getDictionary(locale)

  return (
    <ConsultationProvider locale={locale}>
      <JsonLd data={siteGraph()} />
      <SetHtmlLang locale={locale} />
      <a href="#main-content" className="visually-hidden">
        {dict.common.skipToContent}
      </a>
      <Navbar locale={locale} dict={dict} hideLanguageSwitcher />
      <main id="main-content">{children}</main>
      <Footer locale={locale} dict={dict} />
      <CookieBanner locale={locale} dict={dict} />
      <AttributionCapture />
      <GoogleAnalytics />
      <MetaPixel />
    </ConsultationProvider>
  )
}

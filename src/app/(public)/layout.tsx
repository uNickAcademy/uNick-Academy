import { Navbar } from '@/components/public/Navbar'
import { Footer } from '@/components/public/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="pt-16 flex flex-col flex-1">
        {children}
      </div>
      <Footer />
    </>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { Building2, User, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#FFF8F0]">
      <div className="text-center max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <Image src="/logo.jpg" alt="uNick Academy" width={140} height={70} className="object-contain" />
        </div>
        <div className="flex justify-center mb-6">
          <Image src="/unicorn.PNG" alt="uNickorn" width={180} height={180} className="object-contain animate-float" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#23479E] mb-3">Angielski, który naprawdę działa</h2>
        <p className="text-[#718096] mb-10 text-lg">Wybierz swoją ścieżkę i zacznij mówić po angielsku pewnie</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
          <Link href="/dla-siebie" className="group relative bg-white rounded-[20px] p-6 shadow-sm border-2 border-blue-100 hover:border-[#23479E] hover:shadow-lg transition-all duration-200 text-left">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <User className="text-[#23479E]" size={24} />
            </div>
            <h3 className="text-lg font-bold text-[#23479E] mb-1">Dla siebie</h3>
            <p className="text-sm text-[#718096]">Nauka dopasowana do Twoich celów i tempa</p>
            <ArrowRight size={18} className="absolute top-6 right-6 text-gray-300 group-hover:text-[#23479E] group-hover:translate-x-1 transition-all" />
          </Link>
          <Link href="/dla-firm" className="group relative bg-[#23479E] rounded-[20px] p-6 shadow-sm border-2 border-[#1C387D] hover:bg-[#1C387D] hover:shadow-lg transition-all duration-200 text-left">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <Building2 className="text-[#4EC9B0]" size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Dla firmy</h3>
            <p className="text-sm text-blue-200">Szkolenia B2B, faktura VAT, raporty HR</p>
            <ArrowRight size={18} className="absolute top-6 right-6 text-blue-300 group-hover:text-[#4EC9B0] group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
        <p className="mt-8 text-sm text-[#718096]">Masz już konto?{' '}<Link href="/login" className="text-[#D72614] font-semibold hover:underline">Zaloguj się</Link></p>
      </div>
    </main>
  )
}

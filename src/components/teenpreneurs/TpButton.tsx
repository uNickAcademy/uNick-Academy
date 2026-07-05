import Link from 'next/link'
import { ReactNode } from 'react'
import clsx from 'clsx'

type Variant = 'coral' | 'navy' | 'ghost' | 'sky'

const styles: Record<Variant, string> = {
  coral:
    'bg-tp-coral text-white hover:bg-tp-coral-deep shadow-[0_4px_14px_rgba(255,90,72,0.35)]',
  navy: 'bg-tp-navy text-white hover:bg-tp-navy-soft',
  ghost:
    'bg-transparent text-tp-navy border-2 border-tp-navy/25 hover:border-tp-navy hover:bg-tp-navy/5',
  sky: 'bg-tp-sky text-white hover:brightness-110',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-tp-display font-semibold text-base transition-all duration-200 motion-safe:hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none'

export function TpButton({
  href, onClick, children, variant = 'coral', className, type, disabled,
}: {
  href?: string
  onClick?: () => void
  children: ReactNode
  variant?: Variant
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const cls = clsx(base, styles[variant], className)
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  )
}

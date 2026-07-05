/**
 * Data-driven FAQ using native <details>/<summary> — keyboard accessible
 * and works without JavaScript. Extend by adding entries to the dictionary.
 */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-tp-navy/10 rounded-2xl border border-tp-navy/10 bg-white">
      {items.map(item => (
        <details key={item.q} className="group px-6 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-tp-display font-semibold text-tp-navy [&::-webkit-details-marker]:hidden">
            {item.q}
            <span aria-hidden className="text-tp-coral transition-transform duration-200 group-open:rotate-45 text-xl leading-none">
              +
            </span>
          </summary>
          <p className="mt-3 leading-relaxed text-tp-ink/80">{item.a}</p>
        </details>
      ))}
    </div>
  )
}

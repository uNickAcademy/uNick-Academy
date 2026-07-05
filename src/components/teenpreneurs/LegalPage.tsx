/** Shared layout for privacy / terms / refunds — data-driven from the dictionary. */
export function LegalPage({
  title, updated, sections,
}: {
  title: string
  updated: string
  sections: { h: string; p: string }[]
}) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-20">
      <h1 className="font-tp-display text-3xl font-extrabold text-tp-navy sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-tp-ink/50">{updated}</p>
      <div className="mt-10 space-y-8">
        {sections.map(section => (
          <section key={section.h}>
            <h2 className="font-tp-display text-xl font-bold text-tp-navy">{section.h}</h2>
            <p className="mt-2 font-tp-editorial leading-[1.8] text-tp-ink/85">{section.p}</p>
          </section>
        ))}
      </div>
    </article>
  )
}

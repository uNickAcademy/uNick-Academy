import clsx from 'clsx'

/**
 * Clearly-marked placeholder for real video/photography still to be supplied.
 * Swap the inner content for an <iframe>/<Image> when the media exists —
 * the frame, ratio and caption stay the same.
 */
export function MediaSlot({
  label, caption, ratio = 'video', className,
}: {
  label: string
  caption?: string
  ratio?: 'video' | 'square' | 'portrait'
  className?: string
}) {
  const ratioCls = { video: 'aspect-video', square: 'aspect-square', portrait: 'aspect-[3/4]' }[ratio]
  return (
    <figure className={clsx('w-full', className)}>
      <div
        className={clsx(
          ratioCls,
          'relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-tp-navy/25 bg-tp-sand',
          'flex items-center justify-center'
        )}
      >
        <div className="tp-sticker rounded-lg bg-tp-sun px-4 py-2 text-center font-tp-display text-sm font-semibold text-tp-navy max-w-[85%]">
          {label}
        </div>
      </div>
      {caption && (
        <figcaption className="mt-3 font-tp-editorial italic text-tp-ink/70 text-sm">{caption}</figcaption>
      )}
    </figure>
  )
}

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import fontkit, { type Font } from '@pdf-lib/fontkit'

const fontFiles = ['636a5ac981f94f8b-s.p.woff2', '9e7b0a821b9dfcb4-s.p.woff2']
async function loadFonts() {
  return Promise.all(fontFiles.map(async file => fontkit.create(await readFile(path.join(process.cwd(), 'public/voucher-preview/assets', file)))))
}

/** Outlines our own generated text so PNG generation never relies on Lambda system fonts. */
export async function outlineVoucherText(svg: string) {
  const loadedFonts = await loadFonts()
  return svg.replace(/<text([^>]*)>([^<]*)<\/text>/g, (_match, attributes: string, encoded: string) => {
    const attribute = (name: string) => new RegExp(`${name}="([^"]*)"`).exec(attributes)?.[1]
    const size = Number(attribute('font-size') || 16)
    const weight = Math.min(800, Math.max(200, Number(attribute('font-weight') || 400)))
    const spacing = Number(attribute('letter-spacing') || 0)
    const text = encoded.replace(/&(amp|lt|gt|quot|apos);/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" }[entity]!))
    const segments: { font: Font; text: string }[] = []
    for (const character of text) {
      const font = loadedFonts.find(candidate => candidate.hasGlyphForCodePoint(character.codePointAt(0)!))
      if (!font) throw new Error('Voucher font does not support a required character')
      const previous = segments[segments.length - 1]
      if (previous?.font === font) previous.text += character
      else segments.push({ font, text: character })
    }
    let advance = 0
    const paths: string[] = []
    for (const segment of segments) {
      const scale = size / segment.font.unitsPerEm
      const run = segment.font.layout(segment.text)
      run.glyphs.forEach((glyph, index) => {
        const position = run.positions[index]
        const drawing = glyph.path.toSVG()
        if (drawing) paths.push(`<path vector-effect="non-scaling-stroke" transform="translate(${advance + position.xOffset * scale},${-position.yOffset * scale}) scale(${scale},${-scale})" d="${drawing}"/>`)
        advance += position.xAdvance * scale + spacing
      })
    }
    const width = Math.max(0, advance - spacing)
    const anchor = attribute('text-anchor')
    const x = Number(attribute('x') || 0) - (anchor === 'middle' ? width / 2 : anchor === 'end' ? width : 0)
    const y = Number(attribute('y') || 0)
    const color = attribute('fill') || '#1c2b4a'
    const strokeWidth = Math.max(0, weight - 400) * size / 10000
    return `<g fill="${color}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linejoin="round" transform="translate(${x},${y})">${paths.join('')}</g>`
  })
}

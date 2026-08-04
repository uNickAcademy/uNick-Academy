---
name: unick-brand
description: uNick Academy / uNickorns brand identity, colors, typography, logo and mascot assets. Use whenever building or editing anything user-facing that represents the brand, including website UI, landing pages, email templates, favicons, social graphics, PDFs, or presentations. Also use when writing copy in Polish or English for the brand (marketing posts, emails, UI text).
---

# uNick Academy / uNickorns brand identity

Never invent a new color palette, gradient, or font for this brand. Always use the tokens below. If a design needs a color not listed here, derive a tint/shade of brand-red or brand-navy rather than introducing a new hue (e.g. no purple, no cyan, no generic SaaS gradients).

## Colors

| Token | Hex | Use |
|---|---|---|
| `brand-red` | `#B4321E` | Primary brand color. Headings, CTAs, shield/logo red, buttons |
| `brand-navy` | `#1E3282` | Secondary brand color. Body text on light backgrounds, headers, footers |
| `accent-sky-blue` | `#6090B0` | Playful accent only (mascot horn). Use sparingly, never as a primary color |
| `neutral-cream` | `#F0DCC8` | Warm neutral for soft backgrounds/cards, never pure white/gray if warmth is needed |
| `background` | `#FFFFFF` or warm ivory | Default page/email background |

Do not use purple, violet, or cyan anywhere. Buttons and CTAs should be solid `brand-red` or `brand-navy`, not gradients, unless explicitly asked for a gradient between the two brand colors.

## Typography

- Headings: **Poppins**
- Body/content text: **Comfortaa** (updated August 2026, replaces the earlier Lora)
- Comfortaa officially supports Polish diacritics (ą ć ę ł ń ó ś ź ż), so it's safe for Polish-language copy on web, PDFs, and print.
- Do not default to Inter, Arial, or system-ui unless neither Poppins nor Comfortaa is available in the environment (e.g. plain-text emails) — in that case fall back to a standard sans-serif, but note the limitation.

## Assets

- `/public/brand/unick-academy-logo.png` — full-color wordmark + shield logo (red shield, navy "Academy" text, red "uNick" text, white background). Use for site headers, footers, favicons, formal documents, official/legal communications, letterheads.
- `/public/brand/unickorn-mascot-wave.png` — the uNickorn mascot, a friendly cream-colored unicorn character in a red uNick t-shirt and navy jeans, waving. Use for hero sections, empty states, 404/error pages, onboarding flows, welcome emails, social posts, and anywhere a warm/playful tone fits better than the formal logo.

Adjust these paths if the project's static assets live somewhere other than `/public/brand/` (e.g. `/src/assets/brand/`); keep both files together and reference them by relative path from wherever they end up.

## Usage rules

- Never stretch, recolor, rotate, or apply filters/gradient overlays to the logo or mascot.
- Keep clear space around the logo roughly equal to the height of the shield.
- Prefer the mascot for friendly/casual touchpoints (onboarding, celebrations, empty states) and the logo for formal/trust touchpoints (headers, invoices, legal, footers).
- The current logo file has a white background, not transparent. If it needs to sit on a colored or dark section, ask before generating a transparent/white-logo variant rather than placing it on a mismatched background.

## Voice (copy in any language)

- Warm, natural, optimistic, conversational, human
- Core values: communication over perfection, confidence over grammar, real human connection, learning through use, cultural openness
- Avoid: corporate language, aggressive sales language, school-style teaching language, excessive focus on grammar, generic SaaS phrasing ("unlock", "seamless", "empower")
- Never use the em dash (—) in any text; use commas, colons, or restructure the sentence
- In Polish: avoid formulaic AI-sounding contrast constructions such as "To nie X. To Y." or "Nie dlatego, że X. Dlatego, że Y." — write in natural, flowing Polish instead
- Keep sales/CTA language low-pressure and transparent, not pushy

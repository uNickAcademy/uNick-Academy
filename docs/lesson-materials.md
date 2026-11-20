# Lesson materials

## Purpose

The bilingual public library at `/meterials` and `/en/meterials` shows topic
thumbnails and one sample page per deck. Email verification unlocks all PDFs
without creating a school account. The access cookie lasts 30 days.

## Data and delivery

`POST /api/lesson-materials/request` validates email, language and optional
newsletter consent. A database reservation enforces per-address, per-client and
global delivery limits. Resend sends a single-use link that expires in 30 minutes.
The secret is held in the URL fragment, so email scanners do not consume access
with a GET request. The recipient confirms with a button. Confirmation atomically
marks the request used and creates or updates the contact.

Tables `lesson_material_access_requests` and `lesson_material_contacts` have RLS
enabled with access limited to the server service role. Requests store hashed
tokens and keyed client-IP hashes. This flow does not add contacts to the sales
lead workflow or trigger course messages.

Optional marketing consent is confirmed only when the recipient verifies their
email. A later access request without consent preserves previous preferences.
`materialsUnsubscribeUrl(contact.id, locale)` generates the unsubscribe link
required for future newsletter emails. Eligible subscribers have a non-null
`newsletter_opted_in_at` later than `newsletter_unsubscribed_at`, or no unsubscribe.
No newsletter campaign is sent by this feature.

The existing daily reminders cron calls `prune_lesson_material_contacts`.
Pending requests are deleted after 24 hours. Contacts without active newsletter
consent are deleted after 90 days from the latest access verification or
unsubscribe. The bilingual privacy notice documents these periods and providers.

## PDF access and additions

The authoritative catalogue is `src/app/lib/lesson-materials.ts`. Add each topic
there and upload its PDF to the private Supabase bucket `lesson-material-pdfs`.
Publish its thumbnail as `public/lesson-materials/previews/<slug>.webp` and a
sample A4 page as `public/lesson-materials/samples/<slug>.webp`.

The catalogue order is the shared Polish/English teaching progression. It starts
with concrete basics (colours, numbers, shapes, animals and toys), moves through
everyday vocabulary and sentence-building, and finishes with more specific
practical and seasonal topics. Keep the order explicit here; do not sort topics
alphabetically. This is a suggested learning sequence, not a CEFR assessment or
a strict ranking of individual word frequencies.

PDFs live outside the public site/repository. The legacy
`/lesson-materials/<slug>.pdf` route validates the cookie and issues a five-minute
signed Storage URL. Visitors without access go to the topic preview.
Existing files in the public Git history and previously downloaded copies remain
outside this access control.

## Configuration and maintenance

Uses existing `RESEND_API_KEY`, Supabase server credentials and the canonical
`siteConfig.url`. Optional `LESSON_MATERIALS_SECRET` provides a dedicated signing
key. Its fallback is the existing service-role secret. Rotating the signing key
expires access cookies and outstanding unsubscribe URLs.

The communication page links to an administrator-only contact list with separate
download-access and newsletter status. Export includes unsubscribe links for
eligible newsletter subscribers. A future newsletter sender must check consent
again at send time and attach the recipient's unsubscribe link.

## Conversation cards

The teacher zone and library link to `/[locale]/conversation-cards`. Both material
types use the same verified-email cookie; an existing flashcard session also
unlocks all 100 conversation questions and the printable PDF. The shared form,
confirmation and email copy explicitly describe both resources. Existing consent,
retention, contact administration and throttling are unchanged.

The page checks access on the server. Public visitors receive only three sample
questions in HTML/RSC and the client bundle imports the question type only.
The full deck is passed to the drawing component only after access is verified.
Drawing does not repeat questions until restarted. The theme selector and question
list use the same permitted pool. Questions remain in English in both interfaces.

`src/lib/lesson-materials/catalogue.ts` validates request topics and resolves safe
post-confirmation/download destinations, including `conversation-cards`. This
resource is separate from the 33 vocabulary topics so their teaching order and
count remain unchanged. The private bucket contains `conversation-cards.pdf`;
only its first-page WebP preview is public. No database migration is required.

Rebuild the 11-page A4 PDF with `scripts/build-conversation-cards.py`, supplying
`--font-dir` (Rubik regular/bold TTFs), `--poppler-bin` and `--output-dir` outside
`public`. The script reads canonical questions from `src/app/lib/conversation-cards.ts`,
asserts every question and website footer, renders all pages for review and updates
the public sample. Upload the reviewed PDF to the private bucket before publishing.

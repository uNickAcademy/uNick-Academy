# Briefy treści — lokalne SEO / blog

Repozytorium **nie ma** obecnie bloga ani bazy wiedzy (brak trasy `/blog`,
`/aktualnosci`, `/wiedza`). Aby publikować wartościowe artykuły, trzeba najpierw
dodać architekturę treści — rekomendacja niżej. Do tego czasu poniżej gotowe
briefy (nie generujemy pustych tekstów „na ilość”).

## Rekomendacja techniczna (architektura bloga)

- Nowa trasa `src/app/[locale]/blog/` + `src/app/[locale]/blog/[slug]/`.
- Treść w MDX lub w Supabase (jeśli ma być edytowalna bez deployu).
- Każdy artykuł: `generateMetadata` (title/description/canonical/hreflang przez
  istniejący `buildMetadata`), JSON-LD `Article`/`BlogPosting` z autorem i datami.
- Autorzy = prawdziwi nauczyciele/założyciele (E-E-A-T).
- Sitemap: dołączyć wpisy bloga (rozszerzyć `src/app/sitemap.ts`).

## Wspólny szablon każdego artykułu

- Bezpośrednia odpowiedź w pierwszym akapicie.
- Logiczne nagłówki H2/H3.
- Autor + data publikacji + data aktualizacji.
- Prawdziwe przykłady z uNick Academy.
- FAQ (jeśli uzasadnione) + JSON-LD FAQ.
- Linki do oferty i do konsultacji.
- Poprawne metadane + dane strukturalne artykułu.

## Briefy tematów

### 1. Jak wybrać angielski dla dziecka, które nie lubi tradycyjnej szkoły?
- Intencja: rodzic dziecka „nieszkolnego”. Fraza: „angielski dla dziecka które nie lubi szkoły”.
- Punkty: dlaczego klasyczna metoda zawodzi, rola relacji i zabawy, małe grupy, brak oceniania, jak wygląda lekcja u nas. CTA: konsultacja.

### 2. Czy native speaker jest dobry dla początkującego dziecka?
- Fraza: „native speaker dla dziecka początkującego”. Odpowiedź: tak — mózg widzi realną potrzebę komunikacji (historia założycieli!). Kontra-mity. Kiedy wsparcie dwujęzyczne pomaga.

### 3. Jak pomóc nastolatkowi przełamać barierę mówienia?
- Fraza: „bariera mówienia nastolatek angielski”. Praktyczne techniki, rola tematów bliskich nastolatkowi, projekty, bezpieczeństwo psychologiczne.

### 4. Zajęcia indywidualne czy mała grupa?
- Fraza: „angielski indywidualnie czy w grupie”. Tabela za/przeciw, dla kogo co, jak łączyć. CTA: pomożemy dobrać.

### 5. Jak uczyć angielskiego dziecko z ADHD?
- Fraza: „angielski dla dziecka z ADHD”. Ruch, krótkie bloki, zainteresowania, przewidywalna struktura, brak kar za energię. Nasze doświadczenie.

### 6. Dlaczego rozumiem angielski, ale nie potrafię mówić?
- Fraza: „rozumiem angielski ale nie mówię”. Mechanizm (input vs output), lęk przed błędem, jak konwersacje to zmieniają. Dla dorosłych.

### 7. Jak wygląda dobra lekcja konwersacyjna?
- Fraza: „dobra lekcja konwersacyjna angielski”. Rytm lekcji, rola nauczyciela, błędy jako materiał, przykłady.

### 8. Jak wybrać szkołę językową w Tarnowie Podgórnem?
- Fraza: „szkoła językowa Tarnowo Podgórne jak wybrać”. Kryteria: kadra, wielkość grup, metoda, lokalizacja/dojazd, online. Silny sygnał lokalny.

### 9. Angielski dla dzieci w Tarnowie Podgórnem: na co zwrócić uwagę?
- Fraza: „angielski dla dzieci Tarnowo Podgórne”. Lokalny poradnik dla rodziców + dojazd z okolic.

### 10. Jak długo trwa przełamanie bariery językowej?
- Fraza: „ile trwa przełamanie bariery językowej”. Realne widełki, od czego zależy, rola regularności i mówienia od pierwszego dnia.

## Case study (osobny szablon)

Jeśli są materiały (np. „100 Day Language Transformation”): punkt wyjścia → cel →
sposób pracy → czas → mierzalne/obserwowalne zmiany → cytat ucznia → cytat
nauczyciela → fragmenty wideo → link do playlisty → data aktualizacji.
**Nie wymyślać wyników.**

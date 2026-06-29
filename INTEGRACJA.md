# Integracja platformy uNick Academy

Dokument planu scalenia trzech kodów w jedną spójną platformę.
Status: **Faza 0 — analiza i plan** (ukończona). Wersja: 2026-06-29.

---

## 1. Co scalamy (stan obecny)

| Kod | Branch | Stack | Supabase | Zawartość |
|---|---|---|---|---|
| **Aplikacja produkcyjna** | `production-ts-app` | TS + Tailwind + Next 15 | `xkydfgunafxfuzsggmca` | Strona publiczna, zapisy (booking), panele: admin / nauczyciel / uczeń / firma (HR), auth |
| **uFOS** | `claude/ufos-financial-system-fg8bsq` | TS + Tailwind + Next 16 | `xkydfgunafxfuzsggmca` (schemat `ufos`) | Finanse: AI-CFO, dokumenty, kadry, raporty, zadania, zamknięcie miesiąca |
| **Redesign (landing)** | `claude/unick-academy-landing-redesign-24yvzs` | **JS** + CSS Modules + Next 16 | `ohugscpctjdquebvqigb` (inny projekt!) | Marketing EN/PL, Strefa nauczyciela, sklep z konspektami, uNickorn (AI tutor), referrals |

**Kluczowy fakt:** aplikacja produkcyjna i uFOS **dzielą już tę samą bazę** (`xkydfgunafxfuzsggmca`), a uFOS celowo siedzi w osobnym schemacie `ufos` → łączą się bez kolizji. Redesign używa **innej** bazy.

**Baza kanoniczna (docelowa):** `xkydfgunafxfuzsggmca` (produkcja).

---

## 2. Architektura docelowa

Jeden projekt **Next 15 + TypeScript + Tailwind**, fundament = `production-ts-app`. Grupy tras:

```
src/app/
  (public)    landing EN/PL, kursy, nauczyciele, dla-firm, zapisy   ← TU wchodzi redesign
  (auth)      jeden login + role (student/teacher/admin)
  (student)   panel ucznia  + uNickorn (AI), sklep z konspektami, polecenia
  (teacher)   panel nauczyciela (dziennik, dostępność, uczniowie)
  (admin)     panel operacyjny (grupy, studenci, lekcje, płatności, pipeline…)
  (admin)/finanse  ← uFOS (schemat ufos.*), AI-CFO, dokumenty, kadry, raporty
  (hr)        portal firmowy
```

Jedna baza, jeden Supabase Auth, jedne role. Schemat `ufos` pozostaje odseparowany.

---

## 3. Konflikty bazy i strategia scalania

Aplikacja TS i redesign mają **5 tabel o tych samych nazwach** w schemacie `public`, ale z różnymi kolumnami. **TS = źródło prawdy**, redesign dochodzi addytywnie.

### `profiles`
- TS: `role` (enum student/teacher/admin), `phone`, `avatar_url`
- Redesign: `is_admin` (bool), `subscription_status`, `subscription_plan`, `subscription_currency`, `stripe_customer_id`, `updated_at`
- **Decyzja:** zostaje wersja TS. Dodajemy kolumny subskrypcji z redesignu. `is_admin=true` → `role='admin'`.

### `students`
- TS: bogatszy (teacher_id, level, status, referral_code, credit_balance, stripe_customer_id)
- Redesign: prostszy + osobny `student_profile`
- **Decyzja:** zostaje wersja TS. Pola uNickorn (np. licznik użyć) → nowe tabele.

### `teachers`, `lessons`, `referrals`
- **Decyzja:** zostają wersje TS (są pełniejsze i powiązane relacjami). Redesignowe duplikaty odrzucamy, logikę (jeśli ma coś więcej) przenosimy.

### Tabele NOWE z redesignu (dochodzą bez konfliktu)
`lesson_plans`, `tutor_sessions`, `usage_counters` (uNickorn), `purchases`, `enrollments`, `lesson_plans` storage, `form_submissions`. Plus subskrypcje (Stripe) na `profiles`/osobna tabela.

### uFOS
Schemat `ufos.*` — bez zmian, wpinamy jako moduł. Zero kolizji z `public`.

---

## 4. Plan faz

- [x] **Faza 0 — analiza + plan** (ten dokument)
- [ ] **Faza 1 — szkielet**: branch `claude/platform-integration` na bazie `production-ts-app`; wspólny layout, nawigacja, role
- [ ] **Faza 2 — uFOS**: przeniesienie modułów uFOS do `(admin)/finanse`; migracje `ufos.*` na bazę kanoniczną
- [ ] **Faza 3 — redesign → `(public)`**: odtworzenie landingu EN/PL, Strefy nauczyciela, sklepu jako `.tsx` + Tailwind
- [ ] **Faza 4 — academy**: uNickorn (AI), sklep z konspektami, polecenia wpięte w panele ucznia/nauczyciela; migracje nowych tabel
- [ ] **Faza 5 — i18n**: dwujęzyczność EN/PL w całej platformie (z redesignu)
- [ ] **Faza 6 — testy na preview → produkcja**

---

## 5. Bramki bezpieczeństwa (wymagają decyzji/dostępu Mileny)

Te kroki dotykają **żywej strony i prawdziwych danych** — nie wykonuję ich bez potwierdzenia:

1. **Migracja danych** redesignu z bazy `ohugscpctjdquebvqigb` → `xkydfgunafxfuzsggmca` (czy są tam prawdziwe dane do przeniesienia, czy tylko testowe?).
2. **Zmienne środowiskowe** na Vercel (klucze Supabase, Stripe, Anthropic).
3. **Uruchomienie migracji SQL** na bazie produkcyjnej.
4. **Cutover** — przełączenie domeny unick-academy.pl na nową, zintegrowaną aplikację (dopiero po testach na preview).

---

## 6. Otwarte pytania

- Czy w bazie redesignu (`ohugscpctjdquebvqigb`) są realni użytkownicy/dane, czy to środowisko testowe?
- Stripe: jeden zestaw kluczy czy osobne dla subskrypcji uNickorn?
- Domeny: docelowo wszystko na `unick-academy.pl`?

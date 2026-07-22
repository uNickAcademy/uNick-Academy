# Hosting, domena kanoniczna i przekierowania

Domena kanoniczna: **`https://unick-academy.pl`** (bez `www`, HTTPS).
Hosting: **Vercel** (deploy automatyczny z gałęzi `main`).

## Co jest już wdrożone w repozytorium

Przekierowania **na poziomie ścieżek na nowej domenie** działają przez
`next.config.ts` → `redirects()`:

- stare slugi WordPress (`/dla-firm`, `/o-nas`, `/nauczyciele`, `/metoda`,
  `/dzieci`, `/mlodziez`, `/dorosli`, `/angielski-dla-*`, `/regulamin*`) →
  odpowiednie strony `/pl/...` (301),
- polskie aliasy prawne/kontakt (`/kontakt`, `/polityka-prywatnosci`,
  `/regulamin`) → `/pl/...` (307, zastane),
- ujednolicenie slugów lokalnych per język (301).

Pełna lista: `docs/redirect-map.csv`.

## Co trzeba zrobić poza repozytorium (Vercel / DNS)

Poniższych rzeczy **nie da się** zrobić samym kodem aplikacji — wymagają
konfiguracji domen w panelu Vercel oraz DNS.

### 1. Wymuszenie HTTPS
Vercel domyślnie wymusza HTTPS i wystawia certyfikat. Zweryfikuj, że
`http://` → `https://` działa (301).

### 2. Kanonizacja `www` → bez `www`
W panelu Vercel: **Project → Settings → Domains**.
- Ustaw `unick-academy.pl` jako **Primary**.
- Dodaj `www.unick-academy.pl` i wybierz **Redirect to `unick-academy.pl`** (308/301).

### 3. Przekierowanie starej domeny `unickacademy.pl` → `unick-academy.pl`
To najważniejszy krok migracyjny. Zalecane: przekierowanie **z zachowaniem
ścieżki**, aby mapowanie slugów z `next.config.ts` mogło dokończyć pracę.

**Wariant A — stara domena obsługiwana przez Vercel (ten sam projekt):**
1. Dodaj `unickacademy.pl` i `www.unickacademy.pl` do projektu w Vercel.
2. Ustaw dla nich **Redirect** na `unick-academy.pl` (Vercel zachowuje ścieżkę).
3. Po redirekcie domenowym ścieżki typu `/dla-firm` trafią w reguły
   `next.config.ts` i zostaną domapowane do `/pl/companies` (efekt: 1–2 hopy 301).

**Wariant B — stara domena na innym hostingu (np. WordPress/Apache/Nginx):**
Dodaj regułę serwera. Przykłady:

```nginx
# Nginx
server {
  server_name unickacademy.pl www.unickacademy.pl;
  return 301 https://unick-academy.pl$request_uri;
}
```

```apache
# Apache (.htaccess)
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\.)?unickacademy\.pl$ [NC]
RewriteRule ^(.*)$ https://unick-academy.pl/$1 [R=301,L]
```

```
# Cloudflare — Bulk Redirect / Redirect Rule
When incoming requests match: hostname equals "unickacademy.pl"
Then: Dynamic redirect → concat("https://unick-academy.pl", http.request.uri.path)  (status 301)
```

> Uwaga: jeśli stare adresy WordPress mają inne ścieżki niż te w
> `redirect-map.csv`, dopisz brakujące mapowania 1:1 (do `next.config.ts`
> lub jako reguły na hostingu). **Nie** kieruj wszystkich starych podstron
> hurtem na stronę główną.

### 4. Zasoby (zdjęcia nauczycieli)
`src/app/lib/teachers.js` linkuje zdjęcia z `unickacademy.pl/wp-content/uploads/...`.
Po wygaszeniu starej domeny te obrazy przestaną działać. **Do zrobienia:**
przenieś pliki do `public/` (lub Supabase Storage) i zaktualizuj `PHOTO_BASE`.
Zapisane w `SEO_CONTENT_NEEDED.md`.

### 5. Weryfikacja po wdrożeniu
- `curl -I http://unick-academy.pl` → 301 na https.
- `curl -I https://www.unick-academy.pl` → 301/308 na bez-www.
- `curl -I https://unickacademy.pl/dla-firm` → docelowo `/pl/companies`.
- `curl -I https://unick-academy.pl/robots.txt` → 200 i zawiera `Sitemap:`.
- `curl https://unick-academy.pl/sitemap.xml` → tylko adresy `https://unick-academy.pl/...`.

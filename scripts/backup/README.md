# Lokalny backup bazy danych

Codzienna kopia zapasowa bazy danych (Supabase Postgres) zapisywana **bezpośrednio
na dysk Twojego komputera** — bez pośredniego przechowywania gdziekolwiek w chmurze.
Kopia trafia wyłącznie z Supabase do Twojej maszyny (połączenie szyfrowane SSL) i tam
zostaje.

Ograniczenie tego podejścia: backup wykona się tylko wtedy, gdy komputer jest w danym
momencie włączony i online. Jeśli laptop bywa wyłączony o zaplanowanej porze, tego dnia
kopia się nie utworzy — poniższe instrukcje harmonogramu (Windows Task Scheduler /
macOS `launchd`) mają opcję "uruchom zaległe zadanie po włączeniu komputera", co to
łagodzi, ale nie eliminuje w 100%.

## 1. Instalacja narzędzi

**macOS:**
```
brew install postgresql gnupg
```

**Windows:** zainstaluj klienta PostgreSQL (sam `pg_dump`, baza nie jest potrzebna) ze
strony postgresql.org/download/windows, oraz opcjonalnie [Gpg4win](https://gpg4win.org/)
do szyfrowania.

## 2. Konfiguracja (dane wrażliwe — tylko na Twoim komputerze)

Utwórz plik `~/.unick-backup.env` (macOS/Linux) lub
`%USERPROFILE%\.unick-backup.env.ps1` (Windows) — **poza folderem repo**, żeby nigdy
przypadkiem nie trafił do gita.

**macOS/Linux** (`~/.unick-backup.env`):
```bash
export SUPABASE_DB_URL="postgresql://postgres:HASLO@db.xkydfgunafxfuzsggmca.supabase.co:5432/postgres"
export BACKUP_DIR="$HOME/UNickAcademyBackups"
export BACKUP_PASSPHRASE="wybierz-silne-haslo-i-zapisz-je-w-menedzerze-hasel"
export BACKUP_RETENTION_DAYS="60"
# opcjonalnie: druga kopia wysyłana na osobną gałąź tego repo na GitHubie (patrz sekcja 5)
export BACKUP_GIT_PUSH="true"
export BACKUP_GIT_BRANCH="db-backups"
export BACKUP_GIT_REMOTE="origin"
```

**Windows** (`%USERPROFILE%\.unick-backup.env.ps1`):
```powershell
$env:SUPABASE_DB_URL = "postgresql://postgres:HASLO@db.xkydfgunafxfuzsggmca.supabase.co:5432/postgres"
$env:BACKUP_DIR = "$env:USERPROFILE\UNickAcademyBackups"
$env:BACKUP_PASSPHRASE = "wybierz-silne-haslo-i-zapisz-je-w-menedzerze-hasel"
$env:BACKUP_RETENTION_DAYS = "60"
# opcjonalnie: druga kopia wysyłana na osobną gałąź tego repo na GitHubie (patrz sekcja 5)
$env:BACKUP_GIT_PUSH = "true"
$env:BACKUP_GIT_BRANCH = "db-backups"
$env:BACKUP_GIT_REMOTE = "origin"
```

Connection string (z hasłem) znajdziesz w Supabase: **Project Settings → Database →
Connection string → URI** — użyj wersji **bezpośredniej** (port `5432`), nie poolera
(port `6543`), bo `pg_dump` wymaga bezpośredniego połączenia.

`BACKUP_PASSPHRASE` zabezpiecza kopię, gdyby ktoś fizycznie dostał się do tego dysku —
dane zawierają dane osobowe uczniów i informacje finansowe. Zapisz to hasło w swoim
menedżerze haseł — bez niego nie odszyfrujesz backupu w razie potrzeby przywrócenia.

## 3. Ręczny test

```bash
chmod +x scripts/backup/pg-backup.sh
./scripts/backup/pg-backup.sh
```

Powinien pojawić się plik w `~/UNickAcademyBackups/unick-backup-RRRR-MM-DD.dump.gpg`.

## 4. Harmonogram — uruchamianie raz dziennie

**macOS (`launchd`):** utwórz `~/Library/LaunchAgents/pl.unick.dbbackup.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>pl.unick.dbbackup</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>/pełna/ścieżka/do/uNick-Academy/scripts/backup/pg-backup.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
  <key>RunAtLoad</key><false/>
</dict></plist>
```
Załaduj: `launchctl load ~/Library/LaunchAgents/pl.unick.dbbackup.plist`

**Linux (`cron`):** `crontab -e`, dodaj:
```
0 7 * * * /pełna/ścieżka/do/uNick-Academy/scripts/backup/pg-backup.sh >> ~/UNickAcademyBackups/backup.log 2>&1
```

**Windows (Harmonogram zadań):**
1. Otwórz „Harmonogram zadań” → „Utwórz zadanie podstawowe”
2. Wyzwalacz: codziennie, wybrana godzina
3. Akcja: uruchom program `powershell.exe` z argumentami:
   `-ExecutionPolicy Bypass -File "C:\pełna\ścieżka\do\uNick-Academy\scripts\backup\pg-backup.ps1"`
4. W zakładce „Warunki” zaznacz „Uruchom zadanie tak szybko, jak to możliwe po
   pominiętym uruchomieniu zaplanowanym” — to nadrabia backup, jeśli komputer był
   wyłączony o zaplanowanej porze.

## 5. Druga kopia: wysyłka na GitHub (opcjonalnie)

Jeśli chcesz mieć backup **poza dyskiem tego komputera** (np. na wypadek zniszczenia
lub kradzieży laptopa), skrypt może dodatkowo wypychać **zaszyfrowaną** kopię na
osobną gałąź `db-backups` w tym samym repozytorium (`unick-academy`) na GitHubie.
Włącza się to ustawieniem `BACKUP_GIT_PUSH="true"` w pliku konfiguracyjnym (sekcja 2).

**Jak to działa:**
- Gałąź `db-backups` jest całkowicie odseparowana od `main` — nigdy nie jest z nią
  mergowana i nie wpływa na wdrożenie produkcyjne (Vercel deployuje tylko `main`).
- Skrypt trzyma osobny `git worktree` w `BACKUP_DIR/.git-backup-worktree`, więc **nie
  rusza** Twojego bieżąco wybranego brancha ani niezacommitowanych zmian w głównym
  folderze repo.
- Każde uruchomienie commituje nowy plik `.dump.gpg`, usuwa z gałęzi pliki starsze niż
  `BACKUP_RETENTION_DAYS` i wypycha (`git push`) na `BACKUP_GIT_REMOTE`.
- `pg-backup.sh`/`.ps1` **odmówią wysyłki**, jeśli `BACKUP_PASSPHRASE` nie jest
  ustawione — na GitHub nigdy nie trafia niezaszyfrowany zrzut.

**Wymagania przed włączeniem:**
1. **Repozytorium `unick-academy` musi być prywatne.** Nawet zaszyfrowane, kopie
   danych uczniów i danych finansowych nie powinny być publicznie dostępne — sprawdź
   to w ustawieniach repo na GitHubie (Settings → General → Danger Zone → Visibility)
   zanim włączysz `BACKUP_GIT_PUSH`.
2. Komputer, na którym uruchamiasz backup, musi mieć skonfigurowany dostęp `git push`
   do tego repo (SSH klucz lub zapisany token/credential helper) — ten sam, którego
   normalnie używasz do `git push` w tym repo z tej maszyny.
3. Hasło z `BACKUP_PASSPHRASE` zapisz w menedżerze haseł — to jedyny sposób na
   odszyfrowanie kopii z GitHuba w razie przywracania.

Dostęp do gałęzi `db-backups` mają wszyscy, którzy mają dostęp do repo `unick-academy`
(np. przyszli developerzy) — to inny poziom ryzyka niż kopia lokalna. Jeśli w
przyszłości zechcesz ograniczyć dostęp do backupów tylko do wybranych osób,
niezależnie od dostępu do kodu aplikacji, przenieś tę funkcję na osobne, prywatne
repozytorium (zmieniając `BACKUP_GIT_REMOTE` na jego URL).

## 6. Przywracanie kopii (na wypadek awarii)

```bash
# jeśli plik jest zaszyfrowany:
gpg --batch --yes --passphrase "$BACKUP_PASSPHRASE" --decrypt \
  -o unick-backup.dump ~/UNickAcademyBackups/unick-backup-2026-07-14.dump.gpg

# przywrócenie do docelowej bazy (NOWY/pusty projekt Supabase — nie produkcyjny!):
pg_restore --clean --if-exists --no-owner -d "$TARGET_DB_URL" unick-backup.dump
```

Nigdy nie testuj przywracania bezpośrednio na bazie produkcyjnej — użyj nowego,
pustego projektu Supabase do weryfikacji, że backup jest poprawny.

#!/usr/bin/env bash
# Codzienny lokalny backup bazy danych uNick Academy (Supabase Postgres) —
# zapisywany bezpośrednio na dysk tego komputera, bez pośrednich usług w chmurze.
#
# Wymaga: pg_dump w PATH (pakiet postgresql-client / Postgres.app),
# opcjonalnie gpg do szyfrowania kopii w spoczynku.
#
# Konfiguracja: plik ~/.unick-backup.env (NIGDY nie commituj go do repo!)
# powinien ustawiać:
#   SUPABASE_DB_URL       - połączenie BEZPOŚREDNIE (nie pooler, port 5432),
#                           z Supabase: Project Settings > Database > Connection string > URI
#   BACKUP_DIR            - folder docelowy (domyślnie ~/UNickAcademyBackups)
#   BACKUP_PASSPHRASE      - hasło do szyfrowania AES-256 (zalecane — dane zawierają PII)
#   BACKUP_RETENTION_DAYS  - ile dni kopii trzymać (domyślnie 60)

set -euo pipefail

ENV_FILE="${UNICK_BACKUP_ENV_FILE:-$HOME/.unick-backup.env}"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

: "${SUPABASE_DB_URL:?Brak SUPABASE_DB_URL — ustaw go w $ENV_FILE (patrz scripts/backup/README.md)}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/UNickAcademyBackups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-60}"
DATE_STR="$(date +%F)"

mkdir -p "$BACKUP_DIR"
DUMP_FILE="$BACKUP_DIR/unick-backup-$DATE_STR.dump"

echo "==> Tworzę zrzut bazy ($DATE_STR)..."
pg_dump "$SUPABASE_DB_URL" -Fc -f "$DUMP_FILE"

if [[ -n "${BACKUP_PASSPHRASE:-}" ]]; then
  echo "==> Szyfruję zrzut (AES-256)..."
  gpg --batch --yes --passphrase "$BACKUP_PASSPHRASE" --symmetric --cipher-algo AES256 \
    -o "$DUMP_FILE.gpg" "$DUMP_FILE"
  rm -f "$DUMP_FILE"
  DUMP_FILE="$DUMP_FILE.gpg"
fi

echo "==> Zapisano: $DUMP_FILE"

echo "==> Usuwam kopie starsze niż $RETENTION_DAYS dni..."
find "$BACKUP_DIR" -name 'unick-backup-*' -mtime "+$RETENTION_DAYS" -print -delete

echo "==> Gotowe."

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
#   BACKUP_DIR             - folder docelowy (domyślnie ~/UNickAcademyBackups)
#   BACKUP_PASSPHRASE      - hasło do szyfrowania AES-256 (WYMAGANE, jeśli BACKUP_GIT_PUSH=true)
#   BACKUP_RETENTION_DAYS  - ile dni kopii trzymać (domyślnie 60)
#   BACKUP_GIT_PUSH        - "true", aby dodatkowo wysłać zaszyfrowaną kopię na osobną
#                             gałąź tego repo na GitHubie (druga kopia, poza dyskiem lokalnym)
#   BACKUP_GIT_BRANCH      - nazwa gałęzi backupów (domyślnie db-backups)
#   BACKUP_GIT_REMOTE      - nazwa zdalnego repo (domyślnie origin)

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

if [[ "${BACKUP_GIT_PUSH:-false}" == "true" ]]; then
  : "${BACKUP_PASSPHRASE:?BACKUP_GIT_PUSH=true wymaga BACKUP_PASSPHRASE — nigdy nie wysyłamy niezaszyfrowanej kopii do GitHuba}"

  GIT_BRANCH="${BACKUP_GIT_BRANCH:-db-backups}"
  GIT_REMOTE="${BACKUP_GIT_REMOTE:-origin}"
  REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
  WORKTREE_DIR="$BACKUP_DIR/.git-backup-worktree"

  echo "==> Wysyłam zaszyfrowaną kopię na gałąź $GIT_REMOTE/$GIT_BRANCH..."
  git -C "$REPO_ROOT" fetch "$GIT_REMOTE" "$GIT_BRANCH" 2>/dev/null || true

  if [[ ! -d "$WORKTREE_DIR" ]]; then
    if git -C "$REPO_ROOT" show-ref --verify --quiet "refs/remotes/$GIT_REMOTE/$GIT_BRANCH"; then
      git -C "$REPO_ROOT" worktree add "$WORKTREE_DIR" -B "$GIT_BRANCH" "$GIT_REMOTE/$GIT_BRANCH"
    else
      git -C "$REPO_ROOT" worktree add --detach "$WORKTREE_DIR"
      git -C "$WORKTREE_DIR" checkout --orphan "$GIT_BRANCH"
      git -C "$WORKTREE_DIR" rm -rf . >/dev/null 2>&1 || true
    fi
  else
    git -C "$WORKTREE_DIR" fetch "$GIT_REMOTE" "$GIT_BRANCH" 2>/dev/null || true
    git -C "$WORKTREE_DIR" checkout "$GIT_BRANCH" 2>/dev/null || git -C "$WORKTREE_DIR" checkout --orphan "$GIT_BRANCH"
    git -C "$WORKTREE_DIR" reset --hard "$GIT_REMOTE/$GIT_BRANCH" 2>/dev/null || true
  fi

  cp "$DUMP_FILE" "$WORKTREE_DIR/"

  CUTOFF="$(date -d "-$RETENTION_DAYS days" +%F 2>/dev/null || date -v-"${RETENTION_DAYS}"d +%F)"
  for f in "$WORKTREE_DIR"/unick-backup-*; do
    [[ -e "$f" ]] || continue
    fname="$(basename "$f")"
    fdate="${fname#unick-backup-}"
    fdate="${fdate%%.*}"
    if [[ "$fdate" < "$CUTOFF" ]]; then
      rm -f "$f"
    fi
  done

  git -C "$WORKTREE_DIR" add -A
  if ! git -C "$WORKTREE_DIR" diff --cached --quiet; then
    git -C "$WORKTREE_DIR" commit -m "backup: $DATE_STR" --quiet
    git -C "$WORKTREE_DIR" push "$GIT_REMOTE" "$GIT_BRANCH"
    echo "==> Wysłano na GitHub (gałąź $GIT_BRANCH)."
  else
    echo "==> Brak zmian do wysłania na GitHub."
  fi
fi

echo "==> Gotowe."

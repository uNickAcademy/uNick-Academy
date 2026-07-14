# Codzienny lokalny backup bazy danych uNick Academy (Supabase Postgres) —
# zapisywany bezposrednio na dysk tego komputera, bez posrednich uslug w chmurze.
#
# Wymaga: pg_dump.exe w PATH (zainstaluj klienta PostgreSQL, np. z postgresql.org),
# opcjonalnie gpg.exe (Gpg4win) do szyfrowania kopii w spoczynku.
#
# Konfiguracja: plik $env:USERPROFILE\.unick-backup.env.ps1 (NIGDY nie commituj go do repo!)
# powinien ustawiac:
#   $env:SUPABASE_DB_URL       - polaczenie BEZPOSREDNIE (nie pooler, port 5432),
#                                 z Supabase: Project Settings > Database > Connection string > URI
#   $env:BACKUP_DIR             - folder docelowy (domyslnie %USERPROFILE%\UNickAcademyBackups)
#   $env:BACKUP_PASSPHRASE       - haslo do szyfrowania AES-256 (zalecane — dane zawieraja PII)
#   $env:BACKUP_RETENTION_DAYS   - ile dni kopii trzymac (domyslnie 60)

$ErrorActionPreference = "Stop"

$envFile = if ($env:UNICK_BACKUP_ENV_FILE) { $env:UNICK_BACKUP_ENV_FILE } else { "$env:USERPROFILE\.unick-backup.env.ps1" }
if (Test-Path $envFile) { . $envFile }

if (-not $env:SUPABASE_DB_URL) { throw "Brak SUPABASE_DB_URL — ustaw go w $envFile (patrz scripts/backup/README.md)" }
$backupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { "$env:USERPROFILE\UNickAcademyBackups" }
$retentionDays = if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 60 }
$dateStr = Get-Date -Format "yyyy-MM-dd"

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$dumpFile = Join-Path $backupDir "unick-backup-$dateStr.dump"

Write-Host "==> Tworze zrzut bazy ($dateStr)..."
& pg_dump $env:SUPABASE_DB_URL -Fc -f $dumpFile

if ($env:BACKUP_PASSPHRASE) {
  Write-Host "==> Szyfruje zrzut (AES-256)..."
  & gpg --batch --yes --passphrase $env:BACKUP_PASSPHRASE --symmetric --cipher-algo AES256 -o "$dumpFile.gpg" $dumpFile
  Remove-Item $dumpFile
  $dumpFile = "$dumpFile.gpg"
}

Write-Host "==> Zapisano: $dumpFile"

Write-Host "==> Usuwam kopie starsze niz $retentionDays dni..."
Get-ChildItem $backupDir -Filter "unick-backup-*" | Where-Object {
  $_.LastWriteTime -lt (Get-Date).AddDays(-$retentionDays)
} | Remove-Item -Force

Write-Host "==> Gotowe."

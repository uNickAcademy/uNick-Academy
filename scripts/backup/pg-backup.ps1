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
#   $env:BACKUP_PASSPHRASE       - haslo do szyfrowania AES-256 (WYMAGANE, jesli BACKUP_GIT_PUSH=true)
#   $env:BACKUP_RETENTION_DAYS   - ile dni kopii trzymac (domyslnie 60)
#   $env:BACKUP_GIT_PUSH         - "true", aby dodatkowo wyslac zaszyfrowana kopie na osobna
#                                   galaz tego repo na GitHubie (druga kopia, poza dyskiem lokalnym)
#   $env:BACKUP_GIT_BRANCH       - nazwa galezi backupow (domyslnie db-backups)
#   $env:BACKUP_GIT_REMOTE       - nazwa zdalnego repo (domyslnie origin)

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

if ($env:BACKUP_GIT_PUSH -eq "true") {
  if (-not $env:BACKUP_PASSPHRASE) { throw "BACKUP_GIT_PUSH=true wymaga BACKUP_PASSPHRASE - nigdy nie wysylamy niezaszyfrowanej kopii do GitHuba" }

  $gitBranch = if ($env:BACKUP_GIT_BRANCH) { $env:BACKUP_GIT_BRANCH } else { "db-backups" }
  $gitRemote = if ($env:BACKUP_GIT_REMOTE) { $env:BACKUP_GIT_REMOTE } else { "origin" }
  $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
  $worktreeDir = Join-Path $backupDir ".git-backup-worktree"

  Write-Host "==> Wysylam zaszyfrowana kopie na galaz $gitRemote/$gitBranch..."
  & git -C $repoRoot fetch $gitRemote $gitBranch 2>$null

  if (-not (Test-Path $worktreeDir)) {
    & git -C $repoRoot show-ref --verify --quiet "refs/remotes/$gitRemote/$gitBranch"
    if ($LASTEXITCODE -eq 0) {
      & git -C $repoRoot worktree add $worktreeDir -B $gitBranch "$gitRemote/$gitBranch"
    } else {
      & git -C $repoRoot worktree add --detach $worktreeDir
      & git -C $worktreeDir checkout --orphan $gitBranch
      & git -C $worktreeDir rm -rf . 2>$null | Out-Null
    }
  } else {
    & git -C $worktreeDir fetch $gitRemote $gitBranch 2>$null
    & git -C $worktreeDir checkout $gitBranch 2>$null
    if ($LASTEXITCODE -ne 0) { & git -C $worktreeDir checkout --orphan $gitBranch }
    & git -C $worktreeDir reset --hard "$gitRemote/$gitBranch" 2>$null
  }

  Copy-Item $dumpFile $worktreeDir

  $cutoff = (Get-Date).AddDays(-$retentionDays)
  Get-ChildItem $worktreeDir -Filter "unick-backup-*" | Where-Object {
    $parsed = $null
    $datePart = ($_.Name -replace '^unick-backup-', '') -replace '\..*$', ''
    if ([datetime]::TryParseExact($datePart, "yyyy-MM-dd", $null, [System.Globalization.DateTimeStyles]::None, [ref]$parsed)) {
      $parsed -lt $cutoff
    } else { $false }
  } | Remove-Item -Force

  & git -C $worktreeDir add -A
  & git -C $worktreeDir diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    & git -C $worktreeDir commit -m "backup: $dateStr" --quiet
    & git -C $worktreeDir push $gitRemote $gitBranch
    Write-Host "==> Wyslano na GitHub (galaz $gitBranch)."
  } else {
    Write-Host "==> Brak zmian do wyslania na GitHub."
  }
}

Write-Host "==> Gotowe."

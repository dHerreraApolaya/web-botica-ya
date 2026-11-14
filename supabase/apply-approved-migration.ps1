$ErrorActionPreference = 'Stop'
$psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
$migration = Join-Path $PSScriptRoot 'migrations\202611130001_initial_schema.sql'
$verification = Join-Path $PSScriptRoot 'verify_structure.sql'
$statusFile = Join-Path $PSScriptRoot 'execution-status.local'

if (!(Test-Path -LiteralPath $psql)) { throw 'PostgreSQL client is not installed.' }

$env:PGHOST = 'aws-0-us-east-2.pooler.supabase.com'
$env:PGPORT = '5432'
$env:PGDATABASE = 'postgres'
$env:PGUSER = 'postgres.vwktgkmmerhedfkwuxrk'
$env:PGSSLMODE = 'require'
$env:PGCONNECT_TIMEOUT = '15'
$env:PGAPPNAME = 'boticaya-approved-migration'
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue

'awaiting_password' | Set-Content -LiteralPath $statusFile
Write-Host 'Proyecto Supabase: botica-ya-dev'
Write-Host 'Introduce la contraseña de la base de datos cuando psql la solicite.'
Write-Host 'La contraseña no se muestra ni se escribe en archivos.'

try {
  & $psql -X -W -v ON_ERROR_STOP=1 -P pager=off -f $migration -f $verification
  if ($LASTEXITCODE -ne 0) {
    'failed_review_terminal_output' | Set-Content -LiteralPath $statusFile
    Write-Host 'La ejecución falló. Conserva esta ventana para revisar el error.'
  } else {
    'migration_and_verification_succeeded' | Set-Content -LiteralPath $statusFile
    Write-Host 'Migración y verificación completadas.'
  }
} catch {
  'failed_review_terminal_output' | Set-Content -LiteralPath $statusFile
  Write-Host $_.Exception.Message
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
Read-Host 'Pulsa Enter para cerrar'

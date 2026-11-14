param(
  [Parameter(Mandatory = $true)]
  [string]$CaPath,
  [switch]$CheckTlsOnly
)

$ErrorActionPreference = 'Stop'
$statusFile = Join-Path $PSScriptRoot 'services-status.local'
$nodeScript = Join-Path $PSScriptRoot 'connect-services.cjs'
$previousCaPath = $env:BOTICAYA_SUPABASE_CA_FILE
$pointer = [IntPtr]::Zero
$secret = $null
try {
  $env:BOTICAYA_SUPABASE_CA_FILE = (Resolve-Path -LiteralPath $CaPath).Path
  & node $nodeScript --check-tls
  if ($LASTEXITCODE -ne 0) { throw 'La verificación TLS falló. Revisa el certificado CA.' }
  if ($CheckTlsOnly) {
    'tls_verified' | Set-Content -LiteralPath $statusFile
  } else {
    'awaiting_password' | Set-Content -LiteralPath $statusFile
    $secret = Read-Host 'Contraseña administrativa de Supabase (entrada oculta)' -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    $env:BOTICAYA_SUPABASE_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    & node $nodeScript
    if ($LASTEXITCODE -ne 0) { throw 'La configuración falló. Revisa el mensaje anterior.' }
  }
} catch {
  'failed' | Set-Content -LiteralPath $statusFile
  throw
} finally {
  Remove-Item Env:BOTICAYA_SUPABASE_ADMIN_PASSWORD -ErrorAction SilentlyContinue
  if ($previousCaPath) {
    $env:BOTICAYA_SUPABASE_CA_FILE = $previousCaPath
  } else {
    Remove-Item Env:BOTICAYA_SUPABASE_CA_FILE -ErrorAction SilentlyContinue
  }
  if ($pointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
  if ($secret) { $secret.Dispose() }
}

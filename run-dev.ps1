$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Stop-PortProcess {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Port
  )

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if ($connections) {
    $connections |
      Select-Object -ExpandProperty OwningProcess -Unique |
      ForEach-Object { Stop-Process -Id $_ -Force }
  }
}

Write-Host 'Stopping listeners on ports 3000 and 3001...'
Stop-PortProcess -Port 3000
Stop-PortProcess -Port 3001

Write-Host 'Starting backend in a new PowerShell window...'
Start-Process powershell.exe -ArgumentList @(
  '-NoExit',
  '-Command',
  "Set-Location '$root\apps\api'; npx ts-node --transpile-only -r tsconfig-paths/register src/main.ts"
)

Write-Host 'Starting frontend in this window...'
Set-Location $root
npm run dev:web

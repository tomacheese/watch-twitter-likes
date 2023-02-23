Set-Location $PSScriptRoot
Set-Location ..

# if not node_modules exists, run yarn install
if (!(Test-Path "crawler/node_modules")) {
    Write-Host
    Write-Host "Installing dependencies..."
    Start-Process -FilePath cmd -ArgumentList "/C yarn install" -WorkingDirectory "crawler" -NoNewWindow -Wait
}

if ($env:CONFIG_PATH -eq $null) {
  Write-Host "No config path specified, using default config" -ForegroundColor Cyan
  $env:CONFIG_PATH = "../data/config.json"
}

if ($env:CHROMIUM_PATH -eq $null -and (Test-Path "C:\Program Files\Google\Chrome\Application\chrome.exe")) {
  Write-Host "No chromium path specified, using default chrome path" -ForegroundColor Cyan
  $env:CHROMIUM_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
} elseif ($env:CHROMIUM_PATH -eq $null) {
  Write-Host "No chromium path specified and no chrome path found. Please specify CHROMIUM_PATH environment variable." -ForegroundColor Red
  exit 1
}

Start-Process -FilePath cmd -ArgumentList "/C yarn dev" -WorkingDirectory "crawler" -NoNewWindow -Wait

Write-Host
Write-Host Please press any key... -NoNewLine
[Console]::ReadKey() | Out-Null

Set-Location $PSScriptRoot
Set-Location ..

# if not node_modules exists, run yarn install
if (!(Test-Path "crawler/node_modules")) {
    Write-Host
    Write-Host "Installing dependencies..."
    Start-Process -FilePath cmd -ArgumentList "/C yarn install" -WorkingDirectory "crawler" -NoNewWindow -Wait
}

Start-Process -FilePath cmd -ArgumentList "/C yarn generate-schema" -WorkingDirectory "crawler" -NoNewWindow -Wait

Write-Host
Write-Host Please press any key... -NoNewLine
[Console]::ReadKey() | Out-Null
Set-Location $PSScriptRoot
Set-Location ..

Start-Process -FilePath cmd -ArgumentList "/C yarn install" -WorkingDirectory "crawler" -NoNewWindow -Wait
Start-Process -FilePath cmd -ArgumentList "/C yarn install" -WorkingDirectory "web" -NoNewWindow -Wait

Write-Host
Write-Host Successfully reinstalled dependencies -ForegroundColor Green

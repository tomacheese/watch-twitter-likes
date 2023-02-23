Set-Location $PSScriptRoot
Set-Location ..

Start-Process -FilePath cmd -ArgumentList "/C yarn fix" -WorkingDirectory "crawler" -NoNewWindow -Wait
Start-Process -FilePath cmd -ArgumentList "/C yarn lintfix" -WorkingDirectory "web" -NoNewWindow -Wait

Write-Host
Write-Host Successfully fixed lint errors -ForegroundColor Green

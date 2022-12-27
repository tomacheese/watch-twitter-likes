Set-Location $PSScriptRoot
Set-Location ..

Get-ChildItem */node_modules | Remove-Item -Force -Recurse -ErrorAction Stop
Start-Process -FilePath cmd -ArgumentList "/C yarn install" -WorkingDirectory "crawler" -NoNewWindow -Wait
Start-Process -FilePath cmd -ArgumentList "/C yarn install" -WorkingDirectory "mock-api" -NoNewWindow -Wait
Start-Process -FilePath cmd -ArgumentList "/C yarn install" -WorkingDirectory "web" -NoNewWindow -Wait

Write-Host
Write-Host Please press any key... -NoNewLine
[Console]::ReadKey() | Out-Null
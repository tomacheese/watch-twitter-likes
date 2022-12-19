Set-Location $PSScriptRoot
Set-Location ..

Start-Process -FilePath yarn -ArgumentList "dev" -WorkingDirectory "mock-api" -NoNewWindow -Wait

Write-Host
Write-Host Please press any key... -NoNewLine
[Console]::ReadKey() | Out-Null
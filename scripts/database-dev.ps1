Set-Location $PSScriptRoot
Set-Location ..

Start-Process -FilePath docker-compose -ArgumentList "-f docker-compose.only-db.yml up --build -d" -NoNewWindow -Wait
Start-Process -FilePath docker-compose -ArgumentList "-f docker-compose.only-db.yml logs -f" -NoNewWindow -Wait

Write-Host
Write-Host Please press any key... -NoNewLine
[Console]::ReadKey() | Out-Null
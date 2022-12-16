Set-Location $PSScriptRoot
Set-Location ..

Start-Process -FilePath docker-compose -ArgumentList "-f docker-compose.only-db.yml up --build -d" -NoNewWindow -Wait
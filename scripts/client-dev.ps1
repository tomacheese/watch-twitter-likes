Set-Location $PSScriptRoot
Set-Location ..

Start-Process -FilePath yarn -ArgumentList "dev" -WorkingDirectory "web" -NoNewWindow -Wait
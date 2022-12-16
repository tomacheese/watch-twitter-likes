Set-Location $PSScriptRoot
Set-Location ..

$env:CONFIG_PATH = "../data/config.dev.yml"

Start-Process -FilePath yarn -ArgumentList "dev" -WorkingDirectory "crawler" -NoNewWindow -Wait
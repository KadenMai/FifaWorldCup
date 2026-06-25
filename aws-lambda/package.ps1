# Build lambda.zip for AWS Lambda upload.
# Usage: cd aws-lambda && .\package.ps1

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$Package = Join-Path $Root "package"
$Zip = Join-Path $Root "lambda.zip"
$Shared = Join-Path $Root "..\azure-functions\shared"

if (-not (Test-Path $Shared)) {
    throw "Missing shared modules at $Shared"
}

if (Test-Path $Package) { Remove-Item -Recurse -Force $Package }
New-Item -ItemType Directory -Path $Package | Out-Null

pip install -r (Join-Path $Root "requirements.txt") -t $Package --quiet
Copy-Item (Join-Path $Root "lambda_handler.py") $Package
Copy-Item (Join-Path $Shared "github_store.py") $Package
Copy-Item (Join-Path $Shared "score_update_lib.py") $Package

if (Test-Path $Zip) { Remove-Item -Force $Zip }
Compress-Archive -Path (Join-Path $Package "*") -DestinationPath $Zip

Write-Host "Created $Zip - upload to Lambda (handler: lambda_handler.handler)"

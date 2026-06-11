param(
  [string]$RepoOwner = "liuandrew",
  [string]$RepoName = "brandon-portfolio",
  [string]$Branch = "main",
  [string]$InstallDir = "$env:USERPROFILE\brandon-portfolio"
)

$ErrorActionPreference = "Stop"

$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
  $envContent = Get-Content $envPath -Raw
  if ($envContent -match 'GITHUB_PAT=(.+)') {
    $token = $matches[1].Trim()
  }
}

if (-not $token) {
  Write-Host "ERROR: GITHUB_PAT not found in .env file." -ForegroundColor Red
  Write-Host "Create a .env file in the project root with: GITHUB_PAT=your_github_pat" -ForegroundColor Yellow
  exit 1
}

$zipUrl = "https://api.github.com/repos/${RepoOwner}/${RepoName}/zipball/${Branch}"
$zipPath = Join-Path $env:TEMP "${RepoName}.zip"

Write-Host "Downloading ${RepoName} from ${Branch}..." -ForegroundColor Cyan

$headers = @{
  Authorization = "Bearer $token"
  Accept        = "application/vnd.github+json"
}
Invoke-WebRequest -Uri $zipUrl -Headers $headers -OutFile $zipPath

Write-Host "Extracting to ${InstallDir}..." -ForegroundColor Cyan

if (Test-Path $InstallDir) {
  Remove-Item -Path $InstallDir -Recurse -Force
}

Expand-Archive -Path $zipPath -DestinationPath $env:TEMP\temp-repo
$extractedDir = Get-ChildItem -Path "$env:TEMP\temp-repo" -Directory | Select-Object -First 1
Move-Item -Path $extractedDir.FullName -Destination $InstallDir
Remove-Item -Path "$env:TEMP\temp-repo" -Recurse -Force
Remove-Item -Path $zipPath -Force

Write-Host "Running npm install..." -ForegroundColor Cyan
Set-Location $InstallDir
npm install

$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "${RepoName} Admin.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "cmd.exe"
$shortcut.Arguments = "/c npm run admin"
$shortcut.WorkingDirectory = $InstallDir
$shortcut.WindowStyle = 7
$shortcut.Description = "Launch ${RepoName} Admin Server"
$shortcut.Save()

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Desktop shortcut created at: ${shortcutPath}" -ForegroundColor Green
Write-Host "Double-click it to launch the admin server." -ForegroundColor Green

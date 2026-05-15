<#
  .SYNOPSIS
  One-time setup — installs Capacitor CLI globally + Java + checks Android SDK.

  .DESCRIPTION
  Run once on this machine before the first wrap. Subsequent wraps just need
  wrap-vendor.ps1.

  .EXAMPLE
  .\wrap\scripts\install-capacitor.ps1
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host "  StreetLocal Wrap Pipeline — One-Time Setup"
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host ""

# ─── 1. Check Node.js ─────────────────────────────────────────────────
Write-Host "[1/5] Checking Node.js..."
try {
  $nodeVersion = node --version
  Write-Host "      Node $nodeVersion installed."
} catch {
  Write-Host "      Node.js not found. Install from https://nodejs.org (v18 or higher)." -ForegroundColor Red
  exit 1
}

# ─── 2. Install Capacitor CLI globally ────────────────────────────────
Write-Host "[2/5] Installing @capacitor/cli globally..."
npm install -g @capacitor/cli@latest

# ─── 3. Verify Capacitor install ──────────────────────────────────────
Write-Host "[3/5] Verifying Capacitor..."
$capVersion = cap --version
Write-Host "      Capacitor CLI $capVersion installed."

# ─── 4. Check Java (needed for Android builds) ────────────────────────
Write-Host "[4/5] Checking Java (required for Android builds)..."
try {
  $javaVersion = java -version 2>&1 | Select-Object -First 1
  Write-Host "      $javaVersion"
} catch {
  Write-Host "      Java not found. Installing OpenJDK 17 via winget..." -ForegroundColor Yellow
  winget install Microsoft.OpenJDK.17
  Write-Host "      Restart your terminal after install, then re-run this script." -ForegroundColor Yellow
}

# ─── 5. Check Android SDK ─────────────────────────────────────────────
Write-Host "[5/5] Checking Android SDK..."
if (-not $env:ANDROID_HOME) {
  $defaultAndroidHome = "$env:LOCALAPPDATA\Android\Sdk"
  if (Test-Path $defaultAndroidHome) {
    Write-Host "      ANDROID_HOME not set, but found SDK at $defaultAndroidHome" -ForegroundColor Yellow
    Write-Host "      Set ANDROID_HOME permanently via:" -ForegroundColor Yellow
    Write-Host "        [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', '$defaultAndroidHome', 'User')" -ForegroundColor Yellow
  } else {
    Write-Host "      Android SDK not found." -ForegroundColor Red
    Write-Host "      Install Android Studio from https://developer.android.com/studio" -ForegroundColor Red
    Write-Host "      After install, open Android Studio once, accept SDK licenses." -ForegroundColor Red
  }
} else {
  Write-Host "      ANDROID_HOME = $env:ANDROID_HOME"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host "  Setup complete."
Write-Host "═══════════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "To wrap a vendor, run:"
Write-Host "  .\wrap\scripts\wrap-vendor.ps1 -VendorSlug ... -VendorId ... -AppName ... -BundleId ... -PrimaryColor ... -LogoPath ..."
Write-Host ""
Write-Host "See wrap/RUNBOOK.md for the full delivery workflow."
Write-Host ""

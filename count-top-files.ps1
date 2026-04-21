$root = $PSScriptRoot
$extensions = @("*.ts","*.tsx","*.js","*.jsx","*.css")
$excludePatterns = @("node_modules","\.next","dist","build","\.git")

$files = Get-ChildItem -Path $root -Recurse -File -Include $extensions | Where-Object {
    $path = $_.FullName
    $exclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($path -match $pattern) { $exclude = $true; break }
    }
    -not $exclude -and $_.Extension -ne ".d.ts" -and $path -match "study.?planner"
}

$allFiles = @()
foreach ($file in $files) {
    try {
        $lineCount = (Get-Content -LiteralPath $file.FullName -ErrorAction Stop | Measure-Object -Line).Lines
        $relativePath = $file.FullName.Replace("$root\", "")
        $allFiles += [PSCustomObject]@{
            Lineas = $lineCount
            Archivo = $relativePath
        }
    } catch {}
}

$ranges = @(
    @{ Label = "300+"; Min = 300; Color = "Red" },
    @{ Label = "200-299"; Min = 200; Max = 299; Color = "Yellow" },
    @{ Label = "100-199"; Min = 100; Max = 199; Color = "DarkCyan" }
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " STUDY PLANNER - ANALISIS DE ARCHIVOS GRANDES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($range in $ranges) {
    if ($null -ne $range.Max) {
        $filtered = $allFiles | Where-Object { $_.Lineas -ge $range.Min -and $_.Lineas -le $range.Max } | Sort-Object Lineas -Descending
    } else {
        $filtered = $allFiles | Where-Object { $_.Lineas -ge $range.Min } | Sort-Object Lineas -Descending
    }

    Write-Host "========================================" -ForegroundColor $range.Color
    Write-Host " $($range.Label) lineas  ($($filtered.Count) archivos)" -ForegroundColor $range.Color
    Write-Host "========================================" -ForegroundColor $range.Color

    if ($filtered.Count -gt 0) {
        foreach ($f in $filtered) {
            Write-Host ("  {0,6}  {1}" -f $f.Lineas, $f.Archivo) -ForegroundColor $range.Color
        }
    } else {
        Write-Host "  (ninguno)" -ForegroundColor DarkGray
    }
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " RESUMEN - STUDY PLANNER" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$total100 = ($allFiles | Where-Object { $_.Lineas -ge 100 }).Count
$total200 = ($allFiles | Where-Object { $_.Lineas -ge 200 }).Count
$total300 = ($allFiles | Where-Object { $_.Lineas -ge 300 }).Count
$totalAll = $allFiles.Count

Write-Host ""
Write-Host "  Total archivos del Study Planner: $totalAll"
Write-Host "  Archivos con 100+ lineas:         $total100" -ForegroundColor DarkCyan
Write-Host "  Archivos con 200+ lineas:         $total200" -ForegroundColor Yellow
Write-Host "  Archivos con 300+ lineas:         $total300" -ForegroundColor Red
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

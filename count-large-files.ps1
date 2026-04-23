$root = $PSScriptRoot
$extensions = @("*.ts","*.tsx","*.js","*.jsx","*.css")
$excludePatterns = @("node_modules","\.next","dist","build","\.git")

$files = Get-ChildItem -Path $root -Recurse -File -Include $extensions | Where-Object {
    $path = $_.FullName
    $exclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($path -match $pattern) { $exclude = $true; break }
    }
    -not $exclude -and $_.Extension -ne ".d.ts"
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
    @{ Label = "1000+"; Min = 1000; Color = "Red" },
    @{ Label = "900-999"; Min = 900; Max = 999; Color = "Magenta" },
    @{ Label = "800-899"; Min = 800; Max = 899; Color = "Magenta" },
    @{ Label = "700-799"; Min = 700; Max = 799; Color = "Yellow" },
    @{ Label = "600-699"; Min = 600; Max = 699; Color = "DarkYellow" },
    @{ Label = "500-599"; Min = 500; Max = 599; Color = "DarkCyan" },
    @{ Label = "400-499"; Min = 400; Max = 499; Color = "Gray" },
    @{ Label = "300-399"; Min = 300; Max = 399; Color = "DarkGray" },
    @{ Label = "200-299"; Min = 200; Max = 299; Color = "DarkGray" },
    @{ Label = "100-199"; Min = 100; Max = 199; Color = "DarkGray" }
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " PROYECTO COMPLETO - ANALISIS DE ARCHIVOS" -ForegroundColor Cyan
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
Write-Host " RESUMEN GENERAL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$totalAll = $allFiles.Count
$total100 = ($allFiles | Where-Object { $_.Lineas -ge 100 }).Count
$total200 = ($allFiles | Where-Object { $_.Lineas -ge 200 }).Count
$total300 = ($allFiles | Where-Object { $_.Lineas -ge 300 }).Count
$total400 = ($allFiles | Where-Object { $_.Lineas -ge 400 }).Count
$total500 = ($allFiles | Where-Object { $_.Lineas -ge 500 }).Count
$total600 = ($allFiles | Where-Object { $_.Lineas -ge 600 }).Count
$total700 = ($allFiles | Where-Object { $_.Lineas -ge 700 }).Count
$total800 = ($allFiles | Where-Object { $_.Lineas -ge 800 }).Count
$total900 = ($allFiles | Where-Object { $_.Lineas -ge 900 }).Count
$total1000 = ($allFiles | Where-Object { $_.Lineas -ge 1000 }).Count

Write-Host ""
Write-Host "  Total archivos en el proyecto:    $totalAll"
Write-Host "  Archivos con 100+ lineas:         $total100" -ForegroundColor DarkGray
Write-Host "  Archivos con 200+ lineas:         $total200" -ForegroundColor DarkGray
Write-Host "  Archivos con 300+ lineas:         $total300" -ForegroundColor DarkGray
Write-Host "  Archivos con 400+ lineas:         $total400" -ForegroundColor Gray
Write-Host "  Archivos con 500+ lineas:         $total500" -ForegroundColor DarkCyan
Write-Host "  Archivos con 600+ lineas:         $total600" -ForegroundColor DarkYellow
Write-Host "  Archivos con 700+ lineas:         $total700" -ForegroundColor Yellow
Write-Host "  Archivos con 800+ lineas:         $total800" -ForegroundColor Magenta
Write-Host "  Archivos con 900+ lineas:         $total900" -ForegroundColor Magenta
Write-Host "  Archivos con 1000+ lineas:        $total1000" -ForegroundColor Red
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

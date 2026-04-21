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

# Count lines for all files
$allFiles = @()
foreach ($file in $files) {
    $lineCount = (Get-Content $file.FullName | Measure-Object -Line).Lines
    $relativePath = $file.FullName.Replace("$root\", "")
    $allFiles += [PSCustomObject]@{
        Lineas = $lineCount
        Archivo = $relativePath
    }
}

# Define ranges
$ranges = @(
    @{ Label = "1000+"; Min = 1000 },
    @{ Label = "800-999"; Min = 800; Max = 999 },
    @{ Label = "700-799"; Min = 700; Max = 799 },
    @{ Label = "600-699"; Min = 600; Max = 699 },
    @{ Label = "500-599"; Min = 500; Max = 599 },
    @{ Label = "400-499"; Min = 400; Max = 499 }
)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " ANALISIS DE ARCHIVOS GRANDES - SofLIA Learning" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($range in $ranges) {
    if ($range.Max) {
        $filtered = $allFiles | Where-Object { $_.Lineas -ge $range.Min -and $_.Lineas -le $range.Max } | Sort-Object Lineas -Descending
    } else {
        $filtered = $allFiles | Where-Object { $_.Lineas -ge $range.Min } | Sort-Object Lineas -Descending
    }

    $color = switch ($range.Label) {
        "1000+"   { "Red" }
        "800-999" { "Magenta" }
        "700-799" { "Yellow" }
        "600-699" { "DarkYellow" }
        "500-599" { "DarkCyan" }
        "400-499" { "Gray" }
    }

    Write-Host "========================================" -ForegroundColor $color
    Write-Host " $($range.Label) lineas  ($($filtered.Count) archivos)" -ForegroundColor $color
    Write-Host "========================================" -ForegroundColor $color

    if ($filtered.Count -gt 0) {
        foreach ($f in $filtered) {
            Write-Host ("  {0,6}  {1}" -f $f.Lineas, $f.Archivo) -ForegroundColor $color
        }
    } else {
        Write-Host "  (ninguno)" -ForegroundColor DarkGray
    }
    Write-Host ""
}

# Summary table
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " RESUMEN" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$total400 = ($allFiles | Where-Object { $_.Lineas -ge 400 }).Count
$total500 = ($allFiles | Where-Object { $_.Lineas -ge 500 }).Count
$total600 = ($allFiles | Where-Object { $_.Lineas -ge 600 }).Count
$total700 = ($allFiles | Where-Object { $_.Lineas -ge 700 }).Count
$total800 = ($allFiles | Where-Object { $_.Lineas -ge 800 }).Count
$total1000 = ($allFiles | Where-Object { $_.Lineas -ge 1000 }).Count
$totalAll = $allFiles.Count

Write-Host ""
Write-Host "  Total archivos en el proyecto:  $totalAll"
Write-Host "  Archivos con 400+ lineas:       $total400" -ForegroundColor Gray
Write-Host "  Archivos con 500+ lineas:       $total500" -ForegroundColor DarkCyan
Write-Host "  Archivos con 600+ lineas:       $total600" -ForegroundColor DarkYellow
Write-Host "  Archivos con 700+ lineas:       $total700" -ForegroundColor Yellow
Write-Host "  Archivos con 800+ lineas:       $total800" -ForegroundColor Magenta
Write-Host "  Archivos con 1000+ lineas:      $total1000" -ForegroundColor Red
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

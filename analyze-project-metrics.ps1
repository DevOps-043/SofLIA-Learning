$root = $PSScriptRoot

Function Get-SourceFiles {
    param([string]$Path)
    
    $excludeDirs = @("node_modules", ".next", "dist", "build", ".git")
    $extensions = @(".ts", ".tsx", ".js", ".jsx", ".css")
    
    # Files in current dir
    Get-ChildItem -Path $Path -File -ErrorAction SilentlyContinue | Where-Object {
        $ext = $_.Extension
        $extensions -contains $ext -and $_.Name -notmatch "\.d\.ts$"
    }

    # Subdirectories
    Get-ChildItem -Path $Path -Directory -ErrorAction SilentlyContinue | Where-Object {
        $excludeDirs -notcontains $_.Name
    } | ForEach-Object {
        Get-SourceFiles -Path $_.FullName
    }
}

Write-Host "Buscando archivos... (esto puede tomar unos segundos)" -ForegroundColor Gray
$files = Get-SourceFiles -Path $root

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

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " METRICAS DE ARCHIVOS DEL PROYECTO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$totalFiles = $allFiles.Count
$totalLines = ($allFiles | Measure-Object -Property Lineas -Sum).Sum

Write-Host "Total de archivos analizados: $totalFiles" -ForegroundColor Green
Write-Host "Total de lineas de codigo:    $totalLines" -ForegroundColor Green
Write-Host ""

# Group by 100s
$buckets = @{}
foreach ($file in $allFiles) {
    $bucketIndex = [int][math]::Floor($file.Lineas / 100)
    if (-not $buckets.ContainsKey($bucketIndex)) {
        $buckets[$bucketIndex] = @()
    }
    $buckets[$bucketIndex] += $file
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " DISTRIBUCION DE ARCHIVOS POR TAMAÑO" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$sortedKeys = $buckets.Keys | Sort-Object

foreach ($key in $sortedKeys) {
    $min = $key * 100
    if ($key -eq 0) {
        $label = "Menos de 100"
    } else {
        $max = $min + 99
        $label = "$min - $max"
    }
    
    # Adjust padding
    $label = $label.PadRight(15)
    
    $count = $buckets[$key].Count
    
    $color = "Gray"
    if ($key -eq 1) { $color = "DarkCyan" }
    elseif ($key -eq 2) { $color = "Yellow" }
    elseif ($key -ge 3) { $color = "Red" }
    
    Write-Host "Archivos con $label lineas = $count" -ForegroundColor $color
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " TOP 20 ARCHIVOS MAS GRANDES (Candidatos a modularizar)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$topFiles = $allFiles | Sort-Object Lineas -Descending | Select-Object -First 20
foreach ($f in $topFiles) {
    Write-Host ("  {0,6} lineas  |  {1}" -f $f.Lineas, $f.Archivo) -ForegroundColor Red
}

Write-Host ""

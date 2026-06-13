param(
    [string]$OutputPath = "tests/fixtures/excel-scenarios.json"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$outputFile = [System.IO.Path]::GetFullPath((Join-Path $root $OutputPath))
$outputDirectory = Split-Path -Parent $outputFile
New-Item -ItemType Directory -Force $outputDirectory | Out-Null

$scenarios = @()
for ($index = 0; $index -lt 30; $index++) {
    $system = ($index % 6) + 1
    $roof = if ($system -in 1, 2, 6) { ($index % 2) + 1 } else { ($index % 4) + 1 }
    $spanCount = if ($system -in 1, 2, 6) { 1 } else { ($index % 3) + 1 }
    $span1 = 10 + ($index % 5) * 2
    $span2 = if ($spanCount -ge 2) { 12 + ($index % 4) * 2 } else { $null }
    $span3 = if ($spanCount -ge 3) { 14 + ($index % 3) * 2 } else { $null }
    $length = 24 + $index * 2.4
    $step = 4.8 + ($index % 5) * 0.3
    $height = 4 + ($index % 8)

    $cells = [ordered]@{
        "AM5" = if ($index % 5 -eq 0) { 2 } else { 1 }
        "AM6" = ($index % 4) + 1
        "AM7" = $system
        "AM8" = $true
        "AM9" = $false
        "AM10" = $false
        "AM11" = $roof
        "AM12" = $spanCount
        "AM13" = 1
        "AM14" = $false
        "AM15" = $false
        "AM16" = $false
        "AM17" = $false
        "AM18" = $false
        "AM19" = 1
        "AM20" = $false
        "AM21" = 1
        "AM22" = $false
        "AM23" = $false
        "AM24" = $false
        "AM25" = $false
        "AM26" = $false
        "AM27" = $false
        "AM28" = $false
        "AM29" = $false
        "AM30" = $false
        "AM31" = 3
        "AM33" = $false
        "AM34" = $false
        "AM36" = 4
        "AM37" = 2
        "AM38" = $false
        "AM40" = $false
        "AM41" = $false
        "AM42" = $false
        "AM43" = $false
        "AM44" = $false
        "AM45" = $false
        "AM46" = $false
        "AM59" = 3
        "AM60" = 3
        "AM61" = $false
        "AM63" = 1
        "AM65" = $false
        "AM66" = $false
        "AM67" = $false
        "AM68" = $false
        "AM69" = 1
        "AM70" = $false
        "D33" = $spanCount
        "B35" = $span1
        "D35" = $span2
        "F35" = $span3
        "H35" = $null
        "J35" = $null
        "B38" = $length
        "B40" = $step
        "F43" = $height
        "X2" = 0
    }

    $scenarios += [pscustomobject]@{
        id = $index + 1
        description = "system=$system roof=$roof spans=$spanCount"
        cells = $cells
    }
}

[pscustomobject]@{ scenarios = $scenarios } |
    ConvertTo-Json -Depth 8 |
    Set-Content -Encoding UTF8 $outputFile

Write-Output "Wrote $($scenarios.Count) scenarios to $outputFile"

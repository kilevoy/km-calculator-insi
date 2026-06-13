param(
    [string]$OutputPath = "tests/fixtures/excel-feature-scenarios.json"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "tests/fixtures/excel-scenarios.json"
$outputFile = [System.IO.Path]::GetFullPath((Join-Path $root $OutputPath))
$baseline = (Get-Content -Raw -Encoding UTF8 $source | ConvertFrom-Json).scenarios[9].cells

function New-FeatureScenario {
    param([int]$Id, [string]$Feature, [hashtable]$Changes)
    $cells = $baseline | ConvertTo-Json -Depth 8 | ConvertFrom-Json
    foreach ($key in $Changes.Keys) {
        $cells | Add-Member -NotePropertyName $key -NotePropertyValue $Changes[$key] -Force
    }
    [pscustomobject]@{ id = $Id; feature = $Feature; cells = $cells }
}

$items = @(
    @("baseline", @{}),
    @("floor", @{ AM14 = $true; B46 = 12; L46 = 2 }),
    @("floor_different_load", @{ AM14 = $true; B46 = 12; L46 = 3; AM65 = $true }),
    @("mezzanine_1", @{ AM15 = $true; B50 = 12; F50 = 6; L50 = 2 }),
    @("mezzanine_2", @{ AM16 = $true; B54 = 10; F54 = 5; L54 = 2 }),
    @("mezzanine_3", @{ AM17 = $true; B58 = 8; F58 = 5; L58 = 3; AM68 = $true }),
    @("support_crane", @{ AM18 = $true; F61 = 1; AM19 = 1 }),
    @("support_crane_different", @{ AM18 = $true; F61 = 1; AM19 = 2 }),
    @("suspension_crane", @{ AM20 = $true; F66 = 1; AM21 = 1 }),
    @("suspension_crane_different", @{ AM20 = $true; F66 = 1; AM21 = 2 }),
    @("stair_concrete_1", @{ AM23 = $true; F71 = 1 }),
    @("stair_concrete_2", @{ AM24 = $true; F73 = 1 }),
    @("stair_concrete_3", @{ AM25 = $true; F75 = 1 }),
    @("stair_concrete_4", @{ AM26 = $true; F77 = 1 }),
    @("stair_metal_1", @{ AM27 = $true; N71 = 1 }),
    @("stair_metal_2", @{ AM28 = $true; N73 = 1 }),
    @("stair_metal_3", @{ AM29 = $true; N75 = 1 }),
    @("stair_metal_4", @{ AM30 = $true; N77 = 1 }),
    @("roof_profile", @{ AM31 = 1 }),
    @("roof_layered", @{ AM31 = 2 }),
    @("roof_factory", @{ AM31 = 3 }),
    @("roof_pvc", @{ AM31 = 4 }),
    @("roof_snow", @{ AM33 = $true }),
    @("roof_railing", @{ AM34 = $true }),
    @("roof_drainage", @{ AM70 = $true }),
    @("walls_profile", @{ AM36 = 1 }),
    @("walls_layered_150", @{ AM36 = 2; AM37 = 2 }),
    @("walls_factory_horizontal", @{ AM36 = 3; AM69 = 1 }),
    @("walls_factory_vertical", @{ AM36 = 3; AM69 = 2 }),
    @("wall_windows", @{ AM36 = 3; AM38 = $true; W51 = 10; W53 = 3 }),
    @("wall_gates", @{ AM36 = 3; AM40 = $true; W56 = 2; W58 = 2 }),
    @("wall_doors", @{ AM36 = 3; AM41 = $true; W61 = 4; W63 = 2 }),
    @("partition_gvl", @{ AM42 = $true; B81 = 120 }),
    @("partition_layered", @{ AM43 = $true; B85 = 120 }),
    @("partition_factory", @{ AM44 = $true; B88 = 120 }),
    @("partition_openings", @{ AM42 = $true; B81 = 120; AM45 = $true; M81 = 3 }),
    @("partition_gates", @{ AM42 = $true; B81 = 120; AM46 = $true; M85 = 2 }),
    @("parapet_long_one", @{ AM59 = 1 }),
    @("parapet_long_two_overhang", @{ AM59 = 2; AM61 = $true }),
    @("parapet_end_one", @{ AM60 = 1 }),
    @("parapet_end_two", @{ AM60 = 2 }),
    @("fire_resistance_v", @{ AM63 = 2 }),
    @("different_frame_step", @{ AM13 = 2 }),
    @("architecture_section", @{ AM9 = $true }),
    @("architecture_only", @{ AM8 = $false; AM9 = $true })
)

$scenarios = @()
for ($index = 0; $index -lt $items.Count; $index++) {
    $scenarios += New-FeatureScenario -Id ($index + 1) -Feature $items[$index][0] -Changes $items[$index][1]
}

[pscustomobject]@{ scenarios = $scenarios } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $outputFile
Write-Output "Wrote $($scenarios.Count) feature scenarios to $outputFile"

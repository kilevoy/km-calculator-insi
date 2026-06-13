param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath,
    [string]$WorkbookPath = "source/KM_R2_0_1.xlsx"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$workbook = [System.IO.Path]::GetFullPath((Join-Path $root $WorkbookPath))
$inputFile = [System.IO.Path]::GetFullPath((Join-Path $root $InputPath))
$outputFile = [System.IO.Path]::GetFullPath((Join-Path $root $OutputPath))
$payload = Get-Content -Raw -Encoding UTF8 $inputFile | ConvertFrom-Json

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$excel.AskToUpdateLinks = $false

try {
    $book = $excel.Workbooks.Open($workbook, 0, $true)
    $sheet = $book.Worksheets.Item(1)
    $results = @()

    foreach ($scenario in $payload.scenarios) {
        foreach ($property in $scenario.cells.PSObject.Properties) {
            $cell = $sheet.Range($property.Name)
            if ($null -eq $property.Value) {
                $cell.ClearContents() | Out-Null
            }
            elseif ($property.Value -is [bool]) {
                $cell.Value2 = [bool]$property.Value
            }
            elseif ($property.Value -is [ValueType]) {
                $cell.Value2 = [double]$property.Value
            }
            else {
                $cell.Value2 = [string]$property.Value
            }
        }

        $excel.CalculateFullRebuild()
        $selectedColumn = $null
        $selectedCost = -1
        for ($column = $sheet.Range("AO1").Column; $column -le $sheet.Range("BF1").Column; $column++) {
            $candidate = [double]($sheet.Cells.Item(79, $column).Value2)
            if ($candidate -gt $selectedCost) {
                $selectedCost = $candidate
                $selectedColumn = $column
            }
        }
        $componentRows = 4, 6, 10, 12, 13, 14, 15, 16, 17, 18, 20, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 36, 38, 40, 41, 42, 43, 44, 47, 48, 50, 53, 54, 55, 56, 58, 59, 60, 65, 66, 67, 68, 77
        $components = [ordered]@{}
        foreach ($row in $componentRows) {
            $components["row_$row"] = [math]::Round([double]($sheet.Cells.Item($row, $selectedColumn).Value2), 8)
        }
        $results += [pscustomobject]@{
            id = $scenario.id
            cost_thousand_rub = [math]::Round([double]$sheet.Range("Z9").Value2, 6)
            term_days = [math]::Round([double]$sheet.Range("Z10").Value2, 6)
            area_m2 = [math]::Round([double]$sheet.Range("AM3").Value2, 6)
            selected_km_column = $sheet.Cells.Item(1, $selectedColumn).Address($false, $false).Replace("1", "")
            selected_km_components = $components
            active_km_coefficient = [math]::Round([double](($sheet.Range("AO77:BF77").Value2 | ForEach-Object { $_ }) | Measure-Object -Maximum).Maximum, 8)
            active_as_coefficient = [math]::Round([double](($sheet.Range("BL77:CC77").Value2 | ForEach-Object { $_ }) | Measure-Object -Maximum).Maximum, 8)
        }
    }

    $result = [pscustomobject]@{
        workbook = $workbook
        workbook_sha256 = (Get-FileHash -Algorithm SHA256 $workbook).Hash.ToLowerInvariant()
        generated_at = (Get-Date).ToString("o")
        results = $results
    }
    $result | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 $outputFile
    $book.Close($false)
    Write-Output "Excel oracle wrote $($results.Count) results to $outputFile"
}
finally {
    if ($book) {
        try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($book) | Out-Null } catch {}
    }
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

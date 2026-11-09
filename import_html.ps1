<#
.SYNOPSIS
    Pagalbinis skriptas, kuris išanalizuoja seno HTML failo „lisausk_kelion_s (8).html“ struktūrą
    (miestus, pavadinimus, aprašymus, YouTube nuorodas ir laiko žymas) bei atnaujina „keliones.json“.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\import_html.ps1
#>

param(
    [string]$HtmlPath = (Join-Path $PSScriptRoot "lisausk_kelion_s (8).html"),
    [string]$JsonPath = (Join-Path $PSScriptRoot "keliones.json")
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $HtmlPath)) {
    Write-Error "Nerastas HTML failas: $HtmlPath"
    exit 1
}

Write-Host "Nuskaitomas HTML failas: $HtmlPath ..." -ForegroundColor Cyan
$htmlContent = Get-Content -LiteralPath $HtmlPath -Raw -Encoding UTF8

# Ištraukiame visus video objektus iš `const videoData = [ ... ];` (palaiko tiek `...` tiek "..." aprašymus)
$pattern = '\{\s*title:\s*"((?:\\"|[^"])*)"\s*,\s*id:\s*"([^"]+)"[\s\S]*?description:\s*(?:`([^`]*)`|"((?:\\"|[^"])*)")\s*\}'
$matchesList = [regex]::Matches($htmlContent, $pattern)

Write-Host "Rasta YouTube vaizdo įrašų HTML faile: $($matchesList.Count)" -ForegroundColor Green

# Nuskaitome esamą keliones.json (jei egzistuoja), kad išsaugotume patikslintas koordinates ir laiko žymas
if (Test-Path -LiteralPath $JsonPath) {
    $existingData = Get-Content -LiteralPath $JsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
} else {
    $existingData = [PSCustomObject]@{
        visitedCountries = @("LT")
        places           = @()
    }
}

$placesList = [System.Collections.Generic.List[object]]::new()
foreach ($p in $existingData.places) {
    $placesList.Add($p)
}

$visitedSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($code in $existingData.visitedCountries) {
    [void]$visitedSet.Add([string]$code)
}

# Patikriname, ar visi iš HTML ištraukti YouTube ID jau yra įtraukti į keliones.json
$existingVideoIds = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($place in $placesList) {
    if ($null -ne $place.videos) {
        foreach ($v in $place.videos) {
            if ($v.url -match '(?:v=|youtu\.be/|shorts/)([A-Za-z0-9_-]{11})') {
                [void]$existingVideoIds.Add($Matches[1])
            }
        }
    }
}

$addedVideosCount = 0
$nextId = 1
foreach ($place in $placesList) {
    if ([int]$place.id -ge $nextId) {
        $nextId = [int]$place.id + 1
    }
}

foreach ($m in $matchesList) {
    $rawTitle = $m.Groups[1].Value -replace '\\"', '"' -replace '\\n', ' '
    $videoId  = $m.Groups[2].Value.Trim()
    $descVal  = if ($m.Groups[3].Success) { $m.Groups[3].Value } else { $m.Groups[4].Value }
    $rawDesc  = ($descVal -replace '\\"', '"' -replace '\\n', ' ' -replace '\s+', ' ').Trim()
    $videoUrl = "https://www.youtube.com/watch?v=$videoId"

    if (-not $existingVideoIds.Contains($videoId)) {
        $newPlace = [PSCustomObject]@{
            id          = $nextId
            title       = ($rawTitle -split '\|')[0].Trim()
            country     = "Lietuva"
            lat         = 55.9349
            lng         = 23.3137
            date        = (Get-Date -Format "yyyy-MM-dd")
            category    = "Lietuva"
            description = $rawDesc
            travelers   = @("Tomas", "Sandra", "Lukas", "Linas")
            videos      = @(
                [PSCustomObject]@{
                    title = $rawTitle.Trim()
                    url   = $videoUrl
                }
            )
        }
        $placesList.Add($newPlace)
        [void]$existingVideoIds.Add($videoId)
        $nextId++
        $addedVideosCount++
    }
}

$outputObject = [ordered]@{
    visitedCountries = @($visitedSet)
    places           = @($placesList)
}

$jsonOutput = $outputObject | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($JsonPath, $jsonOutput, (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Sėkmingai atnaujintas failas: $JsonPath" -ForegroundColor Green
Write-Host "Iš viso aplankytų šalių (ISO-2): $($visitedSet.Count)" -ForegroundColor Yellow
Write-Host "Iš viso kelionių vietų (places): $($placesList.Count)" -ForegroundColor Yellow
Write-Host "Pridėta naujų dar nebuvusių video: $addedVideosCount" -ForegroundColor Yellow

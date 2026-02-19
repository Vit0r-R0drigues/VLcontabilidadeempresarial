param(
    [string]$Root = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
$htmlFiles = Get-ChildItem -Path $Root -Recurse -File -Filter *.html
$pattern = '(?i)(?<attr>href|src)\s*=\s*[''"](?<path>[^''"]+)[''"]'
$missing = @()

foreach ($file in $htmlFiles) {
    $lineNumber = 0
    Get-Content -Path $file.FullName -Encoding UTF8 | ForEach-Object {
        $lineNumber++
        $line = $_
        $matches = [regex]::Matches($line, $pattern)

        foreach ($match in $matches) {
            $raw = $match.Groups['path'].Value.Trim()

            if ($raw -match '^(https?:|mailto:|tel:|data:|javascript:|#)') { continue }
            if ($raw.StartsWith('//')) { continue }

            $pathPart = $raw.Split('?')[0].Split('#')[0]
            if ([string]::IsNullOrWhiteSpace($pathPart)) { continue }

            $resolved = if ($pathPart.StartsWith('/')) {
                Join-Path $Root ($pathPart.TrimStart('/') -replace '/', [IO.Path]::DirectorySeparatorChar)
            } else {
                Join-Path $file.DirectoryName ($pathPart -replace '/', [IO.Path]::DirectorySeparatorChar)
            }

            if (-not (Test-Path -LiteralPath $resolved)) {
                $missing += [PSCustomObject]@{
                    File      = Resolve-Path -Relative $file.FullName
                    Line      = $lineNumber
                    Attribute = $match.Groups['attr'].Value.ToLower()
                    Reference = $raw
                    Resolved  = $resolved
                }
            }
        }
    }
}

if ($missing.Count -gt 0) {
    Write-Host "Broken local references found:" -ForegroundColor Red
    $missing | Sort-Object File, Line, Reference | Format-Table -AutoSize
    exit 1
}

Write-Host "No broken local href/src references found in HTML files." -ForegroundColor Green
exit 0

param(
    [Parameter(Mandatory = $true)]
    [string]$InputDocx,

    [Parameter(Mandatory = $true)]
    [string]$OutputPdf
)

$resolvedInput = (Resolve-Path -LiteralPath $InputDocx).Path
$outputDirectory = Split-Path -Parent $OutputPdf
if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPdf)

$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.Options.SaveNormalPrompt = $false

    $document = $word.Documents.Open($resolvedInput, $false, $true, $false)
    foreach ($story in $document.StoryRanges) {
        try {
            $null = $story.Fields.Update()
        } catch {
            # Some linked story ranges may not contain updatable fields.
        }
    }
    if ($document.TablesOfContents.Count -gt 0) {
        for ($index = 1; $index -le $document.TablesOfContents.Count; $index++) {
            $document.TablesOfContents.Item($index).Update()
        }
    }

    $pdfFormat = 17
    $document.ExportAsFixedFormat($resolvedOutput, $pdfFormat)
    Write-Output "Exported $resolvedOutput"
}
finally {
    if ($null -ne $document) {
        $document.Close($false)
    }
    if ($null -ne $word) {
        $word.Quit()
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

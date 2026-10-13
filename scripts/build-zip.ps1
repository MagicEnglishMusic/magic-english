Param(
    [string]$DistDir = "dist",
    [string]$OutZip = "magic-english-v4.1-hostinger.zip"
)

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$resolvedDist = (Resolve-Path $DistDir).Path
$resolvedZip = [System.IO.Path]::GetFullPath($OutZip)

if (Test-Path $resolvedZip) {
    Remove-Item $resolvedZip -Force
}

$zipStream = [System.IO.File]::Open($resolvedZip, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $resolvedDist -Recurse | Where-Object { -not $_.PSIsContainer } | ForEach-Object {
    $fullName = $_.FullName
    $rel = $fullName.Substring($resolvedDist.Length + 1).Replace('\', '/')
    $entry = $archive.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $fileStream = [System.IO.File]::OpenRead($fullName)
    $fileStream.CopyTo($entryStream)
    $fileStream.Dispose()
    $entryStream.Dispose()
}

$archive.Dispose()
$zipStream.Dispose()

Copy-Item $resolvedZip 'dist.zip' -Force
Write-Host "Created $OutZip and dist.zip with forward slashes successfully!"

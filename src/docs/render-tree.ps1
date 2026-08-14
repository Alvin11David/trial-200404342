param(
    [string]$InputFile = "TREE.txt",
    [string]$OutputFile = "TREE.png"
)
Add-Type -AssemblyName System.Drawing

$lines = Get-Content -LiteralPath $InputFile

$pad = 40
$lineHeight = 30
$fontSize = 15
$font = New-Object System.Drawing.Font("Consolas", $fontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

# Measure width based on longest line
$width = 0
foreach ($l in $lines) {
    $len = $l.Length * $fontSize * 0.6
    if ($len -gt $width) { $width = $len }
}
$imgW = [int]$width + $pad * 2
$imgH = [int]($lines.Count * $lineHeight) + $pad * 2

$bmp = New-Object System.Drawing.Bitmap($imgW, $imgH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = "AntiAlias"
$g.TextRenderingHint = "AntiAliasGridFit"
$g.Clear([System.Drawing.Color]::FromArgb(30, 30, 45))

$commentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(135, 145, 160))
$dirBrush     = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(86, 180, 233))
$fileBrush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(171, 178, 191))
$headBrush    = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 200, 95))

$y = $pad
foreach ($l in $lines) {
    $raw = $l.TrimEnd()
    $comment = ""
    $idx = $raw.IndexOf('#')
    if ($idx -ge 0) {
        $comment = $raw.Substring($idx)
        $raw = $raw.Substring(0, $idx).TrimEnd()
    }

    $trim = $raw.Trim()
    if ($trim -eq "jambo-pms/" -or $trim -eq "└── frontend/" -or $trim -eq "frontend/") {
        $brush = $headBrush
    } elseif ($trim.EndsWith("/")) {
        $brush = $dirBrush
    } else {
        $brush = $fileBrush
    }

    $g.DrawString($raw, $font, $brush, $pad, $y)

    if ($comment) {
        $cw = $g.MeasureString($raw, $font).Width
        $g.DrawString($comment, $font, $commentBrush, $pad + $cw + 8, $y)
    }
    $y += $lineHeight
}

$g.Dispose()
$bmp.Save($OutputFile, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Wrote $OutputFile ($imgW x $imgH)"
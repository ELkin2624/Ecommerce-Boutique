Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\apaza\.gemini\antigravity-ide\brain\36cb950f-98c9-47d0-a7b1-e727a3152efe\blouse_basic_1789426461383.jpg"
$destPath = "C:\Parcial-si2\movil\assets\garments\tops\blouse-basic.png"

$srcBmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $srcBmp.Width
$height = $srcBmp.Height

$destBmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Flood fill or threshold mask from exterior
# Background is light (checkerboard: ~200 to ~255), blouse is dark black (~15 to ~50)
for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $c = $srcBmp.GetPixel($x, $y)
        $brightness = ($c.R + $c.G + $c.B) / 3.0

        if ($brightness -gt 150) {
            # Completely transparent background
            $destBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($brightness -gt 90) {
            # Smooth anti-aliased edge
            $alpha = [int](255.0 * (150.0 - $brightness) / 60.0)
            if ($alpha -lt 0) { $alpha = 0 }
            if ($alpha -gt 255) { $alpha = 255 }
            $destBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        } else {
            # Fully opaque blouse fabric
            $destBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
        }
    }
}

$destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Dispose()
$srcBmp.Dispose()

Write-Output "Garment processed successfully: $destPath ($width x $height)"

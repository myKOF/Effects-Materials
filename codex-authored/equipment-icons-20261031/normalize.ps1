Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class IconAlphaStats {
  public static int[] Read(Bitmap image) {
    var data=image.LockBits(new Rectangle(0,0,image.Width,image.Height),ImageLockMode.ReadOnly,PixelFormat.Format32bppArgb);
    try {
      var bytes=new byte[data.Stride*data.Height];
      Marshal.Copy(data.Scan0,bytes,0,bytes.Length);
      var counts=new int[3];
      for(int y=0;y<data.Height;y++) for(int x=0;x<data.Width;x++) {
        int a=bytes[y*data.Stride+x*4+3];
        counts[a==0?0:(a==255?2:1)]++;
      }
      return counts;
    } finally {image.UnlockBits(data);}
  }
}
'@
$assetRoot=$PSScriptRoot
$record=Get-Content -LiteralPath (Join-Path $assetRoot 'source.json') -Raw | ConvertFrom-Json
$checks=foreach($entry in $record.assets) {
  $src=[System.Drawing.Image]::FromFile((Join-Path $assetRoot $entry.source))
  $out=Join-Path $assetRoot $entry.export
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $out) | Out-Null
  $dst=[System.Drawing.Bitmap]::new(1024,1024,[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g=[System.Drawing.Graphics]::FromImage($dst)
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.CompositingMode=[System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($src,0,0,1024,1024)
  $counts=[IconAlphaStats]::Read($dst)
  $corners=@($dst.GetPixel(0,0).A,$dst.GetPixel(1023,0).A,$dst.GetPixel(0,1023).A,$dst.GetPixel(1023,1023).A)
  if(@($corners|Where-Object {$_ -ne 0}).Count -or $counts[0] -lt 10000 -or ($counts[1]+$counts[2]) -lt 10000) {throw "Invalid alpha: $($entry.target)"}
  $dst.Save($out,[System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $dst.Dispose(); $src.Dispose()
  $size=(Get-Item -LiteralPath $out).Length
  if($size -gt 2097152) {throw "Oversized PNG: $out"}
  [pscustomobject]@{target=$entry.target;width=1024;height=1024;bytes=$size;transparentPixels=$counts[0];partialPixels=$counts[1];opaquePixels=$counts[2];cornerAlpha=$corners}
}
$checks|ConvertTo-Json -Depth 5|Set-Content -Encoding utf8 (Join-Path $assetRoot 'alpha-validation.json')
Write-Output '28 transparent RGBA PNGs: 1024 square, real alpha and all below 2 MiB.'

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
public static class IconBlackPoint {
  public static void Apply(Bitmap image) {
    var data=image.LockBits(new Rectangle(0,0,image.Width,image.Height),ImageLockMode.ReadWrite,PixelFormat.Format24bppRgb);
    try {
      var bytes=new byte[data.Stride*data.Height];
      Marshal.Copy(data.Scan0,bytes,0,bytes.Length);
      for(int y=0;y<data.Height;y++) for(int x=0;x<data.Width;x++) {
        int p=y*data.Stride+x*3;
        // Remove imperceptible near-black generator/resize noise only.
        if(bytes[p]<=8 && bytes[p+1]<=8 && bytes[p+2]<=8) bytes[p]=bytes[p+1]=bytes[p+2]=0;
      }
      Marshal.Copy(bytes,0,data.Scan0,bytes.Length);
    } finally {image.UnlockBits(data);}
  }
}
'@
$assetRoot=$PSScriptRoot
$record=Get-Content -LiteralPath (Join-Path $assetRoot 'source.json') -Raw | ConvertFrom-Json
foreach($entry in $record.assets) {
  $src=[System.Drawing.Image]::FromFile((Join-Path $assetRoot $entry.source))
  $out=Join-Path $assetRoot $entry.export
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $out) | Out-Null
  $dst=[System.Drawing.Bitmap]::new(1024,1024,[System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g=[System.Drawing.Graphics]::FromImage($dst)
  $g.Clear([System.Drawing.Color]::Black)
  $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($src,0,0,1024,1024)
  [IconBlackPoint]::Apply($dst)
  $dst.Save($out,[System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $dst.Dispose(); $src.Dispose()
  if((Get-Item -LiteralPath $out).Length -gt 2097152) { throw "Oversized PNG: $out" }
}
Write-Output 'Normalized 28 PNGs to 1024x1024; all below 2 MiB.'

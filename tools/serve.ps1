# Petit serveur local pour prévisualiser le site : http://localhost:8080
# Usage : powershell -ExecutionPolicy Bypass -File tools/serve.ps1
param([string]$Root = (Split-Path -Parent $PSScriptRoot), [int]$Port = 8080)
$types = @{ ".html"="text/html; charset=utf-8"; ".css"="text/css"; ".js"="application/javascript"; ".mjs"="application/javascript"; ".wasm"="application/wasm"; ".onnx"="application/octet-stream"; ".png"="image/png"; ".jpg"="image/jpeg"; ".mp4"="video/mp4"; ".webm"="video/webm"; ".svg"="image/svg+xml"; ".xml"="application/xml"; ".txt"="text/plain; charset=utf-8" }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/"); $l.Start()
Write-Host "Serving $Root on http://localhost:$Port"
while ($l.IsListening) {
  $ctx = $l.GetContext()
  # Enregistrement d'une image générée par tools/detourage.html (uniquement des .png dans assets/staff)
  if ($ctx.Request.HttpMethod -eq "POST" -and $ctx.Request.Url.AbsolutePath -eq "/__save") {
    $name = $ctx.Request.QueryString["file"]
    # … ou d'une vidéo exportée par motion-media.html (uniquement des .mp4 dans exports)
    $dir = $(if ($name -match '^[a-z0-9-]+\.png$') { "assets\staff" } elseif ($name -match '^[a-z0-9-]+\.mp4$') { "exports" } else { $null })
    if ($dir) {
      $ms = New-Object IO.MemoryStream; $ctx.Request.InputStream.CopyTo($ms)
      New-Item -ItemType Directory -Force (Join-Path $Root $dir) | Out-Null
      [IO.File]::WriteAllBytes((Join-Path $Root "$dir\$name"), $ms.ToArray())
      $ctx.Response.StatusCode = 200
    } else { $ctx.Response.StatusCode = 400 }
    $ctx.Response.Close(); continue
  }
  $p = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/')); if (-not $p) { $p = "index.html" }
  $f = Join-Path $Root $p
  if (Test-Path $f -PathType Leaf) {
    $b = [IO.File]::ReadAllBytes($f); $ext = [IO.Path]::GetExtension($f)
    $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
    $ctx.Response.Headers.Add("Cache-Control", "no-store")  # toujours servir la dernière version des fichiers
    $ctx.Response.OutputStream.Write($b, 0, $b.Length)
  } else {
    # Page introuvable : on renvoie 404.html, comme le fera l'hébergeur
    $ctx.Response.StatusCode = 404
    $nf = Join-Path $Root "404.html"
    if (Test-Path $nf) { $b = [IO.File]::ReadAllBytes($nf); $ctx.Response.ContentType = "text/html; charset=utf-8"; $ctx.Response.OutputStream.Write($b, 0, $b.Length) }
  }
  $ctx.Response.Close()
}

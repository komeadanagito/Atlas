$files = @(
  'E:\p_p\Atlas\apps\web\src\styles\index.css',
  'E:\p_p\Atlas\apps\web\src\features\ai\AiPage.tsx',
  'E:\p_p\Atlas\apps\web\src\features\ai\ui\Composer.tsx',
  'E:\p_p\Atlas\apps\web\src\features\ai\ui\FindBar.tsx',
  'E:\p_p\Atlas\apps\web\src\features\ai\ui\Sidebar.tsx',
  'E:\p_p\Atlas\apps\web\src\features\ai\ui\Transcript.tsx',
  'E:\p_p\Atlas\apps\web\src\features\ai\Markdown.tsx',
  'E:\p_p\Atlas\apps\web\src\features\ai\useChat.ts',
  'E:\p_p\Atlas\apps\web\src\features\ai\model.ts',
  'E:\p_p\Atlas\apps\web\src\features\ai\api.ts',
  'E:\p_p\Atlas\apps\web\src\features\ai\findInChat.ts',
  'E:\p_p\Atlas\apps\web\src\features\ai\time.ts',
  'E:\p_p\Atlas\apps\web\src\features\ai\model.test.tsx'
)
$enc = New-Object System.Text.UTF8Encoding($false)
foreach ($f in $files) {
  $t = [System.IO.File]::ReadAllText($f)
  [System.IO.File]::WriteAllText($f, $t, $enc)
  Write-Output "done: $f"
}
# verify no BOM
foreach ($f in $files) {
  $b = [System.IO.File]::ReadAllBytes($f)
  $bom = ($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF)
  Write-Output ("BOM={0} {1}" -f $bom, $f)
}
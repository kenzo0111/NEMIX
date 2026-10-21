$ErrorActionPreference = 'Stop'
$toolPath = Join-Path $PSScriptRoot '../../../provision_usb.ps1'
$tokens = $null; $parseErrors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile((Resolve-Path $toolPath),[ref]$tokens,[ref]$parseErrors)
if ($parseErrors.Count) { throw "PowerShell syntax errors: $parseErrors" }
$requestFunction = $ast.Find({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Invoke-UsbRequest' },$true)
Invoke-Expression $requestFunction.Extent.Text
$selectionFunction = $ast.Find({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Get-WifiProfileSelection' },$true)
Invoke-Expression $selectionFunction.Extent.Text

class FakeUsbConnection {
    [string]$Written
    [Collections.Generic.Queue[string]]$Lines = [Collections.Generic.Queue[string]]::new()
    [void]Write([string]$value) { $this.Written = $value }
    [string]ReadLine() {
        if (!$this.Lines.Count) { throw [TimeoutException]::new() }
        return $this.Lines.Dequeue()
    }
}
function Assert-Check([bool]$condition,[string]$message) { if (!$condition) { throw $message } }
function Expect-Failure([scriptblock]$body,[string]$message) {
    $failed = $false
    try { & $body | Out-Null } catch { $failed = $_.Exception.Message -like "*$message*" }
    Assert-Check $failed "Expected failure containing: $message"
}

$fake = [FakeUsbConnection]::new()
$fake.Lines.Enqueue('[RFID] reader ready')
$fake.Lines.Enqueue('USB-SETUP {"progress":"Verifying Wi-Fi and server"}')
$fake.Lines.Enqueue('USB-SETUP {"ok":true,"protocol":1,"reader_ready":true}')
$request = @{ action='provision'; wifi_ssid='Office café'; wifi_password='quote"slash\123'; device_token='test-secret-123456' }
$result = Invoke-UsbRequest $fake $request 1
Assert-Check ($result.ok -and $result.reader_ready) 'Logs/progress should not be mistaken for a final response'
Assert-Check ($fake.Written.StartsWith("`nu{") -and $fake.Written.EndsWith("`n")) 'Request framing failed'
$decoded = $fake.Written.Trim().Substring(1) | ConvertFrom-Json
Assert-Check ($decoded.wifi_ssid -eq $request.wifi_ssid -and $decoded.wifi_password -eq $request.wifi_password) 'JSON escaping/Unicode round trip failed'

$rejected = [FakeUsbConnection]::new()
$rejected.Lines.Enqueue('USB-SETUP {"ok":false,"error":"Setup not committed"}')
Expect-Failure { Invoke-UsbRequest $rejected @{ action='provision' } 1 } 'Setup not committed'
Expect-Failure { Invoke-UsbRequest ([FakeUsbConnection]::new()) @{ action='status' } 0 } 'No USB setup response'
$oversized = [FakeUsbConnection]::new()
Expect-Failure { Invoke-UsbRequest $oversized @{ action='provision'; wifi_ssid=('é' * 600) } 1 } 'request limit'
Assert-Check (!$oversized.Written) 'Oversized UTF-8 request must not be transmitted'

# A menu number must select the corresponding SSID, never the displayed label.
function Read-Host { return $script:menuAnswer }
$savedStatus = [pscustomobject]@{ profiles=@([pscustomobject]@{ssid='Home'},[pscustomobject]@{ssid='Office café'}) }
$script:menuAnswer = '2'
Assert-Check ((Get-WifiProfileSelection $savedStatus) -eq 'Office café') 'Menu selected the wrong network'
$script:menuAnswer = '0'
Expect-Failure { Get-WifiProfileSelection $savedStatus } 'Invalid network number'
$script:menuAnswer = 'abc'
Expect-Failure { Get-WifiProfileSelection $savedStatus } 'Invalid network number'
Expect-Failure { Get-WifiProfileSelection ([pscustomobject]@{profiles=@()}) } 'No saved networks'
Remove-Item Function:Read-Host
Write-Host 'USB tool checks passed.'

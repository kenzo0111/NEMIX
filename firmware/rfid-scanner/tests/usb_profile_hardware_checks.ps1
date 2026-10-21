# Optional physical-board checks. Uses a temporary profile and removes it afterward.
[CmdletBinding()]
param([string]$Port='COM11')
$ErrorActionPreference = 'Stop'
$tokens = $null; $parseErrors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile((Resolve-Path (Join-Path $PSScriptRoot '../../../provision_usb.ps1')),[ref]$tokens,[ref]$parseErrors)
$functionAst = $ast.Find({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Invoke-UsbRequest' },$true)
Invoke-Expression $functionAst.Extent.Text
function Assert-Hardware([bool]$condition,[string]$message) { if (!$condition) { throw $message } }
$connection = [IO.Ports.SerialPort]::new($Port,115200,[IO.Ports.Parity]::None,8,[IO.Ports.StopBits]::One)
$connection.Encoding = [Text.UTF8Encoding]::new($false)
$connection.DtrEnable = $false; $connection.RtsEnable = $false
$connection.ReadTimeout = 1000; $connection.WriteTimeout = 5000
$testSsid = 'USB-TEST-' + [Guid]::NewGuid().ToString('N').Substring(0,20)
$profileCreated = $false
try {
    $connection.Open()
    $before = Invoke-UsbRequest $connection @{ action='status' } 60
    Assert-Hardware ($before.profile_capacity -eq 8 -and $before.wifi_connected -and $before.configured) 'Requires firmware 2.7.0+, configured and connected board'
    Assert-Hardware ($before.wifi_ssid -in @($before.profiles.ssid)) 'Existing active network was not imported'
    Assert-Hardware (@($before.profiles).Count -lt 8) 'One unused profile slot is needed for this check'
    $saved = Invoke-UsbRequest $connection @{ action='profile_save'; wifi_ssid=$testSsid; wifi_password='usb-test-password' } 60
    $profileCreated = $true
    Assert-Hardware ($saved.wifi_ssid -eq $before.wifi_ssid -and $saved.wifi_connected -and $testSsid -in @($saved.profiles.ssid)) 'Saving changed active Wi-Fi or did not add the profile'
    foreach ($profile in $saved.profiles) {
        Assert-Hardware ($null -eq $profile.password -and $null -eq $profile.wifi_password -and $null -eq $profile.device_token) 'Status exposed private credentials'
    }
    Write-Host 'Profile save/list checks passed; active network unchanged.'

    $selectionFailed = $false
    try { Invoke-UsbRequest $connection @{ action='profile_select'; wifi_ssid=$testSsid } 180 | Out-Null }
    catch { if ($_.Exception.Message -notlike '*Setup not committed*') { throw }; $selectionFailed = $true }
    Assert-Hardware $selectionFailed 'Unavailable test network was unexpectedly selected'
    $restored = Invoke-UsbRequest $connection @{ action='status' } 60
    Assert-Hardware ($restored.wifi_ssid -eq $before.wifi_ssid -and $restored.wifi_connected) 'Failed selection did not restore previous connection'
    Write-Host 'Unavailable network selection rolled back successfully.'

    $connection.RtsEnable = $true
    Start-Sleep -Milliseconds 150
    $connection.RtsEnable = $false
    Start-Sleep -Seconds 2
    $restarted = Invoke-UsbRequest $connection @{ action='status' } 60
    Assert-Hardware ($testSsid -in @($restarted.profiles.ssid) -and $restarted.wifi_ssid -eq $before.wifi_ssid -and $restarted.wifi_connected) 'Profiles/selection did not persist across restart'
    Write-Host 'Profile persistence across restart verified.'
    $selected = Invoke-UsbRequest $connection @{ action='profile_select'; wifi_ssid=$before.wifi_ssid } 180
    Assert-Hardware ($selected.wifi_connected -and $selected.wifi_ssid -eq $before.wifi_ssid) 'Saved network selection failed'
    $activeDeleteRejected = $false
    try { Invoke-UsbRequest $connection @{ action='profile_delete'; wifi_ssid=$before.wifi_ssid } 60 | Out-Null }
    catch { if ($_.Exception.Message -notlike '*Cannot delete the active network*') { throw }; $activeDeleteRejected = $true }
    Assert-Hardware $activeDeleteRejected 'Active network deletion must be rejected'
    Write-Host 'Saved network selection and active-profile protection passed.'
} finally {
    try {
        if ($profileCreated -and $connection.IsOpen) {
            $cleaned = Invoke-UsbRequest $connection @{ action='profile_delete'; wifi_ssid=$testSsid } 60
            Assert-Hardware ($testSsid -notin @($cleaned.profiles.ssid)) 'Temporary profile was not removed'
            Write-Host 'Temporary profile removed.'
        }
    } finally {
        if ($connection.IsOpen) { $connection.Close() }
        $connection.Dispose()
    }
}
Write-Host 'USB Wi-Fi profile hardware checks passed.'

# Configure or recover an RFID scanner over USB without joining its hotspot.
[CmdletBinding()]
param(
    [string]$Port,
    [switch]$StatusOnly,
    [switch]$ListNetworks,
    [string]$SelectNetwork
)
$ErrorActionPreference = 'Stop'
$availablePorts = @([System.IO.Ports.SerialPort]::GetPortNames())
if (!$Port) {
    if ($availablePorts.Count -ne 1) { throw "Specify -Port COMx. Available ports: $($availablePorts -join ', ')" }
    $Port = $availablePorts[0]
}

function Read-PrivateValue([string]$Prompt) {
    $secureValue = Read-Host $Prompt -AsSecureString
    $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer); $secureValue.Dispose() }
}

function Invoke-UsbRequest($Connection, $Request, [int]$TimeoutSeconds) {
    $encodedRequest = $Request | ConvertTo-Json -Compress -Depth 4
    if ([Text.Encoding]::UTF8.GetByteCount($encodedRequest) -gt 1024) { throw 'Settings exceed the USB request limit.' }
    # Leading LF clears any incomplete request from an interrupted previous run.
    $Connection.Write("`nu$encodedRequest`n")
    $requestTimer = [Diagnostics.Stopwatch]::StartNew()
    while ($requestTimer.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
        try { $responseLine = $Connection.ReadLine().TrimEnd("`r") }
        catch [TimeoutException] { continue }
        if (!$responseLine.StartsWith('USB-SETUP ')) { continue }
        $reply = $responseLine.Substring(10) | ConvertFrom-Json
        if ($reply.progress) { Write-Host $reply.progress; continue }
        if (!$reply.ok) { throw "Scanner: $($reply.error)" }
        return $reply
    }
    throw 'No USB setup response. Install firmware 2.6.0+, release the scan trigger, and close other serial monitors. If saving was in progress, check -StatusOnly before retrying.'
}

function Show-WifiProfiles($Status) {
    $savedProfiles = @($Status.profiles)
    Write-Host "Saved Wi-Fi networks ($($savedProfiles.Count)/$($Status.profile_capacity)):"
    for ($profileIndex=0; $profileIndex -lt $savedProfiles.Count; $profileIndex++) {
        $profile = $savedProfiles[$profileIndex]
        $activeLabel = if ($profile.active) { ' [active]' } else { '' }
        $securityLabel = if ($profile.open_network) { 'open' } else { 'password saved' }
        Write-Host "  $($profileIndex+1). $($profile.ssid) ($securityLabel)$activeLabel"
    }
}

function Get-WifiProfileSelection($Status) {
    $savedProfiles = @($Status.profiles)
    if (!$savedProfiles.Count) { throw 'No saved networks. Add a network first.' }
    $selection = Read-Host 'Network number'
    $selectionNumber = 0
    if (![int]::TryParse($selection,[ref]$selectionNumber) -or $selectionNumber -lt 1 -or $selectionNumber -gt $savedProfiles.Count) { throw 'Invalid network number.' }
    return $savedProfiles[$selectionNumber-1].ssid
}

$connection = [IO.Ports.SerialPort]::new($Port,115200,[IO.Ports.Parity]::None,8,[IO.Ports.StopBits]::One)
$connection.Encoding = [Text.UTF8Encoding]::new($false)
$connection.DtrEnable = $false
$connection.RtsEnable = $false
$connection.ReadTimeout = 1000
$connection.WriteTimeout = 5000
try {
    $connection.Open()
    $status = Invoke-UsbRequest $connection @{ action='status' } 60
    if ($status.protocol -ne 1) { throw 'Unsupported USB provisioning protocol.' }
    Write-Host "Firmware $($status.firmware); device $($status.device_id); Wi-Fi connected: $($status.wifi_connected); reader ready: $($status.reader_ready)"
    Write-Host "Saved network: $($status.wifi_ssid); server: $($status.server_url)"
    if ($null -ne $status.profile_capacity) { Show-WifiProfiles $status }
    if ($StatusOnly) { return }
    if ($null -eq $status.profile_capacity) { throw 'Saved Wi-Fi profiles require firmware 2.7.0 or later.' }
    if (!$status.profiles_available) { throw 'Saved Wi-Fi profile storage is unavailable. Active settings remain separate; inspect the device before adding networks.' }
    if ($ListNetworks) { return }
    if ($SelectNetwork) {
        if ($SelectNetwork -cnotin @($status.profiles | ForEach-Object { $_.ssid })) { throw 'That network is not saved. Run the interactive tool to add it first.' }
        $menuChoice = '3'
    } else {
        Write-Host '1. Configure a network and connect (also saves it)'
        Write-Host '2. Add/update a saved network without connecting'
        Write-Host '3. Select a saved network to use'
        Write-Host '4. Delete a saved network'
        Write-Host '5. Exit'
        $menuChoice = Read-Host 'Choose [1-5]'
    }
    if ($menuChoice -eq '5') { return }
    if ($menuChoice -eq '3' -or $menuChoice -eq '4') {
        $selectedSsid = if ($SelectNetwork) { $SelectNetwork } else { Get-WifiProfileSelection $status }
        $profileAction = if ($menuChoice -eq '3') { 'profile_select' } else { 'profile_delete' }
        $result = Invoke-UsbRequest $connection @{ action=$profileAction; wifi_ssid=$selectedSsid } 180
        if ($menuChoice -eq '3') { Write-Host "Selected '$selectedSsid'. Wi-Fi connected: $($result.wifi_connected); reader ready: $($result.reader_ready)" -ForegroundColor Green }
        else { Write-Host "Deleted '$selectedSsid'." }
        Show-WifiProfiles $result
        return
    }
    if ($menuChoice -notin @('1','2')) { throw 'Invalid menu choice.' }

    $networkName = Read-Host 'Wi-Fi name (blank keeps saved network)'
    if (!$networkName) { $networkName = $status.wifi_ssid }
    if (!$networkName) { throw 'A Wi-Fi name is required.' }
    $openNetwork = (Read-Host 'Is this an open network without a password? [y/N]') -match '^(?i:y|yes)$'
    $networkPassword = ''
    if (!$openNetwork) { $networkPassword = Read-PrivateValue 'Wi-Fi password (blank keeps password only for the same network)' }
    if (!$openNetwork -and $networkName -cne $status.wifi_ssid -and !$networkPassword) { throw 'Enter a password for the new network, or select an open network.' }
    if ($menuChoice -eq '2') {
        $result = Invoke-UsbRequest $connection @{
            action='profile_save'; wifi_ssid=$networkName; wifi_password=$networkPassword; open_network=$openNetwork
        } 60
        Write-Host "Saved '$networkName'. Active network remains '$($result.wifi_ssid)'." -ForegroundColor Green
        Show-WifiProfiles $result
        return
    }
    $serverAddress = Read-Host "HTTPS server URL (blank keeps $($status.server_url))"
    if (!$serverAddress) { $serverAddress = $status.server_url }
    $scannerIdentity = Read-Host "Device ID registered in NEMIX (blank keeps $($status.device_id))"
    if (!$scannerIdentity) { $scannerIdentity = $status.device_id }
    $deviceSecret = Read-PrivateValue 'NEMIX device signing secret (blank keeps saved secret)'
    if (!$status.configured -and !$deviceSecret) { throw 'First-time setup requires the NEMIX device signing secret.' }
    Write-Host "Applying network '$networkName' and server '$serverAddress' for '$scannerIdentity'..."
    $result = Invoke-UsbRequest $connection @{
        action='provision'; wifi_ssid=$networkName; wifi_password=$networkPassword
        open_network=$openNetwork; server_url=$serverAddress
        device_id=$scannerIdentity; device_token=$deviceSecret
    } 180
    Write-Host "Setup verified and saved. Wi-Fi connected: $($result.wifi_connected); reader ready: $($result.reader_ready)" -ForegroundColor Green
} finally {
    $networkPassword = $null; $deviceSecret = $null
    if ($connection.IsOpen) { $connection.Close() }
    $connection.Dispose()
}

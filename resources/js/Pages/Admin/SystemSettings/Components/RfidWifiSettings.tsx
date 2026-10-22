import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Check, Eye, EyeOff, Loader2, LockKeyhole, RefreshCw, Wifi } from 'lucide-react';
import { RfidDeviceConfiguration } from '../types';

interface Props {
    device: RfidDeviceConfiguration;
    ssid: string;
    password: string;
    open: boolean;
    apply: boolean;
    busy: boolean;
    errors: Record<string, string>;
    onChange: (values: { wifi_ssid?: string; wifi_password?: string; wifi_open_network?: boolean; wifi_apply?: boolean }) => void;
}

export default function RfidWifiSettings({ device, ssid, password, open, apply, busy, errors, onChange }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [manual, setManual] = useState(false);
    const [requestId, setRequestId] = useState<string | null>(null);
    const [requesting, setRequesting] = useState(false);
    const [message, setMessage] = useState('');
    const passwordRef = useRef<HTMLInputElement>(null);
    const mounted = useRef(true);
    const automaticallyRequested = useRef(false);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const supported = Number(device.firmware_version?.split('.')[0]) > 2 || (Number(device.firmware_version?.split('.')[0]) === 2 && Number(device.firmware_version?.split('.')[1]) >= 5);
    const scan = device.wifi_scan;
    const fresh = !!scan && Date.now() - new Date(scan.scanned_at).getTime() < 120000;
    const networks = fresh && supported && device.status === 'online' ? scan!.networks : [];
    const waiting = requesting || !!requestId;
    useEffect(() => {
        if (requestId && scan?.request_id === requestId) {
            setRequestId(null);
            setMessage(scan.networks.length ? 'Networks refreshed. Select one below.' : 'No networks found. Move the scanner closer to your router and refresh.');
        }
    }, [requestId, scan]);
    useEffect(() => {
        if (!requestId) return;
        const timeout = window.setTimeout(() => {
            setRequestId(null);
            setMessage('The scanner has not returned a network list yet. Release its trigger, keep it connected, and try refreshing again.');
        }, Math.max(45000, device.heartbeat_interval * 2000 + 20000));
        return () => window.clearTimeout(timeout);
    }, [requestId, device.heartbeat_interval]);
    const refresh = async () => {
        setRequesting(true); setMessage('');
        try {
            const response = await axios.post(route('system.settings.rfid-devices.wifi-scan', { device: device.id }));
            if (mounted.current) setRequestId(response.data.request_id);
        } catch (error: any) {
            if (mounted.current) setMessage(error.response?.data?.message || 'Unable to refresh networks. Try again.');
        } finally { if (mounted.current) setRequesting(false); }
    };
    useEffect(() => {
        if (supported && device.status === 'online' && !fresh && !automaticallyRequested.current) {
            automaticallyRequested.current = true;
            void refresh();
        }
    }, [supported, device.status]);
    const choose = (network: { ssid: string; secure: boolean }) => {
        onChange({ wifi_ssid: network.ssid, wifi_password: network.ssid === ssid ? password : '', wifi_open_network: !network.secure, wifi_apply: false });
        if (network.secure) passwordRef.current?.focus();
    };
    const fieldClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-red-800 focus:ring-2 focus:ring-red-800/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
    return <fieldset disabled={busy} className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-900/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h4 className="text-base flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100"><Wifi className="h-4 w-4"/>Wi-Fi connection</h4><p className="leading-relaxed mt-1 text-sm text-slate-500 dark:text-slate-400">1. Choose a network near the scanner. 2. Enter its password. 3. Save &amp; Apply Configuration.</p></div>
            <button type="button" onClick={refresh} disabled={waiting || device.status !== 'online' || !supported} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{waiting ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}{waiting ? 'Finding networks…' : 'Refresh networks'}</button>
        </div>
        <div aria-live="polite" className="text-sm text-slate-600 dark:text-slate-400">
            {device.status !== 'online' ? 'Scanner offline. Turn it on and connect it to Wi-Fi to find nearby networks.' : !supported ? 'Nearby network discovery requires scanner firmware 2.5.0 or newer.' : waiting ? 'Waiting for the scanner. Keep it connected and release the trigger; this may take two heartbeat intervals.' : message || (fresh ? `Last scan: ${new Date(scan!.scanned_at).toLocaleTimeString()}. Networks are sorted by signal strength.` : 'Click Refresh networks to find available Wi-Fi networks.')}
        </div>
        {networks.length > 0 && <div role="group" aria-label="Available Wi-Fi networks" className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {networks.map(network => <button key={network.ssid} type="button" aria-pressed={ssid === network.ssid} onClick={() => choose(network)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-red-700 ${ssid === network.ssid ? 'border-red-800 bg-red-50 dark:border-red-500 dark:bg-red-950/30' : 'border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-500'}`}>
                <Wifi className={`h-5 w-5 shrink-0 ${network.rssi >= -60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}/><span className="min-w-0 flex-1"><span className="block break-all text-sm font-semibold text-slate-900 dark:text-slate-100">{network.ssid}</span><span className="mt-1 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">{network.secure && <LockKeyhole className="h-3 w-3"/>}{network.secure ? 'Password required' : 'Open network'} · {network.rssi >= -60 ? 'Strong' : network.rssi >= -75 ? 'Good' : 'Weak'} signal</span></span>{ssid === network.ssid && <Check className="h-4 w-4 shrink-0 text-red-800 dark:text-red-400"/>}
            </button>)}
        </div>}
        <div className="rounded-xl bg-white p-3 text-sm dark:bg-slate-800"><span className="text-slate-500 dark:text-slate-400">Selected network</span><strong className="mt-1 block break-all text-slate-900 dark:text-slate-100">{ssid || 'Keep scanner’s current Wi-Fi'}</strong>{device.connected_ssid && <p className="mt-1 text-slate-500 dark:text-slate-400">Currently connected: {device.connected_ssid}</p>}</div>
        <button type="button" onClick={() => setManual(!manual)} aria-expanded={manual} className="text-sm font-semibold text-red-800 underline underline-offset-4 dark:text-red-400">{manual ? 'Hide manual network entry' : 'Hidden network or network not listed?'}</button>
        {manual && <div className="space-y-3"><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Network name (SSID)<input className={fieldClass} value={ssid} onChange={e => onChange({ wifi_ssid: e.target.value, wifi_password: '', wifi_open_network: false, wifi_apply: false })}/></label><p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400">Enter the exact network name. Leave it empty to keep the scanner’s current Wi-Fi.</p><label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={open} onChange={e => onChange({ wifi_open_network: e.target.checked, wifi_password: '' })}/>This is an open network with no password</label></div>}
        {errors.wifi_ssid && <p role="alert" className="leading-relaxed text-sm text-red-600 dark:text-red-400">{errors.wifi_ssid}</p>}
        {!!ssid && <div>{open ? <p className="leading-relaxed text-sm text-amber-700 dark:text-amber-300">This network is open. No password is required; saving clears the previous Wi-Fi password.</p> : <><label htmlFor={`wifi-password-${device.id}`} className="text-sm font-semibold text-slate-700 dark:text-slate-300">Network password</label><div className="relative"><input ref={passwordRef} id={`wifi-password-${device.id}`} type={showPassword ? 'text' : 'password'} autoComplete="new-password" maxLength={63} value={password} onChange={e => onChange({ wifi_password: e.target.value })} aria-invalid={!!errors.wifi_password} aria-describedby={`wifi-password-help-${device.id}`} placeholder={ssid === device.wifi_ssid && device.has_wifi_password ? 'Saved password — leave blank to keep' : 'Enter the network password'} className={`${fieldClass} pr-12`}/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-5 text-slate-500">{showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button></div><p id={`wifi-password-help-${device.id}`} className="leading-relaxed mt-2 text-sm text-slate-500 dark:text-slate-400">{ssid === device.wifi_ssid && device.has_wifi_password ? 'Leave blank to use the saved password, or enter a new one.' : 'Enter 8–63 characters for this network.'}</p>{errors.wifi_password && <p role="alert" className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400">{errors.wifi_password}</p>}</>}</div>}
        {!!ssid && ssid === device.wifi_ssid && <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={apply} onChange={e => onChange({ wifi_apply: e.target.checked })}/>Reconnect using the saved Wi-Fi settings (firmware 2.4.0+)</label>}
        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400">Your selection is applied after saving when the scanner checks in. Networks shown are detected by the scanner’s 2.4 GHz radio.</p>
    </fieldset>;
}

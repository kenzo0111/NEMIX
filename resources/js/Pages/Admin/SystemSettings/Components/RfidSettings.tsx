import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { RfidDeviceConfiguration, SystemSettings } from '../types';
import { Info, Radio, Save, Wifi, Plus, Activity } from 'lucide-react';

interface Props {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    errors?: Record<string, string>;
    devices: RfidDeviceConfiguration[];
    onToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function RfidSettings({ settings, onChange, errors = {}, devices, onToast }: Props) {
    const [selectedId, setSelectedId] = useState<number | null>(devices[0]?.id ?? null);
    const selected = useMemo(() => devices.find((d) => d.id === selectedId), [devices, selectedId]);
    const [draft, setDraft] = useState<Partial<RfidDeviceConfiguration> & { wifi_password?: string }>({});
    const [busy, setBusy] = useState(false);
    const [oneTimeToken, setOneTimeToken] = useState<string | null>(null);
    const [registration, setRegistration] = useState({ device_uuid: '', device_name: '', server_url: window.location.origin });
    const value = <K extends keyof RfidDeviceConfiguration>(key: K) => (draft[key] ?? selected?.[key]) as RfidDeviceConfiguration[K];
    const set = (key: string, next: unknown) => setDraft((old) => ({ ...old, [key]: next }));

    const saveDevice = async () => {
        if (!selected) return;
        setBusy(true);
        try {
            const payload = {
                device_name: value('device_name'), wifi_ssid: value('wifi_ssid') || '',
                wifi_password: draft.wifi_password || '', server_url: value('server_url'),
                scan_mode: value('scan_mode'), rf_power: Number(value('rf_power')),
                scan_timeout: Number(value('scan_timeout')), heartbeat_interval: Number(value('heartbeat_interval')),
                buzzer_enabled: Boolean(value('buzzer_enabled')), auto_reconnect: Boolean(value('auto_reconnect')),
            };
            const response = await axios.put(route('system.settings.rfid-devices.update', { device: selected.id }), payload);
            onToast('success', `${response.data.message} Version ${response.data.version}.`);
            setDraft({});
        } catch (error: any) { onToast('error', error.response?.data?.message || 'Unable to save scanner configuration.'); }
        finally { setBusy(false); }
    };

    const testDevice = async () => {
        if (!selected) return;
        setBusy(true);
        try { const r = await axios.post(route('system.settings.rfid-devices.test', { device: selected.id })); onToast('success', r.data.message); }
        catch (error: any) { onToast('error', error.response?.data?.message || 'The scanner is not responding.'); }
        finally { setBusy(false); }
    };

    const rotateDevice = async () => {
        if (!selected || !window.confirm('Rotate this scanner secret? The scanner must be provisioned with the new secret before it can connect again.')) return;
        setBusy(true);
        try {
            const r = await axios.post(route('system.settings.rfid-devices.rotate', { device: selected.id }));
            setOneTimeToken(r.data.device_token);
            onToast('info', 'Scanner secret rotated. Copy the new secret into the scanner setup portal.');
        } catch (error: any) { onToast('error', error.response?.data?.message || 'Unable to rotate scanner secret.'); }
        finally { setBusy(false); }
    };

    const toggleDevice = async () => {
        if (!selected) return;
        setBusy(true);
        try {
            await axios.patch(route('system.settings.rfid-devices.enabled', { device: selected.id }), { enabled: selected.status === 'disabled' });
            window.location.reload();
        } catch (error: any) { onToast('error', error.response?.data?.message || 'Unable to change scanner access.'); setBusy(false); }
    };

    const revokeDevice = async () => {
        if (!selected || !window.confirm('Revoke this scanner? Its current signing secret will be erased. Reusing the scanner requires rotation and provisioning.')) return;
        setBusy(true);
        try {
            await axios.post(route('system.settings.rfid-devices.revoke', { device: selected.id }));
            window.location.reload();
        } catch (error: any) { onToast('error', error.response?.data?.message || 'Unable to revoke scanner.'); setBusy(false); }
    };

    const registerDevice = async () => {
        setBusy(true);
        try {
            const r = await axios.post(route('system.settings.rfid-devices.store'), registration);
            setOneTimeToken(r.data.device_token);
            onToast('info', 'Device registered. Copy the one-time signing secret into the setup portal now.');
        } catch (error: any) { onToast('error', error.response?.data?.message || 'Unable to register device.'); }
        finally { setBusy(false); }
    };

    const fieldClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-900/10 dark:focus:ring-red-500/20 focus:border-red-800 dark:focus:border-red-600 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500';
    return <div className="space-y-8">
        <div><h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-serif">RFID Scanner Configuration</h3><p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage warehouse behavior and versioned handheld scanner configuration.</p></div>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">Warehouse operating mode<select value={settings['rfid.active_mode']} onChange={(e) => onChange('rfid.active_mode', e.target.value as any)} className={fieldClass}><option value="bin_association">Bin / Shelf Tag Association</option><option value="issuance_verification">Issuance Verification</option><option value="rpci_stocktake">RPCI Stocktaking</option></select>{errors['settings.rfid.active_mode'] && <span className="text-red-600">{errors['settings.rfid.active_mode']}</span>}</label>
            <label className="space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">Browser scan debounce (ms)<input type="number" min="300" max="10000" value={settings['rfid.scan_debounce_ms']} onChange={(e) => onChange('rfid.scan_debounce_ms', Number(e.target.value))} className={fieldClass}/><span className="flex gap-1 font-normal text-slate-500 dark:text-slate-400"><Info className="w-3 h-3"/>This setting controls the web console; handheld settings are below.</span></label>
        </section>

        {devices.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-slate-100"><Plus className="w-4 h-4 text-red-900 dark:text-red-400"/>Register the first handheld scanner</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter the device ID shown by its setup hotspot. The token is displayed once and must be entered in the local setup portal.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><input className={fieldClass} placeholder="RFID-HH-A1B2C3" value={registration.device_uuid} onChange={e=>setRegistration({...registration,device_uuid:e.target.value})}/><input className={fieldClass} placeholder="Stockroom Scanner 1" value={registration.device_name} onChange={e=>setRegistration({...registration,device_name:e.target.value})}/><input className={fieldClass} placeholder="https://inventory.example.edu" value={registration.server_url} onChange={e=>setRegistration({...registration,server_url:e.target.value})}/></div>
            <button type="button" disabled={busy} onClick={registerDevice} className="px-4 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer">Register Device</button>
            {oneTimeToken && <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs"><strong className="block text-amber-900 dark:text-amber-300 mb-2">One-time device token — copy it now</strong><code className="break-all select-all text-slate-900 dark:text-slate-100">{oneTimeToken}</code><p className="mt-2 text-amber-800 dark:text-amber-400">For security, this token cannot be retrieved after you leave this page.</p></div>}
        </section> : <section className="space-y-5">
            <details className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">Register another handheld scanner</summary>
                <div className="mt-4 space-y-3"><div className="grid grid-cols-1 md:grid-cols-3 gap-3"><input className={fieldClass} placeholder="RFID-HH-A1B2C3" value={registration.device_uuid} onChange={e=>setRegistration({...registration,device_uuid:e.target.value})}/><input className={fieldClass} placeholder="Stockroom Scanner 2" value={registration.device_name} onChange={e=>setRegistration({...registration,device_name:e.target.value})}/><input className={fieldClass} placeholder="https://inventory.example.edu" value={registration.server_url} onChange={e=>setRegistration({...registration,server_url:e.target.value})}/></div><button type="button" disabled={busy} onClick={registerDevice} className="px-4 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white text-xs font-semibold cursor-pointer">Register Device</button>{oneTimeToken && <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs"><strong className="block text-amber-900 dark:text-amber-300 mb-2">One-time device token — copy it now</strong><code className="break-all select-all text-slate-900 dark:text-slate-100">{oneTimeToken}</code></div>}</div>
            </details>
            <div className="flex flex-wrap items-center justify-between gap-3"><select className={`${fieldClass} max-w-sm`} value={selectedId ?? ''} onChange={e=>{setSelectedId(Number(e.target.value));setDraft({});}}>{devices.map(d=><option key={d.id} value={d.id}>{d.device_name} — {d.device_uuid}</option>)}</select><span className={`px-3 py-1 rounded-full text-xs font-semibold ${selected?.status==='online'?'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300':'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}><Activity className="inline w-3 h-3 mr-1"/>{selected?.status}</span></div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-2 lg:grid-cols-5 gap-4 text-xs"><div><span className="text-slate-500 dark:text-slate-400">Device ID</span><strong className="block mt-1 text-slate-900 dark:text-slate-100">{selected?.device_uuid}</strong></div><div><span className="text-slate-500 dark:text-slate-400">Firmware</span><strong className="block mt-1 text-slate-900 dark:text-slate-100">{selected?.firmware_version || 'Not reported'}</strong></div><div><span className="text-slate-500 dark:text-slate-400">Last seen</span><strong className="block mt-1 text-slate-900 dark:text-slate-100">{selected?.last_seen_at ? new Date(selected.last_seen_at).toLocaleString() : 'Never'}</strong></div><div><span className="text-slate-500 dark:text-slate-400">IP address</span><strong className="block mt-1 text-slate-900 dark:text-slate-100">{selected?.ip_address || '—'}</strong></div><div><span className="text-slate-500 dark:text-slate-400">Config version</span><strong className="block mt-1 text-slate-900 dark:text-slate-100">{selected?.config_version}</strong></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Device name<input className={fieldClass} value={value('device_name') || ''} onChange={e=>set('device_name',e.target.value)}/></label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Wi-Fi SSID<input className={fieldClass} value={value('wifi_ssid') || ''} onChange={e=>set('wifi_ssid',e.target.value)}/></label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Wi-Fi password<input type="password" autoComplete="new-password" className={fieldClass} value={draft.wifi_password || ''} placeholder={selected?.has_wifi_password?'•••••••• (leave blank to keep)':'Enter password'} onChange={e=>set('wifi_password',e.target.value)}/></label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Server URL<input className={fieldClass} value={value('server_url') || ''} onChange={e=>set('server_url',e.target.value)}/></label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scan mode<select className={fieldClass} value={value('scan_mode') || 'single'} onChange={e=>set('scan_mode',e.target.value)}><option value="single">Single trigger</option><option value="inventory">Inventory window</option></select></label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">RF power (0–26 dBm)<input type="number" min="0" max="26" className={fieldClass} value={value('rf_power') ?? 20} onChange={e=>set('rf_power',Number(e.target.value))}/></label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Scan timeout (100–30,000 ms)<input type="number" min="100" max="30000" className={fieldClass} value={value('scan_timeout') ?? 3000} onChange={e=>set('scan_timeout',Number(e.target.value))}/></label>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Heartbeat interval (10–3,600 sec)<input type="number" min="10" max="3600" className={fieldClass} value={value('heartbeat_interval') ?? 30} onChange={e=>set('heartbeat_interval',Number(e.target.value))}/></label>
            </div>
            <div className="flex flex-wrap gap-5 text-xs text-slate-700 dark:text-slate-300"><label className="cursor-pointer"><input type="checkbox" checked={Boolean(value('buzzer_enabled'))} onChange={e=>set('buzzer_enabled',e.target.checked)} className="mr-2"/>Buzzer enabled</label><label className="cursor-pointer"><input type="checkbox" checked={Boolean(value('auto_reconnect'))} onChange={e=>set('auto_reconnect',e.target.checked)} className="mr-2"/>Auto reconnect</label></div>
            <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={saveDevice} className="px-4 py-2 rounded-xl bg-red-900 hover:bg-red-800 text-white text-xs font-semibold flex gap-2 cursor-pointer shadow-xs"><Save className="w-4 h-4"/>Save & Apply Configuration</button><button type="button" disabled={busy} onClick={testDevice} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold flex gap-2 cursor-pointer text-slate-700 dark:text-slate-300"><Wifi className="w-4 h-4"/>Test Connection</button><button type="button" disabled={busy} onClick={rotateDevice} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">Rotate Secret</button><button type="button" disabled={busy} onClick={toggleDevice} className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300">{selected?.status === 'disabled' ? 'Enable Scanner' : 'Disable Scanner'}</button><button type="button" disabled={busy} onClick={revokeDevice} className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800/80 text-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold cursor-pointer">Revoke Scanner</button></div>
            {oneTimeToken && <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs"><strong className="block text-amber-900 dark:text-amber-300 mb-2">One-time signing secret — copy it now</strong><code className="break-all select-all text-slate-900 dark:text-slate-100">{oneTimeToken}</code></div>}
        </section>}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 flex items-center gap-3"><Radio className="w-4 h-4 text-red-900 dark:text-red-400"/><span className="text-xs text-slate-600 dark:text-slate-400">GPIO 16, 17, 26, and trigger GPIO 27 remain fixed in firmware and cannot be changed remotely.</span></div>
    </div>;
}

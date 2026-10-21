from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace(text, before, after):
    assert before in text, before[:100]
    return text.replace(before, after)

pages = [
    ('resources/js/Pages/Inventory/AllItems/Index.tsx', 'InventoryNotification'),
    ('resources/js/Pages/Inventory/Receiving/Index.tsx', 'ReceivingStatusNotice'),
    ('resources/js/Pages/Inventory/Requests/Index.tsx', 'ReceivingStatusNotice'),
    ('resources/js/Pages/Inventory/Issuance/Index.tsx', None),
    ('resources/js/Pages/AccessControl/ManageStaffs/Index.tsx', 'StaffNotification'),
    ('resources/js/Pages/AccessControl/Roles/Index.tsx', 'RoleNotification'),
]
for path, component in pages:
    text = read(path)
    # The global bridge owns flash messages; retain callbacks for client-only results.
    text = re.sub(r'    useEffect\(\(\) => \{\n(?:(?!    \}, \[).)*?(?:flash\?|flash\.|const flash =)[\s\S]*?    \}, \[(?:flash|pageProps\.flash)[^\n]*\);\n', '', text, count=1, flags=re.S)
    # Remove the old local timer together with notification state.
    text = re.sub(r'    useEffect\(\(\) => \{\n        if \(!notification\)[\s\S]*?    \}, \[notification\]\);\n', '', text)
    text = re.sub(r'    useEffect\(\(\) => \{\n        if \(notification\)[\s\S]*?    \}, \[notification\]\);\n', '', text)
    text, count = re.subn(r'    const \[notification, setNotification\] = useState<[\s\S]*?>\(null\);', '    const setNotification = notify;', text, count=1)
    assert count == 1, path
    text = "import { notify } from '@/utils/notifications';\n" + text
    if component:
        text = re.sub(r'^import .*\b'+component+r"\b.*;\n", '', text, flags=re.M)
        text, count = re.subn(r'                    <'+component+r'\s+notification=\{notification\}\s+onDismiss=\{\(\) => setNotification\(null\)\}\s*/>\n', '', text)
        assert count == 1, path
    else:
        text, count = re.subn(r'                    \{notification && \([\s\S]*?                    \)\}\n', '', text, count=1)
        assert count == 1, path
    write(path, text)

# A single root host replaces page/layout mounts.
for path in ['resources/js/Pages/Dashboard/Index.tsx', 'resources/js/Layouts/AppLayout.tsx']:
    text = read(path)
    text = re.sub(r"^import FlashToast.*;\n", '', text, flags=re.M)
    text = text.replace('            <FlashToast />\n', '')
    write(path, text)

path = 'resources/js/Pages/RFID-Scanner/Index.tsx'
text = read(path)
text, count = re.subn(r'                    \{/\* Optional Flash Notification \*/\}[\s\S]*?(?=                    <section aria-label="Hardware scanner")', '', text, count=1)
assert count == 1
write(path, text)

path = 'resources/js/Pages/Admin/SystemSettings/Index.tsx'
text = read(path)
start = text.index('    // Lightweight Toast Notifications')
end = text.index('    // Generic setting field change handler', start)
text = text[:start] + "    const showToast = (type: 'success' | 'error' | 'info', message: string) => notify({ type, message });\n\n" + text[end:]
start = text.index('            {/* Non-intrusive Toast Notification */}')
end = text.index('\n        </div>\n    );', start)
text = text[:start] + text[end:]
text = "import { notify } from '@/utils/notifications';\n" + text
write(path, text)

path = 'resources/js/Pages/Compliance/Reports/Index.tsx'
text = read(path)
text = re.sub(r"^import \{ ActionDialog \}.*;\n", '', text, flags=re.M)
start = text.index('    // Notifications / Alerts')
end = text.index('    const modules =', start)
text = text[:start] + text[end:]
text, count = re.subn(r'setActionDialog\(\{\s*show: true,\s*type: res.success \? \'success\' : \'error\',\s*title: res.success \? \'[^\']+\' : \'[^\']+\',\s*message: res.message,\s*\}\);', "notify({ type: res.success ? 'success' : 'error', message: res.message });", text)
assert count == 2
text, count = re.subn(r'                \{/\* General Action / Notification Dialog \*/\}[\s\S]*?                />\n', '', text, count=1)
assert count == 1
text = "import { notify } from '@/utils/notifications';\n" + text
write(path, text)

path = 'resources/js/Components/SystemModeBadge.tsx'
text = read(path)
text = text.replace('  const [toastMessage, setToastMessage] = useState<string | null>(null);\n', '')
text = replace(text, '          setToastMessage(`System mode successfully switched to ${confirmingMode}`);', "          notify({ type: 'success', message: `System mode successfully switched to ${confirmingMode}` });")
text = replace(text, '          setToastMessage(`Error: ${errorMsg}`);', "          notify({ type: 'error', message: errorMsg });")
text = re.sub(r'          setTimeout\(\(\) => setToastMessage\(null\), \d+\);\n', '', text)
text, count = re.subn(r'      \{/\* Floating Notification Toast \*/\}[\s\S]*?      \)\}\n', '', text, count=1)
assert count == 1
text = "import { notify } from '@/utils/notifications';\n" + text
write(path, text)

# Existing FlashToast imports in future pages continue to refer to the common host,
# but the application mounts it exactly once through GlobalNotifications.
write('resources/js/Components/FlashToast.tsx', "export { default } from './NotificationToasts';\nexport type { NotificationType as FlashToastType, NotificationInput as FlashToastItem } from '@/utils/notifications';\n")
print('Migrated page notifications and removed duplicate renderers.')

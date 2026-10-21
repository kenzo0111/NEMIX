from pathlib import Path
import re
root = Path(__file__).resolve().parents[1]

def update(name, fn):
    path = root / name
    path.write_text(fn(path.read_text(encoding='utf-8')), encoding='utf-8')

for name in ['Inventory/AllItems', 'AccessControl/ManageStaffs', 'AccessControl/Roles']:
    def clean(s):
        s = re.sub(r'    const \{ flash \} = usePage<[^\n]+\n', '', s)
        s = s.replace('    NotificationState,\n', '')
        s = s.replace('    AllItemsPageProps,\n', '')
        s = s.replace(', usePage }', ' }')
        if s.count('useEffect') == 1: s = s.replace(', useEffect', '')
        return s
    update('resources/js/Pages/' + name + '/Index.tsx', clean)

update('resources/js/Pages/Inventory/Receiving/Index.tsx', lambda s: s.replace('    const pageProps = usePage().props as any;\n', '').replace(', usePage }', ' }'))
update('resources/js/Pages/Admin/SystemSettings/Index.tsx', lambda s: s.replace('useState, useEffect', 'useState').replace(', usePage }', ' }').replace('    ToastAlert,\n', '').replace('    CheckCircle2,\n', '').replace('    AlertCircle,\n', '').replace('    X,\n', ''))

for name in ['Inventory/AllItems', 'Inventory/Receiving', 'Inventory/Requests', 'Inventory/Issuance', 'AccessControl/ManageStaffs', 'AccessControl/Roles']:
    def clean(s):
        s = s.replace('    const setNotification = notify;\n', '')
        s = s.replace('setNotification(', 'notify(')
        s = re.sub(r'^\s*// (?:Transient Notification|Single unified transient notification state|Unified transient notification|Flash notifications|Watch for flash messages from backend|Auto-dismiss notification after 5 seconds|Notification toast state|Dismiss notification automatically)\n', '\n', s, flags=re.M)
        s = re.sub(r'^\s*\{/\* (?:Transient Notification Alert|Transient Application Notification \(Single Banner\)|Unified Notification Feedback|Flash Notification Banner|Inline Notification Banner) \*/\}\n', '\n', s, flags=re.M)
        return re.sub(r'\n{3,}', '\n\n', s)
    update('resources/js/Pages/' + name + '/Index.tsx', clean)

for name in ['resources/js/Pages/Dashboard/Index.tsx', 'resources/js/Layouts/AppLayout.tsx']:
    update(name, lambda s: re.sub(r'^\s*\{/\* (?:Global Flash Toast Notifications|Flash Message Toast) \*/\}\n', '\n', s, flags=re.M))

update('resources/js/Pages/Profile/Partials/UpdateProfileInformationCard.tsx', lambda s: re.sub(r'                        \{/\* Success Feedback Banner \*/\}[\s\S]*?                        \)\}\n', '', s, count=1).replace('        recentlySuccessful,\n', ''))

# Security actions use Axios and retain field-level errors as well as the common result toast.
name = 'resources/js/Pages/Profile/hooks/usePasswordOtpFlow.ts'
s = (root / name).read_text(encoding='utf-8')
s = "import { notify, notificationError } from '@/utils/notifications';\n" + s
s = s.replace("                setStep('otp');", "                setStep('otp');\n                notify({ type: 'info', message: 'Verification code sent. Check your registered email.' });", 1)
s = s.replace("                    setStep('success');", "                    setStep('success');\n                    notify({ type: 'success', message: 'Your password has been changed successfully.' });", 1)
s = s.replace('        } catch (err: any) {', "        } catch (err: any) {\n            notify({ type: 'error', message: notificationError(err, 'Unable to complete this security action. Check the form and try again.') });")
# Resend is the third successful response block.
pos = s.index('    const handleResendOtp')
s = s[:pos] + s[pos:].replace('            if (response.data?.success) {', "            if (response.data?.success) {\n                notify({ type: 'info', message: 'A new verification code has been sent.' });", 1)
(root / name).write_text(s, encoding='utf-8')
print('Cleaned up retired state, imports, and profile result banners.')

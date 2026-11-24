import StatusBadge from '@/Components/ui/status-badge';
export const LoginAuditStatus = ({ event }: { event: string }) => {
    const success = ['login_success','Success'].includes(event), failed = ['login_failed','Failed'].includes(event), logout = ['logout','Logged Out'].includes(event);
    return <StatusBadge tone={success ? 'success' : failed ? 'danger' : 'neutral'}>{success ? 'Successful' : failed ? 'Failed' : logout ? 'Logged Out' : event}</StatusBadge>;
};

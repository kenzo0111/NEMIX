import { Button, type ButtonProps } from '@/Components/ui/button';
interface Props extends ButtonProps { processing?: boolean; loadingText?: string; }
export default function AuthSubmitButton({ processing = false, loadingText = 'Processing...', children, type = 'submit', ...props }: Props) {
    return <Button {...props} type={type} variant="primary" size="auth" loading={processing} className={`w-full ${props.className || ''}`}>{processing ? loadingText : children}</Button>;
}

import { Button, type ButtonProps } from './ui/button';
export default function DangerButton(props: ButtonProps) {
    return <Button {...props} variant="danger" />;
}

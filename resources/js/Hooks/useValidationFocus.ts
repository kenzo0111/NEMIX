import { useEffect, useRef } from 'react';
import { focusFirstInvalidField } from '@/utils/validationFocus';

export function useValidationFocus(errors?: Record<string, unknown>) {
    const previousCount = useRef(0);
    useEffect(() => {
        const count = Object.keys(errors || {}).length;
        if (count && count > previousCount.current && typeof window !== 'undefined') window.requestAnimationFrame(focusFirstInvalidField);
        previousCount.current = count;
    }, [errors]);
}

export default useValidationFocus;

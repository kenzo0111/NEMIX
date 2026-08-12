import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo({ className = '', alt = 'UCN Logo', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            alt={alt}
            {...props}
            src="/images/cnscrefine.png"
            className={`object-contain ${className || 'h-12 w-12'}`}
        />
    );
}
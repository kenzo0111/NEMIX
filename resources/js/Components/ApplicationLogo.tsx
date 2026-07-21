import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/images/cnscrefine.png"
            alt={props.alt ?? 'UCN Logo'}
            className={props.className ?? 'h-12 w-12 object-contain'}
        />
    );
}
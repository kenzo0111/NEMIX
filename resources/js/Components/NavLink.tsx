import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active: boolean }) {
    return (
        <Link data-variant="unstyled" data-size="default"
            {...props}
            className={"ui-button " + ("inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none " +
    (active
        ? "border-red-800 dark:border-red-500 text-slate-900 dark:text-slate-100 focus:border-red-900 dark:focus:border-red-600" : "border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200 focus:border-slate-300 focus:text-slate-700") +
    className)}
        >
            {children}
        </Link>
    );
}

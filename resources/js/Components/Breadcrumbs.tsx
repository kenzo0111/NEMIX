import { Link } from '@inertiajs/react';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';

interface BreadcrumbItem {
    name: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="flex items-center text-sm font-medium text-gray-500" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                <li>
                    <Link
                        href={route('dashboard')}
                        className="text-gray-400 hover:text-gray-700 transition flex items-center gap-1"
                    >
                        <HomeIcon className="w-4 h-4" />
                        <span className="sr-only">Dashboard</span>
                    </Link>
                </li>
                {items.map((item, index) => (
                    <li key={index} className="flex items-center">
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
                        {item.href ? (
                            <Link href={item.href} className="text-gray-600 hover:text-gray-900 transition">
                                {item.name}
                            </Link>
                        ) : (
                            <span className="text-gray-800 font-semibold">{item.name}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

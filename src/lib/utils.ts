import { type ClassValue, clsx } from 'clsx';
import { Metadata } from 'next';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
};
export const kFormatter = (num: any) => {
    return Math.abs(num) > 999
        ? Math.sign(num) * parseFloat((Math.abs(num) / 1000).toFixed(1)) + 'K'
        : Math.sign(num) * Math.abs(num);
};

export function constructMetadata({
    title = 'CaseBento - custom high-quality phone cases',
    description = 'Create custom high-quality phone cases in seconds',
    image = '/fck-thumbnail.png',
    icons = '/favicon.ico',
}: {
    title?: string;
    description?: string;
    image?: string;
    icons?: string;
} = {}): Metadata {
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [{ url: image }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
            creator: '@casebento',
        },
        icons,
        metadataBase: new URL('https://casebento.vercel.app'),
    };
}

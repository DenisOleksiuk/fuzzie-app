'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

const Page = () => {
    const router = useRouter();

    useEffect(() => {
        // navigate to the first workflow
        router.push('/workflows/editor/1');
    }, [router]);

    return null;
};

export default Page;

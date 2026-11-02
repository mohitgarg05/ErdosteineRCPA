'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MRHistoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mr/new-visit');
  }, [router]);

  return null;
}

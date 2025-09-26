'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initMsw = async () => {
        const { worker } = await import('../mocks/browser');
        await worker.start();
        setMswReady(true);
      };

      initMsw();
    }
  }, []);

  if (!mswReady && typeof window !== 'undefined') {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}

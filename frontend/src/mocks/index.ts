async function initMocks() {
  if (typeof window === 'undefined') {
    // For Node.js environment (e.g., Next.js API routes or SSR)
    // const { server } = await import('./server');
    // server.listen();
  } else {
    // For browser environment
    const { worker } = await import('./browser');
    worker.start();
  }
}

initMocks();

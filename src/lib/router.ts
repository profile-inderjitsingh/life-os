import { useCallback, useEffect, useState } from 'react';

export type Route = 'dashboard' | 'habits' | 'tasks' | 'journal' | 'settings';

const PATHS: Record<Route, string> = {
  dashboard: '/',
  habits: '/habits',
  tasks: '/tasks',
  journal: '/journal',
  settings: '/settings',
};

function routeFromHash(hash: string): Route {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  const pathname = raw || '/';
  const match = (Object.keys(PATHS) as Route[]).find((key) => PATHS[key] === pathname);
  return match ?? 'dashboard';
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    return routeFromHash(window.location.hash);
  });

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    const nextHash = PATHS[next];
    const currentHash = window.location.hash;

    if (currentHash !== `#${nextHash}`) {
      window.location.hash = nextHash;
    }

    setRoute(next);
  }, []);

  return { route, navigate };
}

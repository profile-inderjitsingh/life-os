import { useCallback, useEffect, useState } from 'react';

export type Route = 'dashboard' | 'habits' | 'tasks' | 'journal' | 'settings';

const PATHS: Record<Route, string> = {
  dashboard: '/',
  habits: '/habits',
  tasks: '/tasks',
  journal: '/journal',
  settings: '/settings',
};

function routeFromPath(pathname: string): Route {
  const match = (Object.keys(PATHS) as Route[]).find((key) => PATHS[key] === pathname);
  return match ?? 'dashboard';
}

/**
 * Real URLs, no router dependency. Deep links work because `public/_redirects`
 * rewrites every path back to index.html on Cloudflare Pages.
 */
export function useRouter() {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === 'undefined' ? 'dashboard' : routeFromPath(window.location.pathname)
  );

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((next: Route) => {
    if (window.location.pathname !== PATHS[next]) {
      window.history.pushState({}, '', PATHS[next]);
    }
    setRoute(next);
  }, []);

  return { route, navigate };
}

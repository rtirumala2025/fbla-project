/**
 * Route Preloader Utility
 * Preloads route components for faster navigation
 */

// Store for preloaded components
const preloadedRoutes = new Set<string>();

// Route component mappings for preloading
const routeComponentMap: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('../pages/DashboardPage'),
  '/pet-game': () => import('../pages/PetGame2Screen'),
  '/shop': () => import('../pages/Shop'),
  '/budget': () => import('../pages/budget/BudgetDashboard'),
  '/profile': () => import('../pages/ProfilePage'),
  '/login': () => import('../pages/Login'),
  '/signup': () => import('../pages/Signup'),
  '/pet-selection': () => import('../pages/PetSelectionPage'),
  '/analytics': () => import('../pages/analytics/AnalyticsDashboard'),
  '/inventory': () => import('../pages/Inventory'),
  '/settings': () => import('../pages/settings/SettingsScreen'),
};

/**
 * Preload a specific route component
 */
export async function preloadRoute(path: string): Promise<void> {
  // Already preloaded
  if (preloadedRoutes.has(path)) return;

  const loader = routeComponentMap[path];
  if (loader) {
    try {
      await loader();
      preloadedRoutes.add(path);
    } catch (error) {
      console.warn(`Failed to preload route: ${path}`, error);
    }
  }
}

/**
 * Preload multiple routes
 */
export async function preloadRoutes(paths: string[]): Promise<void> {
  await Promise.all(paths.map(preloadRoute));
}

/**
 * Preload routes that are likely to be visited next
 * Call this on idle to preload common routes
 */
export function preloadCriticalRoutes(): void {
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = (window as any).requestIdleCallback ||
    ((cb: () => void) => setTimeout(cb, 1));

  schedulePreload(() => {
    // Preload most common routes in priority order
    const criticalRoutes = [
      '/dashboard',
      '/pet-game',
      '/shop',
    ];

    preloadRoutes(criticalRoutes);
  });
}

/**
 * Preload routes based on current location
 */
export function preloadRelatedRoutes(currentPath: string): void {
  const relatedRoutes: Record<string, string[]> = {
    '/login': ['/dashboard', '/pet-selection', '/signup'],
    '/signup': ['/login', '/pet-selection'],
    '/': ['/login', '/signup'],
    '/dashboard': ['/pet-game', '/shop', '/budget', '/profile'],
    '/pet-game': ['/dashboard', '/shop'],
    '/shop': ['/dashboard', '/inventory'],
    '/pet-selection': ['/dashboard'],
  };

  const routes = relatedRoutes[currentPath];
  if (routes) {
    // Delay preloading to not interfere with current page load
    setTimeout(() => preloadRoutes(routes), 2000);
  }
}

/**
 * Mouse hover preloading for links
 */
export function handleLinkHover(path: string): void {
  preloadRoute(path);
}

export default {
  preloadRoute,
  preloadRoutes,
  preloadCriticalRoutes,
  preloadRelatedRoutes,
  handleLinkHover,
};


export const PUBLIC_ROUTES = ['/login', '/register'] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function getAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
  isLoading: boolean,
): string | null {
  if (isLoading) return null;

  const publicPath = isPublicRoute(pathname);

  if (!isAuthenticated && !publicPath) {
    return '/login';
  }

  if (isAuthenticated && publicPath) {
    return '/';
  }

  return null;
}

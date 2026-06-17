import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public assets, static files, next internal files, and APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // matches favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Allow access to /login
  if (pathname === '/login') {
    return NextResponse.next();
  }

  // 3. Check for site auth cookie
  const session = request.cookies.get('nww_site_session');
  if (!session || session.value !== 'authenticated') {
    // Redirect to login page
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// matcher to intercept all standard page views
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

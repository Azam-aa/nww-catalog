import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('nww_site_session');

  console.log(`[Middleware] Path: ${pathname}, Session: ${session ? session.value : 'none'}`);

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
  if (!session || session.value !== 'authenticated') {
    console.log(`[Middleware] Unauthorized access to ${pathname}, redirecting to /login`);
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  }

  return NextResponse.next();
}

// matcher to intercept all standard page views
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

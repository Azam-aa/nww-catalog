import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    // Use environment variables if configured, otherwise default to 'nww' / '@2024'
    const validUsername = process.env.GLOBAL_USERNAME || 'nww';
    const validPassword = process.env.GLOBAL_PASSWORD || '@2024';

    if (username === validUsername && password === validPassword) {
      const response = NextResponse.json({ success: true });
      
      // Set secure HttpOnly cookie valid for 10 years (315360000 seconds)
      response.cookies.set('nww_site_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 315360000, // 10 years
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Incorrect username or password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

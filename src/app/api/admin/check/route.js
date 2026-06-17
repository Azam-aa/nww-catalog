import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get('nww_admin_session');

  const isAdmin = session && session.value === 'authenticated';
  return NextResponse.json({ isAdmin: !!isAdmin });
}

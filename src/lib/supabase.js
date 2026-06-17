import { createClient } from '@supabase/supabase-js';

const sanitizeEnvVar = (val) => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
};

const supabaseUrl = sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://placeholder.supabase.co';
const supabaseAnonKey = sanitizeEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 'placeholder';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Check your .env.local file.');
}

// Safe create client helper to prevent build-time crashes if URL is malformed
function safeCreateClient(url, key) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    return createClient(url, key);
  } catch (err) {
    console.error(`Failed to initialize Supabase client with URL: "${url}". Error:`, err.message);
    // Return a dummy client to prevent module import crash
    return createClient('https://placeholder.supabase.co', 'placeholder');
  }
}

// Public client for client-side SELECT queries
export const supabase = safeCreateClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client (uses service_role key to bypass RLS for writes)
// NEVER import or use this on the client side!
export function getSupabaseAdmin() {
  const serviceRoleKey = sanitizeEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials for admin access (SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL)');
  }
  return safeCreateClient(supabaseUrl, serviceRoleKey);
}

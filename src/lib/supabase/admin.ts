import { createClient } from '@supabase/supabase-js';

// The Server-Side Admin Client using the Service Role Key.
// CAUTION: This client bypasses Row Level Security (RLS) entirely.
// It MUST ONLY be used in secure server environments (e.g., Next.js API Routes / Server Actions)
// and NEVER exposed to the browser/client-side.

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Critical Supabase Admin variables are missing from environment.');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

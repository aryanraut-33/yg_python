// The Supabase client. Keys come from .env.local (never committed):
//   VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
// Both are safe to ship in the website; row-level security protects the data.
// Without them, the app runs in guest-only mode.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const accountsEnabled = Boolean(url && key);

export const supabase: SupabaseClient | null = accountsEnabled
  ? createClient(url!, key!, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

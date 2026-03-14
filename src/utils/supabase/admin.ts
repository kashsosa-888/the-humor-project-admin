import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS for admin operations.
// This must ONLY be used in server-side code (Server Components, Server Actions, Route Handlers).
// NEVER import this in client components.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your .env.local file.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-violet-600/20 p-3">
            <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Humor Project</h1>
          <p className="mt-2 text-gray-400">Admin Area</p>
        </div>

        {params.error && (
          <div className="mb-6 rounded-lg bg-red-900/40 border border-red-800 p-4 text-red-300">
            <p className="text-sm">Authentication failed. Please try again.</p>
          </div>
        )}

        <div className="flex justify-center">
          <GoogleSignInButton />
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Superadmin access required
        </p>
      </div>
    </div>
  );
}

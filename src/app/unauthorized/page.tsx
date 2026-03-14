import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-red-900/50 bg-gray-900 p-8 text-center shadow-2xl">
        <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-red-600/20 p-3">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="mt-3 text-gray-400">
          You do not have superadmin privileges to access this area.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Contact a system administrator to request access.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-gray-800 px-6 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { createSignupDomain, deleteSignupDomain } from "../actions";

interface Domain {
  id: number;
  apex_domain: string;
  created_datetime_utc: string | null;
}

export default function SignupDomainsManager({ domains }: { domains: Domain[] }) {
  const [isPending, startTransition] = useTransition();
  const [newDomain, setNewDomain] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showFeedback(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleCreate() {
    const val = newDomain.trim().toLowerCase();
    if (!val) return;
    startTransition(async () => {
      const res = await createSignupDomain(val);
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", `Domain "${val}" added`); setNewDomain(""); }
    });
  }

  function confirmDelete(id: number) {
    startTransition(async () => {
      const res = await deleteSignupDomain(id);
      if (res.error) showFeedback("error", res.error);
      else showFeedback("success", "Domain removed");
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Allowed Signup Domains</h1>
        <p className="mt-1 text-gray-400">{domains.length} domain{domains.length !== 1 ? "s" : ""} — controls which email domains can sign up</p>
      </div>

      {feedback && (
        <div className={`rounded-lg border p-4 text-sm ${feedback.type === "success" ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-red-800 bg-red-950/40 text-red-300"}`}>
          {feedback.msg}
        </div>
      )}

      {/* Add domain */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-300">Add Domain</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g. columbia.edu"
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button onClick={handleCreate} disabled={isPending || !newDomain.trim()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
            {isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Remove Domain?</h3>
            <p className="mt-2 text-sm text-gray-400">Users from this domain will no longer be able to sign up.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => confirmDelete(deletingId)} disabled={isPending} className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                {isPending ? "Removing…" : "Yes, Remove"}
              </button>
              <button onClick={() => setDeletingId(null)} className="flex-1 rounded-lg bg-gray-800 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Domain</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Added</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {domains.map((d) => (
              <tr key={d.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-white">{d.apex_domain}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {d.created_datetime_utc ? new Date(d.created_datetime_utc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => setDeletingId(d.id)} className="rounded-lg bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50">Remove</button>
                </td>
              </tr>
            ))}
            {domains.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No domains configured</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

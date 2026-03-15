"use client";

import { useState, useTransition } from "react";
import { createWhitelistEmail, updateWhitelistEmail, deleteWhitelistEmail } from "../actions";

interface Email {
  id: number;
  email_address: string;
  created_datetime_utc: string | null;
  modified_datetime_utc: string | null;
}

export default function WhitelistEmailsManager({ emails }: { emails: Email[] }) {
  const [isPending, startTransition] = useTransition();
  const [newEmail, setNewEmail] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showFeedback(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleCreate() {
    const val = newEmail.trim().toLowerCase();
    if (!val || !val.includes("@")) return;
    startTransition(async () => {
      const res = await createWhitelistEmail(val);
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", `Email "${val}" added`); setNewEmail(""); }
    });
  }

  function handleUpdate(id: number) {
    const val = editEmail.trim().toLowerCase();
    if (!val || !val.includes("@")) return;
    startTransition(async () => {
      const res = await updateWhitelistEmail(id, val);
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", "Email updated"); setEditingId(null); }
    });
  }

  function confirmDelete(id: number) {
    startTransition(async () => {
      const res = await deleteWhitelistEmail(id);
      if (res.error) showFeedback("error", res.error);
      else showFeedback("success", "Email removed");
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Whitelisted Emails</h1>
        <p className="mt-1 text-gray-400">{emails.length} email{emails.length !== 1 ? "s" : ""} — specific addresses allowed to sign up</p>
      </div>

      {feedback && (
        <div className={`rounded-lg border p-4 text-sm ${feedback.type === "success" ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-red-800 bg-red-950/40 text-red-300"}`}>
          {feedback.msg}
        </div>
      )}

      {/* Add email */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-300">Add Email Address</h2>
        <div className="flex gap-3">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button onClick={handleCreate} disabled={isPending || !newEmail.trim()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
            {isPending ? "Adding…" : "Add"}
          </button>
        </div>
      </div>

      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Remove Email?</h3>
            <p className="mt-2 text-sm text-gray-400">This email will be removed from the whitelist.</p>
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
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Email Address</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Added</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {emails.map((e) => (
              <tr key={e.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-6 py-4">
                  {editingId === e.id ? (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(ev) => setEditEmail(ev.target.value)}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                        onKeyDown={(ev) => ev.key === "Enter" && handleUpdate(e.id)}
                      />
                      <button onClick={() => handleUpdate(e.id)} disabled={isPending} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50">Save</button>
                      <button onClick={() => setEditingId(null)} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700">Cancel</button>
                    </div>
                  ) : (
                    <span className="text-sm text-white">{e.email_address}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {e.created_datetime_utc ? new Date(e.created_datetime_utc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(e.id); setEditEmail(e.email_address); }} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-white">Edit</button>
                    <button onClick={() => setDeletingId(e.id)} className="rounded-lg bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
            {emails.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-500">No whitelisted emails</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

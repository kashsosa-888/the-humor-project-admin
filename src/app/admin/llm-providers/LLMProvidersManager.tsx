"use client";

import { useState, useTransition } from "react";
import { createLLMProvider, updateLLMProvider, deleteLLMProvider } from "../actions";

interface Provider {
  id: number;
  name: string;
  created_datetime_utc: string | null;
}

export default function LLMProvidersManager({ providers }: { providers: Provider[] }) {
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showFeedback(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      const res = await createLLMProvider(newName.trim());
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", "Provider created"); setNewName(""); setShowCreate(false); }
    });
  }

  function handleUpdate(id: number) {
    if (!editName.trim()) return;
    startTransition(async () => {
      const res = await updateLLMProvider(id, editName.trim());
      if (res.error) showFeedback("error", res.error);
      else { showFeedback("success", "Provider updated"); setEditingId(null); }
    });
  }

  function confirmDelete(id: number) {
    startTransition(async () => {
      const res = await deleteLLMProvider(id);
      if (res.error) showFeedback("error", res.error);
      else showFeedback("success", "Provider deleted");
      setDeletingId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">LLM Providers</h1>
          <p className="mt-1 text-gray-400">{providers.length} provider{providers.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Provider
        </button>
      </div>

      {feedback && (
        <div className={`rounded-lg border p-4 text-sm ${feedback.type === "success" ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-red-800 bg-red-950/40 text-red-300"}`}>
          {feedback.msg}
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-violet-800/50 bg-gray-900 p-5">
          <h2 className="mb-3 text-sm font-semibold text-violet-300">New Provider</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Provider name (e.g. Anthropic)"
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <button onClick={handleCreate} disabled={isPending || !newName.trim()} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
              {isPending ? "Creating…" : "Create"}
            </button>
            <button onClick={() => { setShowCreate(false); setNewName(""); }} className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}

      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete Provider?</h3>
            <p className="mt-2 text-sm text-gray-400">This will permanently delete this provider. Models linked to it may be affected.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => confirmDelete(deletingId)} disabled={isPending} className="flex-1 rounded-lg bg-red-700 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
                {isPending ? "Deleting…" : "Yes, Delete"}
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
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {providers.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-6 py-4 text-sm font-mono text-gray-500">{p.id}</td>
                <td className="px-6 py-4">
                  {editingId === p.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-white focus:border-violet-500 focus:outline-none"
                        onKeyDown={(e) => e.key === "Enter" && handleUpdate(p.id)}
                      />
                      <button onClick={() => handleUpdate(p.id)} disabled={isPending} className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50">Save</button>
                      <button onClick={() => setEditingId(null)} className="rounded-lg bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400 hover:bg-gray-700">Cancel</button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-white">{p.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {p.created_datetime_utc ? new Date(p.created_datetime_utc).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(p.id); setEditName(p.name); }} className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-white">Edit</button>
                    <button onClick={() => setDeletingId(p.id)} className="rounded-lg bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No providers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

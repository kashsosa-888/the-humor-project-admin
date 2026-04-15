"use client";

import { useState, useTransition } from "react";
import { duplicateHumorFlavor } from "../actions";

interface Flavor {
  id: string;
  slug: string;
  description: string | null;
  created_datetime_utc: string | null;
}

export default function HumorFlavorsManager({ flavors }: { flavors: Flavor[] }) {
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openDuplicate(id: string, currentSlug: string) {
    setDuplicatingId(id);
    setNewSlug(`${currentSlug}-copy`);
    setError(null);
  }

  function closeDuplicate() {
    setDuplicatingId(null);
    setNewSlug("");
    setError(null);
  }

  function handleDuplicate() {
    if (!duplicatingId || !newSlug.trim()) return;
    startTransition(async () => {
      const result = await duplicateHumorFlavor(duplicatingId, newSlug.trim());
      if (result.error) {
        setError(result.error);
      } else {
        closeDuplicate();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Humor Flavors</h1>
        <p className="mt-1 text-gray-400">
          {flavors.length} flavor{flavors.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Slug</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {flavors.map((f) => (
              <tr key={f.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{f.id.slice(0, 8)}…</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-violet-900/40 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                    {f.slug}
                  </span>
                </td>
                <td className="max-w-sm px-6 py-4 text-sm text-gray-400">
                  {f.description ?? <span className="text-gray-600">—</span>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {f.created_datetime_utc
                    ? new Date(f.created_datetime_utc).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openDuplicate(f.id, f.slug)}
                    className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                  >
                    Duplicate
                  </button>
                </td>
              </tr>
            ))}
            {flavors.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No humor flavors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Duplicate modal */}
      {duplicatingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-white">Duplicate Humor Flavor</h2>
            <p className="mb-4 text-sm text-gray-400">
              Enter a unique slug for the new flavor. All steps will be copied.
            </p>

            <label className="mb-1 block text-xs font-medium text-gray-400">New Slug</label>
            <input
              type="text"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDuplicate()}
              placeholder="e.g. my-new-flavor"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none"
              autoFocus
            />

            {error && (
              <p className="mt-2 text-xs text-red-400">{error}</p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeDuplicate}
                disabled={isPending}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={isPending || !newSlug.trim()}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
              >
                {isPending ? "Duplicating…" : "Duplicate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

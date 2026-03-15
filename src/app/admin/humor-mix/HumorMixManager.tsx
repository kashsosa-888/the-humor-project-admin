"use client";

import { useState, useTransition } from "react";
import { updateHumorMix } from "../actions";

interface MixRow {
  id: number;
  humor_flavor_id: number;
  caption_count: number;
  created_datetime_utc: string | null;
  flavor: { id: number; slug: string; description: string } | null;
}

export default function HumorMixManager({ mix }: { mix: MixRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCount, setEditCount] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showFeedback(type: "success" | "error", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleUpdate(id: number) {
    const val = parseInt(editCount, 10);
    if (isNaN(val) || val < 0) return;
    startTransition(async () => {
      const res = await updateHumorMix(id, val);
      if (res.error) {
        showFeedback("error", res.error);
      } else {
        showFeedback("success", "Caption count updated");
        setEditingId(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Humor Mix</h1>
        <p className="mt-1 text-gray-400">{mix.length} flavor mix entr{mix.length !== 1 ? "ies" : "y"} — update caption counts</p>
      </div>

      {feedback && (
        <div className={`rounded-lg border p-4 text-sm ${feedback.type === "success" ? "border-emerald-800 bg-emerald-950/40 text-emerald-300" : "border-red-800 bg-red-950/40 text-red-300"}`}>
          {feedback.msg}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-800/50">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Humor Flavor</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Description</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Caption Count</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {mix.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-gray-800/30">
                <td className="px-6 py-4">
                  <span className="rounded-full bg-violet-900/40 px-2.5 py-0.5 text-xs font-medium text-violet-300">
                    {m.flavor?.slug ?? `#${m.humor_flavor_id}`}
                  </span>
                </td>
                <td className="max-w-xs px-6 py-4 text-sm text-gray-400 truncate">
                  {m.flavor?.description ?? "—"}
                </td>
                <td className="px-6 py-4">
                  {editingId === m.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={editCount}
                        onChange={(e) => setEditCount(e.target.value)}
                        className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-white focus:border-violet-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdate(m.id)}
                        disabled={isPending}
                        className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-gray-800 px-3 py-1 text-xs font-medium text-gray-400 hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-white">{m.caption_count}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId !== m.id && (
                    <button
                      onClick={() => { setEditingId(m.id); setEditCount(String(m.caption_count)); }}
                      className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {mix.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No humor mix entries found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

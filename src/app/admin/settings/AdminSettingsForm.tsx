"use client";

import { useState, useTransition } from "react";
import { adminUpdateFeaturedSubgenre } from "@/app/actions/admin";

const SUBGENRES = [
  "Slasher", "Found Footage", "Creature Feature",
  "Sci-Fi Horror", "Folk Horror", "Zombie", "Vampire", "Werewolf", "Body Horror",
];

export function AdminSettingsForm({ currentSubgenre }: { currentSubgenre: string }) {
  const [selected, setSelected] = useState(currentSubgenre);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await adminUpdateFeaturedSubgenre(selected);
      setSaved(true);
    });
  }

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-4">Weekly Terrors Spotlight</h2>
      <div className="bg-tomb border border-shadow rounded-xl p-5 space-y-4">
        <p className="text-sm text-specter">
          Override the auto-rotating weekly subgenre spotlight on the homepage.
        </p>
        <div className="flex items-center gap-3">
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="px-3 py-2 bg-crypt border border-shadow rounded-lg text-ghost text-sm focus:outline-none focus:border-green-spooky"
          >
            {SUBGENRES.map(sg => (
              <option key={sg} value={sg}>{sg}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={pending}
            className="px-4 py-2 bg-green-spooky text-void font-bold text-sm rounded-lg hover:bg-green-dark transition-colors disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          {saved && <span className="text-sm text-green-spooky">Saved!</span>}
        </div>
      </div>
    </div>
  );
}

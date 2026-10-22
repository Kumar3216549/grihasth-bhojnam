"use client";
import { useState } from "react";

type Item = { name: string; unit: string; veg: number; paneer: number; cost: number };

export default function WhatIf({ items }: { items: Item[] }) {
  const [veg, setVeg] = useState(50);
  const [paneer, setPaneer] = useState(0);
  const rows = items.map((i) => ({ ...i, qty: veg * i.veg + paneer * i.paneer })).filter((r) => r.qty > 0);
  const cost = rows.reduce((a, r) => a + r.qty * r.cost, 0);
  const tiffins = veg + paneer;
  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <div className="space-y-3">
        <label className="block text-sm">Veg tiffins<input type="number" min={0} className="a-input mt-1" value={veg} onChange={(e) => setVeg(Math.max(0, Number(e.target.value) || 0))} /></label>
        <label className="block text-sm">Paneer tiffins<input type="number" min={0} className="a-input mt-1" value={paneer} onChange={(e) => setPaneer(Math.max(0, Number(e.target.value) || 0))} /></label>
        <div className="rounded-lg bg-saffron-50 p-3 text-sm">
          <p>Ingredient cost: <b>₹{Math.round(cost).toLocaleString("en-IN")}</b></p>
          <p>Per tiffin: <b>₹{tiffins ? (cost / tiffins).toFixed(1) : 0}</b></p>
          <p>Rotis: <b>{tiffins * 4}</b></p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.name} className="rounded-lg border border-stone-200 px-3 py-2 text-sm">
            <p className="text-stone-500">{r.name}</p>
            <p className="font-semibold tabular-nums">{r.qty.toFixed(2)} {r.unit}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

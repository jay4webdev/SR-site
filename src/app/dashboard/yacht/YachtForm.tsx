"use client";

import Image from "next/image";
import { useState } from "react";
import type { yachts } from "@/db/schema";
import { saveYacht } from "./actions";
import { PageHeader, Spinner } from "@/components/dashboard/ui";

type Yacht = typeof yachts.$inferSelect;

export default function YachtForm({ yacht }: { yacht: Yacht }) {
  const [form, setForm] = useState({
    summary: yacht.summary,
    maxSpeedKnots: yacht.maxSpeedKnots,
    maxSpeedKmh: yacht.maxSpeedKmh,
    bedrooms: yacht.bedrooms,
    beds: yacht.beds,
    washrooms: yacht.washrooms,
    airConditioned: yacht.airConditioned,
    maxDayGuests: yacht.maxDayGuests,
    maxOvernightGuests: yacht.maxOvernightGuests,
    crew: yacht.crew,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const number = (key: keyof typeof form) => ({
    type: "number" as const,
    className: "field-input",
    value: form[key] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: Number(e.target.value) }),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await saveYacht({ id: yacht.id, ...form });
    setSaving(false);
    if (res.ok) setSaved(true);
    else setError(res.error ?? "Could not save.");
  }

  return (
    <>
      <PageHeader
        title="Yacht Profile — Finch 65"
        description="The official specification shown on the website. Only record specifications supplied in official Salt Republic material."
      />

      <form
        onSubmit={submit}
        className="grid gap-8 lg:grid-cols-3"
      >
        <div className="space-y-8 lg:col-span-2">
          <div className="border border-navy-900/10 bg-white p-7">
            <p className="eyebrow mb-5 text-[0.65rem] text-stone">Overview</p>
            <label className="field-label" htmlFor="y-summary">Summary</label>
            <textarea
              id="y-summary"
              rows={4}
              className="field-input resize-y"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
            />
          </div>

          <div className="border border-navy-900/10 bg-white p-7">
            <p className="eyebrow mb-5 text-[0.65rem] text-stone">Specifications</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="y-knots">Maximum Speed (Knots)</label>
                <input id="y-knots" {...number("maxSpeedKnots")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-kmh">Maximum Speed (km/h)</label>
                <input id="y-kmh" {...number("maxSpeedKmh")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-bedrooms">Bedrooms</label>
                <input id="y-bedrooms" {...number("bedrooms")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-beds">Beds</label>
                <input id="y-beds" {...number("beds")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-wash">Washrooms</label>
                <input id="y-wash" {...number("washrooms")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-crew">Crew</label>
                <input id="y-crew" {...number("crew")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-day">Maximum Day Guests</label>
                <input id="y-day" {...number("maxDayGuests")} />
              </div>
              <div>
                <label className="field-label" htmlFor="y-night">Maximum Overnight Guests</label>
                <input id="y-night" {...number("maxOvernightGuests")} />
              </div>
            </div>
            <label className="checkbox-row mt-5">
              <input
                type="checkbox"
                checked={form.airConditioned}
                onChange={(e) =>
                  setForm({ ...form, airConditioned: e.target.checked })
                }
              />
              <span className="text-sm">Air conditioned</span>
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="btn btn-dark">
              {saving ? <Spinner className="text-ivory" /> : null}
              Save Profile
            </button>
            {saved ? (
              <span className="animate-fade-in text-sm text-emerald-700">
                Changes saved — the website is updated.
              </span>
            ) : null}
            {error ? <span className="text-sm text-red-800">{error}</span> : null}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="border border-navy-900/10 bg-white p-5">
            <p className="eyebrow mb-4 text-[0.65rem] text-stone">Gallery</p>
            <div className="grid grid-cols-2 gap-2">
              {yacht.gallery.map((g) => (
                <div key={g.label} className="relative h-24 overflow-hidden">
                  <Image src={g.src} alt={g.label} fill sizes="140px" className="object-cover" />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-stone">
              Gallery images are served from the website image library. Replace
              files in <code>/public/images</code> to use the official Finch 65
              photography.
            </p>
          </div>
        </aside>
      </form>
    </>
  );
}

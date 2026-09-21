"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { yachts } from "@/db/schema";

export type YachtForm = {
  id: number;
  summary: string;
  maxSpeedKnots: number;
  maxSpeedKmh: number;
  bedrooms: number;
  beds: number;
  washrooms: number;
  airConditioned: boolean;
  maxDayGuests: number;
  maxOvernightGuests: number;
  crew: number;
};

export async function saveYacht(form: YachtForm) {
  if (!form.summary.trim()) return { ok: false as const, error: "Summary is required." };
  await db
    .update(yachts)
    .set({
      summary: form.summary.trim(),
      maxSpeedKnots: form.maxSpeedKnots,
      maxSpeedKmh: form.maxSpeedKmh,
      bedrooms: form.bedrooms,
      beds: form.beds,
      washrooms: form.washrooms,
      airConditioned: form.airConditioned,
      maxDayGuests: form.maxDayGuests,
      maxOvernightGuests: form.maxOvernightGuests,
      crew: form.crew,
    })
    .where(eq(yachts.id, form.id));
  revalidatePath("/");
  revalidatePath("/dashboard/yacht");
  return { ok: true as const };
}

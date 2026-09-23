import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { media, type MediaCategory } from "@/db/schema";

export type MediaItem = typeof media.$inferSelect;

export async function getAllMedia(): Promise<MediaItem[]> {
  try {
    return await db.select().from(media).orderBy(desc(media.createdAt));
  } catch {
    return [];
  }
}

export async function getMediaByCategory(category: MediaCategory): Promise<MediaItem[]> {
  try {
    return await db
      .select()
      .from(media)
      .where(eq(media.category, category))
      .orderBy(desc(media.createdAt));
  } catch {
    return [];
  }
}

export async function getMediaById(id: number): Promise<MediaItem | null> {
  try {
    const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

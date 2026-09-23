"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { media, type MediaCategory } from "@/db/schema";
import {
  saveButtonDownloadsConfig,
  type ButtonDownloadsConfig,
} from "@/lib/button-downloads";

export async function uploadMediaAction(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    const urlParam = formData.get("url") as string | null;
    const customName = (formData.get("name") as string) || "";
    const altText = (formData.get("altText") as string) || "";

    if (urlParam && urlParam.trim()) {
      const cleanUrl = urlParam.trim();
      const ext = path.extname(cleanUrl).toLowerCase();
      const isPdf = ext === ".pdf" || cleanUrl.includes(".pdf");
      const category: MediaCategory = isPdf ? "pdf" : "image";
      const filename = path.basename(cleanUrl.split("?")[0]) || "linked-file";
      const displayName = customName.trim() || filename;

      await db
        .insert(media)
        .values({
          url: cleanUrl,
          filename,
          originalName: displayName,
          mimeType: isPdf ? "application/pdf" : "image/jpeg",
          sizeBytes: 0,
          category,
          altText: altText.trim() || displayName,
        })
        .onConflictDoNothing();

      revalidatePath("/dashboard/media");
      revalidatePath("/dashboard/yacht");
      revalidatePath("/dashboard/trips");
      revalidatePath("/dashboard/settings");
      revalidatePath("/");
      return { ok: true as const };
    }

    if (!file) {
      return { ok: false as const, error: "No file selected." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const finalFilename = `${baseName}-${uniqueSuffix}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, finalFilename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${finalFilename}`;
    const mimeType = file.type || (ext === ".pdf" ? "application/pdf" : "image/jpeg");
    const isPdf = ext === ".pdf" || mimeType.includes("pdf");
    const category: MediaCategory = isPdf ? "pdf" : "image";

    await db.insert(media).values({
      url: publicUrl,
      filename: finalFilename,
      originalName: customName.trim() || originalName,
      mimeType,
      sizeBytes: buffer.length,
      category,
      altText: altText.trim() || customName.trim() || baseName,
    });

    revalidatePath("/dashboard/media");
    revalidatePath("/dashboard/yacht");
    revalidatePath("/dashboard/trips");
    revalidatePath("/dashboard/settings");
    revalidatePath("/");
    return { ok: true as const, url: publicUrl };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Upload failed.",
    };
  }
}

export async function deleteMediaAction(id: number) {
  try {
    const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
    const item = rows[0];
    if (!item) return { ok: false as const, error: "Media item not found." };

    // If it's stored in /uploads/, delete the actual file
    if (item.url.startsWith("/uploads/")) {
      const filename = path.basename(item.url);
      const filePath = path.join(process.cwd(), "public", "uploads", filename);
      try {
        await unlink(filePath);
      } catch {
        // file may already be removed or missing, continue
      }
    }

    await db.delete(media).where(eq(media.id, id));

    revalidatePath("/dashboard/media");
    revalidatePath("/dashboard/yacht");
    revalidatePath("/dashboard/trips");
    revalidatePath("/dashboard/settings");
    revalidatePath("/");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not delete media.",
    };
  }
}

export async function updateMediaAction(id: number, originalName: string, altText: string) {
  try {
    await db
      .update(media)
      .set({
        originalName: originalName.trim(),
        altText: altText.trim(),
      })
      .where(eq(media.id, id));

    revalidatePath("/dashboard/media");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not update media.",
    };
  }
}

export async function saveButtonDownloadsAction(config: ButtonDownloadsConfig) {
  try {
    await saveButtonDownloadsConfig(config);
    revalidatePath("/");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/media");
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Could not save button settings.",
    };
  }
}

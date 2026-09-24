import { put, del } from "@vercel/blob";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

export interface StoredFileResult {
  url: string;
  storageProvider: "blob" | "local";
}

/**
 * Universal file storage service for Salt Republic.
 * - In Vercel / Cloud environments with BLOB_READ_WRITE_TOKEN configured: uploads directly to Vercel Blob CDN.
 * - In local / container / standalone fallback environments: writes safely to public/uploads/ ensuring the directory exists.
 */
export async function storeFile({
  filename,
  buffer,
  contentType,
}: {
  filename: string;
  buffer: Buffer;
  contentType: string;
}): Promise<StoredFileResult> {
  // If Vercel Blob token is configured, use Blob storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(filename, buffer, {
        access: "public",
        contentType,
      });
      return {
        url: blob.url,
        storageProvider: "blob",
      };
    } catch (err) {
      console.warn("[Storage] Vercel Blob upload failed, attempting local fallback:", err);
    }
  }

  // Local / server filesystem fallback
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const destination = path.join(uploadsDir, filename);
  await writeFile(destination, buffer);

  return {
    url: `/uploads/${filename}`,
    storageProvider: "local",
  };
}

/**
 * Safely delete an uploaded file either from Vercel Blob or local filesystem.
 */
export async function removeFile(url: string): Promise<void> {
  if (!url) return;

  if (url.startsWith("https://") && (url.includes("vercel-storage.com") || url.includes("public.blob.vercel-storage.com"))) {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await del(url);
      } catch (err) {
        console.warn("[Storage] Failed to delete from Vercel Blob:", err);
      }
    }
    return;
  }

  if (url.startsWith("/uploads/")) {
    const filename = path.basename(url);
    const filePath = path.join(process.cwd(), "public", "uploads", filename);
    try {
      await unlink(filePath);
    } catch {
      // Ignore if file was already removed
    }
  }
}

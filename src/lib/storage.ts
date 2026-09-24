import { put, del } from "@vercel/blob";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

export interface StoredFileResult {
  url: string;
  storageProvider: "blob" | "local";
}

/**
 * Helper to safely extract and clean any Vercel Blob token configured in the environment.
 * Supports:
 * - BLOB_READ_WRITE_TOKEN
 * - SR_READ_WRITE_TOKEN
 * Handles cases where user pasted `KEY="token"` or extra quotes into env vars.
 */
function getBlobToken(): string | null {
  const candidates = [
    process.env.BLOB_READ_WRITE_TOKEN,
    process.env.SR_READ_WRITE_TOKEN,
  ];

  for (const raw of candidates) {
    if (!raw || typeof raw !== "string") continue;
    let token = raw.trim();
    // If the value was pasted as KEY="token" or KEY=token
    if (token.includes("=")) {
      token = token.split("=")[1]?.trim() || token;
    }
    // Remove surrounding quotes if present
    token = token.replace(/^["']|["']$/g, "").trim();

    if (token.startsWith("vercel_blob_rw_") || token.length > 20) {
      return token;
    }
  }

  // Fallback default token provided for this project
  return "vercel_blob_rw_At02gF7f3no98fex_LdYUsSFofADi9FwknusGk5kpIsNVFb";
}

/**
 * Universal file storage service for Salt Republic.
 * - In Vercel / Cloud environments with Blob token configured: uploads directly to Vercel Blob CDN.
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
  const blobToken = getBlobToken();

  // If Vercel Blob token is available, use Vercel Blob storage
  if (blobToken) {
    try {
      const blob = await put(filename, buffer, {
        access: "public",
        contentType,
        token: blobToken,
      });
      return {
        url: blob.url,
        storageProvider: "blob",
      };
    } catch (err) {
      console.warn("[Storage] Vercel Blob upload failed:", err);
      // If we are in a read-only serverless environment like Vercel Lambda (/var/task), local write will fail with EROFS.
      // Throw a clear descriptive error so the user knows what happened.
      if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        throw new Error(
          `Vercel Blob upload failed: ${err instanceof Error ? err.message : "Network/Token error"}. Files cannot be written locally on Vercel's read-only serverless filesystem.`
        );
      }
    }
  }

  // Local / server filesystem fallback (only in local development or full containers)
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const destination = path.join(uploadsDir, filename);
    await writeFile(destination, buffer);

    return {
      url: `/uploads/${filename}`,
      storageProvider: "local",
    };
  } catch (fsErr) {
    console.error("[Storage] Local filesystem write failed:", fsErr);
    throw new Error(
      `File storage error: ${fsErr instanceof Error ? fsErr.message : "Failed to write file"}`
    );
  }
}

/**
 * Safely delete an uploaded file either from Vercel Blob or local filesystem.
 */
export async function removeFile(url: string): Promise<void> {
  if (!url) return;

  if (
    url.startsWith("https://") &&
    (url.includes("vercel-storage.com") || url.includes("public.blob.vercel-storage.com"))
  ) {
    const blobToken = getBlobToken();
    if (blobToken) {
      try {
        await del(url, { token: blobToken });
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

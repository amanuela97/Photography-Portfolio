import { adminStorage } from "@/utils/firebase/admin";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  ensureStorageCapacity,
  recordDeletion,
  recordSuccessfulUpload,
} from "@/utils/storage-ledger";

interface UploadOptions {
  folder?: string;
  path?: string;
}

export async function uploadFileToStorage(
  file: File,
  options: UploadOptions
): Promise<string> {
  if (!adminStorage) {
    throw new Error("Firebase Storage is not configured.");
  }

  let buffer = Buffer.from(await file.arrayBuffer());
  const isImage = file.type?.startsWith("image/");
  let extension = extractExtension(file.name) || ".bin";
  let contentType = file.type || undefined;

  if (isImage) {
    const processedBuffer = await sharp(buffer)
      .rotate()
      .webp({ quality: 82 })
      .toBuffer();
    buffer = Buffer.from(processedBuffer);
    extension = ".webp";
    contentType = "image/webp";
  }

  let objectPath =
    options.path ??
    `${trimSlashes(
      options.folder ?? "uploads"
    )}/${Date.now()}-${randomUUID()}${extension}`;

  if (isImage) {
    objectPath = ensureExtension(objectPath, extension);
  }

  await ensureStorageCapacity(buffer.length);

  const destinationFile = adminStorage.file(objectPath);
  await destinationFile.save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000",
    },
  });

  try {
    await recordSuccessfulUpload(buffer.length);
  } catch (error) {
    await destinationFile.delete().catch(() => null);
    throw error;
  }

  return generateSignedUrl(objectPath);
}

export async function uploadMultipleFiles(
  files: File[],
  options: Omit<UploadOptions, "path">
): Promise<string[]> {
  const uploads: string[] = [];
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    uploads.push(await uploadFileToStorage(file, options));
  }
  return uploads;
}

function extractExtension(name: string): string {
  const match = name.match(/\.[^/.]+$/);
  return match ? match[0] : "";
}

function ensureExtension(path: string, ext: string): string {
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  if (path.includes(".")) {
    return path.replace(/\.[^/.]+$/, normalizedExt);
  }
  return `${path}${normalizedExt}`;
}

export async function deleteFilesInFolder(folder: string): Promise<void> {
  if (!adminStorage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const folderPath = trimSlashes(folder);
  const [files] = await adminStorage.getFiles({ prefix: `${folderPath}/` });

  let totalBytes = 0;

  for (const file of files) {
    try {
      const [metadata] = await file.getMetadata();
      totalBytes += Number(metadata.size ?? 0);
    } catch (error) {
      console.error(
        "Failed to read metadata before deletion:",
        file.name,
        error
      );
    }
    await file.delete().catch((error) => {
      console.error("Failed to delete file:", file.name, error);
    });
  }

  if (totalBytes > 0 && files.length > 0) {
    await recordDeletion(totalBytes, files.length);
  }
}

export async function moveFolder(
  sourceFolder: string,
  destinationFolder: string
): Promise<void> {
  if (!adminStorage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const sourcePath = trimSlashes(sourceFolder);
  const destinationPath = trimSlashes(destinationFolder);

  if (sourcePath === destinationPath) {
    return;
  }

  const [files] = await adminStorage.getFiles({ prefix: `${sourcePath}/` });
  await Promise.all(
    files.map(async (file) => {
      const relativePath = file.name.replace(`${sourcePath}/`, "");
      const targetPath = `${destinationPath}/${relativePath}`;
      await file.move(targetPath);
    })
  );
}

export async function moveFileInStorage(
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  if (!adminStorage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const normalizedSource = trimSlashes(sourcePath);
  const normalizedDestination = trimSlashes(destinationPath);
  const file = adminStorage.file(normalizedSource);
  const [exists] = await file.exists();
  if (!exists) {
    console.warn(`Storage file not found: ${normalizedSource}`);
    return;
  }

  await file.move(normalizedDestination);
}

export async function generateSignedUrl(path: string): Promise<string> {
  if (!adminStorage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const file = adminStorage.file(trimSlashes(path));
  const [url] = await file.getSignedUrl({
    action: "read",
    expires: "2030-01-01",
  });
  return url;
}

export function getStoragePathFromUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString);
    const pathMatch = url.pathname.match(/\/[^\/]+\/(.+)$/);
    if (!pathMatch || !pathMatch[1]) {
      return null;
    }
    return decodeURIComponent(pathMatch[1]);
  } catch {
    return null;
  }
}

function trimSlashes(path: string): string {
  return path.replace(/^\/+|\/+$/g, "");
}

/**
 * Delete a file from Firebase Storage by extracting the path from a signed URL
 * @param signedUrl The signed URL of the file to delete
 */
export async function deleteFileByUrl(signedUrl: string): Promise<void> {
  if (!adminStorage) {
    throw new Error("Firebase Storage is not configured.");
  }

  try {
    const filePath = getStoragePathFromUrl(signedUrl);
    if (!filePath) {
      throw new Error("Could not extract file path from URL");
    }

    const file = adminStorage.file(filePath);

    // Check if file exists before deleting
    const [exists] = await file.exists();
    if (exists) {
      let bytes = 0;
      try {
        const [metadata] = await file.getMetadata();
        bytes = Number(metadata.size ?? 0);
      } catch (error) {
        console.error("Failed to read metadata for file:", filePath, error);
      }
      await file.delete();
      if (bytes > 0) {
        await recordDeletion(bytes, 1);
      }
    }
  } catch (error) {
    console.error("Error deleting file from storage:", error);
    // Don't throw - allow deletion to continue even if storage deletion fails
    // This prevents orphaned documents if storage deletion fails
  }
}

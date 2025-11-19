import { adminStorage } from "@/utils/firebase/admin";
import { randomUUID } from "node:crypto";

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

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = extractExtension(file.name);
  const objectPath =
    options.path ??
    `${trimSlashes(
      options.folder ?? "uploads"
    )}/${Date.now()}-${randomUUID()}${extension}`;

  const destinationFile = adminStorage.file(objectPath);
  await destinationFile.save(buffer, {
    resumable: false,
    metadata: {
      contentType: file.type || undefined,
      cacheControl: "public,max-age=31536000",
    },
  });

  const [url] = await destinationFile.getSignedUrl({
    action: "read",
    expires: "2030-01-01",
  });

  return url;
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

export async function deleteFilesInFolder(folder: string): Promise<void> {
  if (!adminStorage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const folderPath = trimSlashes(folder);
  const [files] = await adminStorage.getFiles({ prefix: `${folderPath}/` });

  // Delete all files in the folder
  await Promise.all(files.map((file) => file.delete()));
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
    // Extract the file path from the signed URL
    // Firebase Storage signed URLs have the format:
    // https://storage.googleapis.com/BUCKET_NAME/FILE_PATH?signature=...
    const url = new URL(signedUrl);
    const pathMatch = url.pathname.match(/\/[^\/]+\/(.+)$/);
    
    if (!pathMatch || !pathMatch[1]) {
      throw new Error("Could not extract file path from URL");
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    const file = adminStorage.file(filePath);
    
    // Check if file exists before deleting
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
    }
  } catch (error) {
    console.error("Error deleting file from storage:", error);
    // Don't throw - allow deletion to continue even if storage deletion fails
    // This prevents orphaned documents if storage deletion fails
  }
}

"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./client";

/**
 * Upload a file directly to Firebase Storage from the client
 * This bypasses Vercel's payload size limits
 */
export async function uploadFileToStorageClient(
  file: File,
  path: string
): Promise<string> {
  const storageRef = ref(storage, path);
  
  // Upload the file
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: "public,max-age=31536000",
  });

  // Get the download URL
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}


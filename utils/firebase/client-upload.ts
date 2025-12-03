"use client";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTask,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth, storage } from "./client";

/**
 * Compress image on client side before upload
 */
async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, ".webp"),
              { type: "image/webp" }
            );
            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Wait for Firebase Auth to be ready
 */
function waitForAuth(): Promise<typeof auth.currentUser> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );

    // If auth is already ready, resolve immediately
    if (auth.currentUser) {
      unsubscribe();
      resolve(auth.currentUser);
    }
  });
}

/**
 * Upload a file directly to Firebase Storage from the client
 * Uses resumable uploads for better performance on large files
 * This bypasses Vercel's payload size limits
 */
export async function uploadFileToStorageClient(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Wait for auth to be ready
  const currentUser = await waitForAuth();

  if (!currentUser) {
    throw new Error(
      "You must be signed in to upload files. Please sign in and try again."
    );
  }

  // Verify email is authorized (client-side check, case-insensitive)
  const userEmail = currentUser.email?.toLowerCase();
  const allowedEmails = ["babyzewdie@gmail.com", "gtengten1010@gmail.com"].map(
    (e) => e.toLowerCase()
  );

  if (!userEmail || !allowedEmails.includes(userEmail)) {
    throw new Error(
      `Unauthorized: Your email (${currentUser.email}) is not authorized to upload files. Please contact the administrator.`
    );
  }

  const storageRef = ref(storage, path);

  // Compress images before upload
  let fileToUpload = file;
  let contentType = file.type;
  let finalStorageRef = storageRef;

  if (file.type?.startsWith("image/")) {
    try {
      fileToUpload = await compressImage(file);
      contentType = "image/webp";
      // Update path to use .webp extension
      const updatedPath = path.replace(/\.[^/.]+$/, ".webp");
      finalStorageRef = ref(storage, updatedPath);
    } catch (error) {
      console.warn("Image compression failed, uploading original:", error);
      // Continue with original file if compression fails
    }
  }

  // Use resumable upload for better performance
  const uploadTask: UploadTask = uploadBytesResumable(
    finalStorageRef,
    fileToUpload,
    {
      contentType,
      cacheControl: "public,max-age=31536000",
    }
  );

  // Track upload progress
  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => {
        // Provide more helpful error messages
        let errorMessage = "Failed to upload file";
        if (error.code === "storage/unauthorized") {
          errorMessage =
            "Unauthorized: Your email may not be authorized. Please check your Firebase Storage security rules.";
        } else if (error.code === "storage/canceled") {
          errorMessage = "Upload was canceled";
        } else if (error.code === "storage/unknown") {
          errorMessage =
            "Unknown error occurred. Please check your authentication and try again.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        reject(new Error(errorMessage));
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

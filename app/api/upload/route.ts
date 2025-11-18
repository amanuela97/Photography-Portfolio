import { NextRequest, NextResponse } from "next/server";
import {
  uploadFileToStorage,
  deleteFilesInFolder,
} from "@/utils/data-access/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

// Image file signatures (magic bytes)
const IMAGE_SIGNATURES: Record<string, number[][]> = {
  jpeg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  gif: [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP starts with RIFF)
  bmp: [[0x42, 0x4d]],
};

function isValidImageFile(
  buffer: Buffer,
  mimeType: string
): {
  valid: boolean;
  error?: string;
} {
  // Check if MIME type is an image
  if (!mimeType.startsWith("image/")) {
    return {
      valid: false,
      error: "File is not an image. Please upload a valid image file.",
    };
  }

  // Check file size (must have at least some bytes)
  if (buffer.length < 4) {
    return { valid: false, error: "File is too small or corrupted." };
  }

  // Extract image type from MIME type
  const imageType = mimeType.split("/")[1]?.toLowerCase();
  if (!imageType) {
    return { valid: false, error: "Invalid image type." };
  }

  // Check magic bytes based on file type
  const signatures = IMAGE_SIGNATURES[imageType];
  if (!signatures) {
    // For unknown types, at least verify it's not empty
    return {
      valid: buffer.length > 0,
      error: buffer.length === 0 ? "File is empty." : undefined,
    };
  }

  // Check if buffer matches any of the signatures for this image type
  const matches = signatures.some((signature) => {
    if (buffer.length < signature.length) return false;
    return signature.every((byte, index) => buffer[index] === byte);
  });

  if (!matches) {
    // Special case for WebP: check for WEBP string after RIFF
    if (imageType === "webp") {
      const hasWebP = buffer.toString("ascii", 8, 12) === "WEBP";
      if (!hasWebP) {
        return {
          valid: false,
          error: "File appears to be corrupted or is not a valid WebP image.",
        };
      }
      return { valid: true };
    }
    return {
      valid: false,
      error: `File appears to be corrupted or is not a valid ${imageType.toUpperCase()} image.`,
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder")?.toString() || "uploads";
    const replaceExisting =
      formData.get("replaceExisting")?.toString() === "true";

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No file provided or Invalid file" },
        { status: 400 }
      );
    }

    // Check file size (e.g., 50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Validate image file before uploading
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const validation = isValidImageFile(buffer, file.type);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid or corrupted image file" },
        { status: 400 }
      );
    }

    // If replaceExisting is true, delete all files in the folder first
    if (replaceExisting) {
      await deleteFilesInFolder(folder);
    }

    const extension = file.name.match(/\.[^/.]+$/)?.at(0) || ".jpg";
    // Use a fixed filename for landscape images to ensure replacement
    const filename = replaceExisting ? "hero" : `${Date.now()}`;
    const url = await uploadFileToStorage(file, {
      path: `${folder}/${filename}${extension}`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Upload failed" },
      { status: 500 }
    );
  }
}

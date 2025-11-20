import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  uploadFileToStorage,
  deleteFileByUrl,
} from "@/utils/data-access/storage";
import {
  createPhoto,
  updatePhoto,
  deletePhoto,
  getPhotos,
} from "@/utils/data-access/photos";
import type { EventType } from "@/utils/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const PHOTOS_TAG = "photos";
const FAVORITE_PHOTOS_TAG = "favorite-photos";

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
    const imageFile = formData.get("image") as File | null;
    const title = formData.get("title")?.toString() ?? "";
    const eventType = (formData.get("eventType")?.toString() ??
      "Other") as EventType;
    const isFavorite = formData.get("isFavorite")?.toString() === "on";

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json(
        { error: "Image file is required." },
        { status: 400 }
      );
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Validate image file
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const validation = isValidImageFile(buffer, imageFile.type);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Invalid or corrupted image file" },
        { status: 400 }
      );
    }

    // Upload to Firebase Storage
    const extension = imageFile.name.match(/\.[^/.]+$/)?.at(0) || ".jpg";
    const url = await uploadFileToStorage(imageFile, {
      path: `photos/${Date.now()}${extension}`,
    });

    if (!url) {
      return NextResponse.json(
        { error: "Failed to upload image to storage." },
        { status: 500 }
      );
    }

    // Create photo in Firestore
    await createPhoto({
      title,
      url,
      eventType,
      isFavorite,
    });

    revalidatePath("/admin");
    revalidatePath("/photos");
    revalidatePath("/");
    revalidatePath("/about");
    revalidateTag(PHOTOS_TAG, "default");
    revalidateTag(FAVORITE_PHOTOS_TAG, "default");

    return NextResponse.json({
      success: true,
      message: "Photo uploaded successfully.",
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to upload photo" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const isFavorite = formData.get("isFavorite")?.toString() === "true";
    const title = formData.get("title")?.toString();
    const eventType = formData.get("eventType")?.toString();

    if (!id) {
      return NextResponse.json({ error: "Photo ID missing." }, { status: 400 });
    }

    const updateData: {
      isFavorite?: boolean;
      title?: string;
      eventType?: EventType;
    } = {};

    // Handle favorite update
    if (formData.has("isFavorite")) {
      // Check favorite limit before updating
      if (isFavorite) {
        const photos = await getPhotos({ fresh: true });
        const favoriteCount = photos.filter(
          (p) => p.isFavorite && p.id !== id
        ).length;
        if (favoriteCount >= 6) {
          return NextResponse.json(
            {
              error:
                "Only 6 photos can be marked as favorite. Please deselect another favorite photo first.",
            },
            { status: 400 }
          );
        }
      }
      updateData.isFavorite = isFavorite;
    }

    // Handle title update
    if (title !== null && title !== undefined) {
      if (title.trim() === "") {
        return NextResponse.json(
          { error: "Title cannot be empty." },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    // Handle eventType update
    if (eventType !== null && eventType !== undefined) {
      updateData.eventType = eventType as EventType;
    }

    await updatePhoto(id, updateData);
    revalidatePath("/admin");
    revalidatePath("/photos");
    revalidatePath("/");
    revalidatePath("/about");
    revalidateTag(PHOTOS_TAG, "default");
    revalidateTag(FAVORITE_PHOTOS_TAG, "default");

    return NextResponse.json({
      success: true,
      message: "Photo updated successfully.",
    });
  } catch (error) {
    console.error("Photo update error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const url = formData.get("url")?.toString();

    if (!id) {
      return NextResponse.json({ error: "Photo ID missing." }, { status: 400 });
    }

    // Delete from Firestore first
    await deletePhoto(id);

    // Delete from Firebase Storage if URL is provided
    if (url) {
      try {
        await deleteFileByUrl(url);
      } catch (storageError) {
        console.error("Storage deletion error (non-fatal):", storageError);
        // Continue even if storage deletion fails - document is already deleted
      }
    }

    revalidatePath("/admin");
    revalidatePath("/photos");
    revalidatePath("/");
    revalidatePath("/about");
    revalidateTag(PHOTOS_TAG, "default");
    revalidateTag(FAVORITE_PHOTOS_TAG, "default");

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully.",
    });
  } catch (error) {
    console.error("Photo delete error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete photo" },
      { status: 500 }
    );
  }
}

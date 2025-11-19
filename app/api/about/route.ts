import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  uploadFileToStorage,
  deleteFilesInFolder,
} from "@/utils/data-access/storage";
import { saveAbout } from "@/utils/data-access/about";
import type { AboutDocument, GearItem, ProcessStep } from "@/utils/types";
import { parseJsonField } from "@/utils/data-access/helpers";

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
  if (!mimeType.startsWith("image/")) {
    return {
      valid: false,
      error: "File is not an image. Please upload a valid image file.",
    };
  }

  if (buffer.length < 4) {
    return { valid: false, error: "File is too small or corrupted." };
  }

  const imageType = mimeType.split("/")[1]?.toLowerCase();
  if (!imageType) {
    return { valid: false, error: "Invalid image type." };
  }

  const signatures = IMAGE_SIGNATURES[imageType];
  if (!signatures) {
    return {
      valid: buffer.length > 0,
      error: buffer.length === 0 ? "File is empty." : undefined,
    };
  }

  const matches = signatures.some((signature) => {
    if (buffer.length < signature.length) return false;
    return signature.every((byte, index) => buffer[index] === byte);
  });

  if (!matches) {
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
    
    // Parse form fields
    const steps = parseJsonField<ProcessStep[]>(formData.get("processSteps")) ?? [];
    const camera = parseJsonField<GearItem[]>(formData.get("cameraGear")) ?? [];
    const lenses = parseJsonField<GearItem[]>(formData.get("lensGear")) ?? [];
    const software = parseJsonField<GearItem[]>(formData.get("softwareGear")) ?? [];

    // Handle landscape image upload
    const landscapeFile = formData.get("landscapeFile") as File | null;
    let landscapeImageUrl = formData.get("landscapeImageUrl")?.toString().trim() ?? "";

    if (landscapeFile && landscapeFile.size > 0) {
      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024;
      if (landscapeFile.size > maxSize) {
        return NextResponse.json(
          { error: "File size exceeds 50MB limit" },
          { status: 400 }
        );
      }

      // Validate image file
      const arrayBuffer = await landscapeFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const validation = isValidImageFile(buffer, landscapeFile.type);

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Invalid or corrupted image file" },
          { status: 400 }
        );
      }

      // Delete existing landscape images
      await deleteFilesInFolder("about/landscape");

      // Upload new landscape image
      const extension = landscapeFile.name.match(/\.[^/.]+$/)?.at(0) || ".jpg";
      landscapeImageUrl = await uploadFileToStorage(landscapeFile, {
        path: `about/landscape/hero${extension}`,
      });
    }

    // Build payload
    const payload: AboutDocument = {
      hero: {
        intro: formData.get("heroIntro")?.toString() ?? "",
        landscapeImage: landscapeImageUrl,
      },
      story: {
        whoIAm: formData.get("storyWhoIAm")?.toString() ?? "",
        inspiration: formData.get("storyInspiration")?.toString() ?? "",
        howIStarted: formData.get("storyHowIStarted")?.toString() ?? "",
        philosophy: formData.get("storyPhilosophy")?.toString() ?? "",
      },
      process: {
        intro: formData.get("processIntro")?.toString() ?? "",
        whatToExpect: formData.get("processExpect")?.toString() ?? "",
        steps,
      },
      gear: {
        camera,
        lenses,
        software,
      },
    };

    // Save to Firestore
    await saveAbout(payload);
    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: "About content updated.",
    });
  } catch (error) {
    console.error("About save error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to save about content" },
      { status: 500 }
    );
  }
}


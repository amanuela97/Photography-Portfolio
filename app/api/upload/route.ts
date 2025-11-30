import { NextRequest, NextResponse } from "next/server";
import { uploadFileToStorage } from "@/utils/data-access/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Upload endpoint for individual files
 * Accepts a single file and returns its URL
 * This avoids Vercel's payload size limit by uploading files one at a time
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder")?.toString();
    const path = formData.get("path")?.toString();

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "File is required." },
        { status: 400 }
      );
    }

    // Check file size (50MB limit per file)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    let url: string;
    if (path) {
      url = await uploadFileToStorage(file, { path });
    } else if (folder) {
      url = await uploadFileToStorage(file, { folder });
    } else {
      return NextResponse.json(
        { error: "Either 'folder' or 'path' must be provided." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to upload file";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

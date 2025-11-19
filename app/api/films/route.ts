import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createFilm, updateFilm, deleteFilm } from "@/utils/data-access/films";
import {
  uploadFileToStorage,
  deleteFileByUrl,
} from "@/utils/data-access/storage";
import { extractExtension } from "@/utils/data-access/helpers";

function getSingleFile(formData: FormData, field: string): File | null {
  const entry = formData.get(field);
  if (entry instanceof File && entry.size > 0) {
    return entry;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const title = formData.get("title")?.toString() ?? "";
    const videoFile = getSingleFile(formData, "video");

    if (!title.trim()) {
      return NextResponse.json(
        { error: "Title is required." },
        { status: 400 }
      );
    }

    if (!videoFile) {
      return NextResponse.json(
        { error: "Video file is required." },
        { status: 400 }
      );
    }

    // Check file size (500MB limit for videos)
    const maxSize = 500 * 1024 * 1024;
    if (videoFile.size > maxSize) {
      return NextResponse.json(
        { error: "Video file size exceeds 500MB limit" },
        { status: 400 }
      );
    }

    // Validate video file type
    const validVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-msvideo",
    ];
    if (!validVideoTypes.includes(videoFile.type)) {
      return NextResponse.json(
        {
          error: "Invalid video file type. Supported: MP4, WebM, OGG, MOV, AVI",
        },
        { status: 400 }
      );
    }

    // Upload to Firebase Storage
    const extension = extractExtension(videoFile.name) || ".mp4";
    const url = await uploadFileToStorage(videoFile, {
      path: `films/${Date.now()}${extension}`,
    });

    if (!url) {
      return NextResponse.json(
        { error: "Failed to upload video to storage." },
        { status: 500 }
      );
    }

    // Create film in Firestore
    await createFilm({
      title: title.trim(),
      url,
    });

    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: "Film uploaded successfully.",
    });
  } catch (error) {
    console.error("Film upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to upload film" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const title = formData.get("title")?.toString();
    const videoFile = getSingleFile(formData, "video");

    if (!id) {
      return NextResponse.json({ error: "Film ID missing." }, { status: 400 });
    }

    const updateData: { title?: string; url?: string } = {};

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

    // Handle video file update
    if (videoFile) {
      // Check file size (500MB limit for videos)
      const maxSize = 500 * 1024 * 1024;
      if (videoFile.size > maxSize) {
        return NextResponse.json(
          { error: "Video file size exceeds 500MB limit" },
          { status: 400 }
        );
      }

      // Validate video file type
      const validVideoTypes = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
        "video/x-msvideo",
      ];
      if (!validVideoTypes.includes(videoFile.type)) {
        return NextResponse.json(
          {
            error:
              "Invalid video file type. Supported: MP4, WebM, OGG, MOV, AVI",
          },
          { status: 400 }
        );
      }

      // Get existing URL to delete old file
      const existingUrl = formData.get("existingUrl")?.toString();
      if (existingUrl) {
        try {
          await deleteFileByUrl(existingUrl);
        } catch (error) {
          console.error("Failed to delete old video file:", error);
          // Non-fatal, continue with upload
        }
      }

      // Upload new video
      const extension = extractExtension(videoFile.name) || ".mp4";
      const url = await uploadFileToStorage(videoFile, {
        path: `films/${Date.now()}${extension}`,
      });

      if (!url) {
        return NextResponse.json(
          { error: "Failed to upload video to storage." },
          { status: 500 }
        );
      }

      updateData.url = url;
    }

    await updateFilm(id, updateData);
    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: "Film updated successfully.",
    });
  } catch (error) {
    console.error("Film update error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update film" },
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
      return NextResponse.json({ error: "Film ID missing." }, { status: 400 });
    }

    // Delete video from Firebase Storage if URL provided
    if (url) {
      try {
        await deleteFileByUrl(url);
      } catch (error) {
        console.error("Failed to delete video file from storage:", error);
        // Non-fatal, continue with Firestore deletion
      }
    }

    // Delete film from Firestore
    await deleteFilm(id);
    revalidatePath("/admin");

    return NextResponse.json({
      success: true,
      message: "Film deleted successfully.",
    });
  } catch (error) {
    console.error("Film delete error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete film" },
      { status: 500 }
    );
  }
}

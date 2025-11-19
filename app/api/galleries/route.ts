import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  uploadFileToStorage,
  uploadMultipleFiles,
} from "@/utils/data-access/storage";
import type { GalleryDocument } from "@/utils/types";
import {
  createGallery,
  updateGallery,
  deleteGallery,
  getGalleryBySlug,
  getGalleryById,
} from "@/utils/data-access/galleries";
import { parseJsonField } from "@/utils/data-access/helpers";
import { extractExtension } from "@/utils/data-access/helpers";
import { slugify, isValidSlug } from "@/utils/slug";

export const runtime = "nodejs";
export const maxDuration = 60;

function getSingleFile(formData: FormData, field: string): File | null {
  const entry = formData.get(field);
  if (entry instanceof File && entry.size > 0) {
    return entry;
  }
  return null;
}

function getFiles(formData: FormData, field: string): File[] {
  const entries = formData.getAll(field);
  return entries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  );
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const normalizedSlug = slugify(formData.get("slug")?.toString() ?? "");
    if (!normalizedSlug || !isValidSlug(normalizedSlug)) {
      return NextResponse.json(
        {
          error:
            "Please provide a unique slug using letters, numbers, or dashes.",
        },
        { status: 400 }
      );
    }

    const existing = await getGalleryBySlug(normalizedSlug);
    if (existing) {
      return NextResponse.json(
        { error: "That slug is already in use. Please choose another one." },
        { status: 409 }
      );
    }

    const coverFile = getSingleFile(formData, "coverImage");
    const galleryImages = getFiles(formData, "galleryImages");
    const videoFile = getSingleFile(formData, "galleryVideo");

    let coverUrl: string | null = null;
    if (coverFile) {
      const ext = extractExtension(coverFile.name) || ".jpg";
      coverUrl = await uploadFileToStorage(coverFile, {
        path: `galleries/${normalizedSlug}/cover${ext}`,
      });
    }

    const uploadedImages = await uploadMultipleFiles(galleryImages, {
      folder: `galleries/${normalizedSlug}/images`,
    });

    let videoUrl = "";
    if (videoFile) {
      const ext = extractExtension(videoFile.name) || ".mp4";
      videoUrl = await uploadFileToStorage(videoFile, {
        path: `galleries/${normalizedSlug}/video${ext}`,
      });
    }

    await createGallery({
      slug: normalizedSlug,
      title: formData.get("title")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      coverImageUrl: coverUrl,
      images: uploadedImages,
      video: videoUrl,
      isFeatured: formData.get("isFeatured") === "on",
    });

    revalidatePath("/admin");
    revalidatePath("/admin/gallery");
    revalidatePath(`/admin/gallery/${normalizedSlug}`);
    return NextResponse.json({
      success: true,
      message: "Gallery created.",
      slug: normalizedSlug,
    });
  } catch (error) {
    console.error("Gallery create error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create gallery" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    if (!id) {
      return NextResponse.json(
        { error: "Gallery ID missing." },
        { status: 400 }
      );
    }

    const existingGallery = await getGalleryById(id);
    if (!existingGallery) {
      return NextResponse.json(
        { error: "Gallery not found." },
        { status: 404 }
      );
    }

    const previousSlug = existingGallery.slug;
    const rawSlug = formData.get("slug")?.toString();
    const slug = rawSlug ? slugify(rawSlug) : undefined;

    if (rawSlug && (!slug || !isValidSlug(slug))) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid slug using letters, numbers, or dashes.",
        },
        { status: 400 }
      );
    }

    if (slug) {
      const existing = await getGalleryBySlug(slug);
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "That slug is already in use. Please choose another one." },
          { status: 409 }
        );
      }
    }

    const storageSlug = slug || previousSlug || id;
    const coverFile = getSingleFile(formData, "coverImage");
    const newImageFiles = getFiles(formData, "galleryImages");
    const videoFile = getSingleFile(formData, "galleryVideo");

    const existingImages =
      parseJsonField<string[]>(formData.get("existingImages")) ?? [];

    // Handle individual image deletion
    const deleteImageUrl = formData.get("deleteImageUrl")?.toString();
    let images = existingImages;

    if (deleteImageUrl) {
      // Remove the image from the array
      images = images.filter((url) => url !== deleteImageUrl);

      // Delete the file from storage
      try {
        const { deleteFileByUrl } = await import("@/utils/data-access/storage");
        await deleteFileByUrl(deleteImageUrl);
      } catch (error) {
        console.error("Failed to delete image from storage:", error);
        // Non-fatal, continue with update
      }
    }

    if (newImageFiles.length) {
      const uploaded = await uploadMultipleFiles(newImageFiles, {
        folder: `galleries/${storageSlug}/images`,
      });
      images = [...images, ...uploaded];
    }

    let coverUrl = formData.get("existingCoverImage")?.toString() ?? "";
    if (coverFile) {
      const ext = extractExtension(coverFile.name) || ".jpg";
      coverUrl = await uploadFileToStorage(coverFile, {
        path: `galleries/${storageSlug}/cover${ext}`,
      });
    }

    let videoUrl = formData.get("existingVideoUrl")?.toString() ?? "";
    if (videoFile) {
      const ext = extractExtension(videoFile.name) || ".mp4";
      videoUrl = await uploadFileToStorage(videoFile, {
        path: `galleries/${storageSlug}/video${ext}`,
      });
    }

    const payload: Partial<Omit<GalleryDocument, "id">> = {
      title: formData.get("title")?.toString() ?? undefined,
      description: formData.get("description")?.toString() ?? undefined,
      coverImageUrl: coverUrl || null,
      images,
      video: videoUrl,
      isFeatured: formData.get("isFeatured") === "on",
    };

    if (slug) {
      payload.slug = slug;
    }

    await updateGallery(id, payload);

    const resultingSlug = slug || previousSlug;

    revalidatePath("/admin");
    revalidatePath("/admin/gallery");
    if (previousSlug) {
      revalidatePath(`/admin/gallery/${previousSlug}`);
    }
    if (resultingSlug && resultingSlug !== previousSlug) {
      revalidatePath(`/admin/gallery/${resultingSlug}`);
    }

    return NextResponse.json({
      success: true,
      message: "Gallery updated.",
      slug: resultingSlug,
    });
  } catch (error) {
    console.error("Gallery update error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to update gallery" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = formData.get("id")?.toString();
    const slug = formData.get("slug")?.toString();

    if (!id) {
      return NextResponse.json(
        { error: "Gallery ID missing." },
        { status: 400 }
      );
    }

    // Delete all files in the gallery folder
    if (slug) {
      try {
        const { deleteFilesInFolder } = await import(
          "@/utils/data-access/storage"
        );
        await deleteFilesInFolder(`galleries/${slug}`);
      } catch (error) {
        console.error("Failed to delete gallery files from storage:", error);
        // Non-fatal, continue with Firestore deletion
      }
    }

    await deleteGallery(id);
    revalidatePath("/admin");
    revalidatePath("/admin/gallery");
    return NextResponse.json({
      success: true,
      message: "Gallery deleted.",
    });
  } catch (error) {
    console.error("Gallery delete error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to delete gallery" },
      { status: 500 }
    );
  }
}

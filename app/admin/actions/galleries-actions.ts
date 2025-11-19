"use server";

import { revalidatePath } from "next/cache";
import {
  createGallery,
  deleteGallery,
  updateGallery,
} from "@/utils/data-access/galleries";
import type { ActionState } from "./action-state";
import {
  uploadFileToStorage,
  uploadMultipleFiles,
} from "@/utils/data-access/storage";
import { parseJsonField } from "@/utils/data-access/helpers";

interface GalleryActionData {
  id?: string;
}

export async function createGalleryAction(
  _prevState: ActionState<GalleryActionData>,
  formData: FormData
): Promise<ActionState<GalleryActionData>> {
  try {
    const slug = formData.get("slug")?.toString()?.trim() ?? "";
    const coverFile = getSingleFile(formData, "coverImage");
    const galleryImages = getFiles(formData, "galleryImages");
    const videoFile = getSingleFile(formData, "galleryVideo");

    let coverUrl: string | null = null;
    if (coverFile) {
      const ext = extractExtension(coverFile.name) || ".jpg";
      coverUrl = await uploadFileToStorage(coverFile, {
        path: `galleries/${slug}/cover${ext}`,
      });
    }

    const uploadedImages = await uploadMultipleFiles(galleryImages, {
      folder: `galleries/${slug}/images`,
    });

    let videoUrl = "";
    if (videoFile) {
      const ext = extractExtension(videoFile.name) || ".mp4";
      videoUrl = await uploadFileToStorage(videoFile, {
        path: `galleries/${slug}/video${ext}`,
      });
    }

    await createGallery({
      slug,
      title: formData.get("title")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      coverImageUrl: coverUrl,
      images: uploadedImages,
      video: videoUrl,
      isFeatured: formData.get("isFeatured") === "on",
    });

    // Revalidate admin pages
    revalidatePath("/admin");
    revalidatePath("/admin/gallery");
    if (slug) {
      revalidatePath(`/admin/gallery/${slug}`);
    }
    
    // Revalidate public-facing pages
    revalidatePath("/galleries");
    revalidatePath("/");
    
    return { status: "success", message: "Gallery created." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function updateGalleryAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Gallery ID missing.");

    const slug = formData.get("slug")?.toString()?.trim();
    const storageSlug = slug || id;
    const coverFile = getSingleFile(formData, "coverImage");
    const newImageFiles = getFiles(formData, "galleryImages");
    const videoFile = getSingleFile(formData, "galleryVideo");

    const existingImages =
      parseJsonField<string[]>(formData.get("existingImages")) ?? [];
    let images = existingImages;

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

    await updateGallery(id, {
      slug,
      title: formData.get("title")?.toString(),
      description: formData.get("description")?.toString(),
      coverImageUrl: coverUrl || null,
      images,
      video: videoUrl,
      isFeatured: formData.get("isFeatured") === "on",
    });

    // Revalidate admin pages
    revalidatePath("/admin");
    revalidatePath("/admin/gallery");
    if (slug) {
      revalidatePath(`/admin/gallery/${slug}`);
    }
    
    // Revalidate public-facing pages
    revalidatePath("/galleries");
    revalidatePath("/");
    if (slug) {
      revalidatePath(`/galleries/${slug}`);
    }
    
    return { status: "success", message: "Gallery updated." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

export async function deleteGalleryAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id")?.toString();
    if (!id) throw new Error("Gallery ID missing.");
    const slug = formData.get("slug")?.toString();
    await deleteGallery(id);
    
    // Revalidate admin pages
    revalidatePath("/admin");
    revalidatePath("/admin/gallery");
    
    // Revalidate public-facing pages
    revalidatePath("/galleries");
    revalidatePath("/");
    if (slug) {
      revalidatePath(`/galleries/${slug}`);
    }
    
    return { status: "success", message: "Gallery deleted." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: (error as Error).message };
  }
}

function getSingleFile(formData: FormData, field: string): File | null {
  const entries = formData.getAll(field);
  for (const entry of entries) {
    if (entry instanceof File && entry.size > 0) {
      return entry;
    }
  }
  return null;
}

function getFiles(formData: FormData, field: string): File[] {
  return formData
    .getAll(field)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

function extractExtension(name: string): string {
  const match = name.match(/\.[^/.]+$/);
  return match ? match[0] : "";
}

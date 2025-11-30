import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  uploadFileToStorage,
  uploadMultipleFiles,
  moveFileInStorage,
  getStoragePathFromUrl,
  generateSignedUrl,
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

const GALLERIES_TAG = "galleries";
const FEATURED_GALLERIES_TAG = "featured-galleries";
const GALLERIES_FOLDER = "galleries";

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

interface GalleryAssetMoveOptions {
  images: string[];
  coverUrl?: string | null;
  videoUrl?: string | null;
  fromSlug: string;
  toSlug: string;
}

async function moveGalleryAssets({
  images,
  coverUrl,
  videoUrl,
  fromSlug,
  toSlug,
}: GalleryAssetMoveOptions) {
  const [nextCover, nextVideo, nextImages] = await Promise.all([
    moveSingleAssetUrl(coverUrl, fromSlug, toSlug),
    moveSingleAssetUrl(videoUrl, fromSlug, toSlug),
    moveMultipleAssetUrls(images, fromSlug, toSlug),
  ]);

  return {
    coverUrl: nextCover,
    videoUrl: nextVideo,
    images: nextImages,
  };
}

async function moveMultipleAssetUrls(
  urls: string[],
  fromSlug: string,
  toSlug: string
): Promise<string[]> {
  return Promise.all(
    urls.map((url) => moveSingleAssetUrl(url, fromSlug, toSlug))
  );
}

async function moveSingleAssetUrl(
  signedUrl: string | null | undefined,
  fromSlug: string,
  toSlug: string
): Promise<string> {
  if (!signedUrl) {
    return signedUrl ?? "";
  }

  const storagePath = getStoragePathFromUrl(signedUrl);
  if (!storagePath) {
    return signedUrl;
  }

  const newPath = getPathWithUpdatedSlug(storagePath, fromSlug, toSlug);
  if (!newPath) {
    return signedUrl;
  }

  try {
    await moveFileInStorage(storagePath, newPath);
    return await generateSignedUrl(newPath);
  } catch (error) {
    console.error("Failed to move gallery asset:", error);
    return signedUrl;
  }
}

function getPathWithUpdatedSlug(
  path: string,
  fromSlug: string,
  toSlug: string
): string | null {
  const prefix = `${GALLERIES_FOLDER}/${fromSlug}/`;
  if (!path.startsWith(prefix)) {
    return null;
  }
  const suffix = path.slice(prefix.length);
  return `${GALLERIES_FOLDER}/${toSlug}/${suffix}`;
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

    const existing = await getGalleryBySlug(normalizedSlug, { fresh: true });
    if (existing) {
      return NextResponse.json(
        { error: "That slug is already in use. Please choose another one." },
        { status: 409 }
      );
    }

    // Check if URLs are provided (new approach - files uploaded separately)
    // or files are provided (legacy approach)
    const coverImageUrl = formData.get("coverImageUrl")?.toString();
    const galleryImageUrls = formData
      .getAll("galleryImageUrls")
      .map((url) => url.toString());
    const videoUrlParam = formData.get("videoUrl")?.toString();

    const coverFile = getSingleFile(formData, "coverImage");
    const galleryImages = getFiles(formData, "galleryImages");
    const videoFile = getSingleFile(formData, "galleryVideo");

    let coverUrl: string | null = null;
    let uploadedImages: string[] = [];
    let videoUrl = "";

    // Use URLs if provided (new approach), otherwise upload files (backward compatibility)
    if (coverImageUrl) {
      coverUrl = coverImageUrl;
    } else if (coverFile) {
      const ext = extractExtension(coverFile.name) || ".jpg";
      coverUrl = await uploadFileToStorage(coverFile, {
        path: `${GALLERIES_FOLDER}/${normalizedSlug}/cover${ext}`,
      });
    }

    if (galleryImageUrls.length > 0) {
      uploadedImages = galleryImageUrls;
    } else if (galleryImages.length > 0) {
      uploadedImages = await uploadMultipleFiles(galleryImages, {
        folder: `${GALLERIES_FOLDER}/${normalizedSlug}/images`,
      });
    }

    if (videoUrlParam) {
      videoUrl = videoUrlParam;
    } else if (videoFile) {
      const ext = extractExtension(videoFile.name) || ".mp4";
      videoUrl = await uploadFileToStorage(videoFile, {
        path: `${GALLERIES_FOLDER}/${normalizedSlug}/video${ext}`,
      });
    }

    await createGallery({
      slug: normalizedSlug,
      title: formData.get("title")?.toString() ?? "",
      description: formData.get("description")?.toString() ?? "",
      coverImageUrl: coverUrl as string | null,
      images: (uploadedImages as string[]) || [],
      video: (videoUrl as string) || "",
      isFeatured: formData.get("isFeatured") === "on",
    });

    // Revalidate admin pages
    revalidatePath("/admin");
    revalidatePath("/admin/gallery");
    revalidatePath(`/admin/gallery/${normalizedSlug}`);

    // Revalidate public-facing pages
    revalidatePath("/galleries");
    revalidatePath("/");
    revalidateTag(GALLERIES_TAG, "default");
    revalidateTag(FEATURED_GALLERIES_TAG, "default");

    return NextResponse.json({
      success: true,
      message: "Gallery created.",
      slug: normalizedSlug,
    });
  } catch (error) {
    console.error("Gallery create error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to create gallery";
    
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
      console.error("Error name:", error.name);
    }
    
    return NextResponse.json(
      { error: errorMessage },
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

    const existingGallery = await getGalleryById(id, { fresh: true });
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
      const existing = await getGalleryBySlug(slug, { fresh: true });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: "That slug is already in use. Please choose another one." },
          { status: 409 }
        );
      }
    }

    const storageSlug = slug || previousSlug || id;
    const slugChanged =
      Boolean(slug) && Boolean(previousSlug) && slug !== previousSlug;
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

    let coverUrl = formData.get("existingCoverImage")?.toString() ?? "";
    let videoUrl = formData.get("existingVideoUrl")?.toString() ?? "";

    if (slugChanged && previousSlug && slug) {
      try {
        const movedAssets = await moveGalleryAssets({
          images,
          coverUrl,
          videoUrl,
          fromSlug: previousSlug,
          toSlug: slug,
        });
        images = movedAssets.images;
        coverUrl = movedAssets.coverUrl;
        videoUrl = movedAssets.videoUrl;
      } catch (error) {
        console.error("Failed to move gallery assets:", error);
      }
    }

    if (newImageFiles.length) {
      const uploaded = await uploadMultipleFiles(newImageFiles, {
        folder: `${GALLERIES_FOLDER}/${storageSlug}/images`,
      });
      images = [...images, ...uploaded];
    }

    if (coverFile) {
      const ext = extractExtension(coverFile.name) || ".jpg";
      coverUrl = await uploadFileToStorage(coverFile, {
        path: `${GALLERIES_FOLDER}/${storageSlug}/cover${ext}`,
      });
    }

    if (videoFile) {
      const ext = extractExtension(videoFile.name) || ".mp4";
      videoUrl = await uploadFileToStorage(videoFile, {
        path: `${GALLERIES_FOLDER}/${storageSlug}/video${ext}`,
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

    // Revalidate admin pages
    revalidatePath("/admin");
    revalidatePath("/admin/gallery");
    if (previousSlug) {
      revalidatePath(`/admin/gallery/${previousSlug}`);
    }
    if (resultingSlug && resultingSlug !== previousSlug) {
      revalidatePath(`/admin/gallery/${resultingSlug}`);
    }

    // Revalidate public-facing pages
    revalidatePath("/galleries");
    revalidatePath("/");
    if (previousSlug) {
      revalidatePath(`/galleries/${previousSlug}`);
    }
    if (resultingSlug) {
      revalidatePath(`/galleries/${resultingSlug}`);
    }
    revalidateTag(GALLERIES_TAG, "default");
    revalidateTag(FEATURED_GALLERIES_TAG, "default");

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

    // Revalidate admin pages
    revalidatePath("/admin");
    revalidatePath("/admin/gallery");

    // Revalidate public-facing pages
    revalidatePath("/galleries");
    revalidatePath("/");
    if (slug) {
      revalidatePath(`/galleries/${slug}`);
    }
    revalidateTag(GALLERIES_TAG, "default");
    revalidateTag(FEATURED_GALLERIES_TAG, "default");

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

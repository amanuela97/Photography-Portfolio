"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";
import type { GalleryDocument } from "@/utils/types";
import { MediaDropzone } from "../components/media-dropzone";
import { appendCacheBuster } from "@/utils/cache-buster";
import { getApiUrl } from "@/utils/api-url";
import { uploadFileToStorageClient } from "@/utils/firebase/client-upload";
import { slugify } from "@/utils/slug";

interface GalleryListProps {
  galleries: GalleryDocument[];
}

export function GalleryList({ galleries }: GalleryListProps) {
  if (!galleries.length) {
    return (
      <Card className="border border-brand-muted/40 bg-brand-surface shadow-soft">
        <CardHeader>
          <CardTitle className="text-brand-primary">
            Existing galleries
          </CardTitle>
          <CardDescription>No galleries added yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {galleries.map((gallery) => (
        <GalleryCard key={gallery.id} gallery={gallery} />
      ))}
    </div>
  );
}

function GalleryCard({ gallery }: { gallery: GalleryDocument }) {
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [coverProgress, setCoverProgress] = useState(0);
  const [imagesProgress, setImagesProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [retainedImages, setRetainedImages] = useState<string[]>(
    gallery.images
  );
  const [existingCover, setExistingCover] = useState(
    gallery.coverImageUrl ?? ""
  );
  const [existingVideo, setExistingVideo] = useState(gallery.video ?? "");

  const coverPreview = existingCover
    ? appendCacheBuster(existingCover, gallery.updatedAt)
    : undefined;


  useEffect(() => {
    if (coverFiles.length === 0) {
      setCoverProgress(0);
      return;
    }
    if (pendingUpdate) {
      setCoverProgress((prev) => (prev < 60 ? 60 : prev));
    }
  }, [coverFiles.length, pendingUpdate]);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setImagesProgress(0);
      return;
    }
    if (pendingUpdate) {
      setImagesProgress((prev) => (prev < 60 ? 60 : prev));
    }
  }, [imageFiles.length, pendingUpdate]);

  useEffect(() => {
    if (videoFiles.length === 0) {
      setVideoProgress(0);
      return;
    }
    if (pendingUpdate) {
      setVideoProgress((prev) => (prev < 60 ? 60 : prev));
    }
  }, [videoFiles.length, pendingUpdate]);

  return (
    <Card className="border border-brand-muted/40 bg-brand-surface shadow-soft">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="flex items-center gap-3 text-brand-primary">
          {gallery.title}
          {gallery.isFeatured ? (
            <Badge className="bg-brand-primary text-brand-contrast">
              Featured
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription className="text-brand-muted">
          {gallery.slug} • Updated{" "}
          {gallery.updatedAt
            ? format(new Date(gallery.updatedAt), "MMM d, yyyy")
            : "—"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setPendingUpdate(true);
              setCoverProgress(10);
              setImagesProgress(10);
              setVideoProgress(10);
              toast.loading("Updating gallery...", { id: `gallery-update-${gallery.id}` });

              const form = e.currentTarget;
              const formData = new FormData(form);
              
              // Get slug for storage path
              const rawSlug = formData.get("slug")?.toString() ?? gallery.slug ?? "";
              const normalizedSlug = slugify(rawSlug) || slugify(gallery.id || "gallery");
              const galleryFolder = `galleries/${normalizedSlug}`;
              
              const uploadPromises: Promise<void>[] = [];
              let coverUrl: string | null = null;
              const uploadedImageUrls: string[] = [];
              let videoUrl: string | null = null;

              // Upload cover image directly to Firebase Storage
              if (coverFiles.length > 0 && coverFiles[0]) {
                const coverFile = coverFiles[0];
                const ext = coverFile.name.match(/\.[^/.]+$/)?.at(0) || ".jpg";
                const storagePath = `${galleryFolder}/cover${ext}`;

                uploadPromises.push(
                  uploadFileToStorageClient(coverFile, storagePath, (progress) => {
                    setCoverProgress(20 + progress * 0.4); // 20-60%
                  })
                    .then((url) => {
                      coverUrl = url;
                      setCoverProgress(100);
                    })
                    .catch((error) => {
                      console.error("Cover image upload error:", error);
                      throw new Error(
                        error instanceof Error
                          ? error.message
                          : "Failed to upload cover image."
                      );
                    })
                );
              } else {
                setCoverProgress(100);
              }

              // Upload gallery images in parallel
              if (imageFiles.length > 0) {
                const totalImages = imageFiles.length;
                imageFiles.forEach((file, index) => {
                  const ext = file.name.match(/\.[^/.]+$/)?.at(0) || ".jpg";
                  const storagePath = `${galleryFolder}/images/${Date.now()}-${index}${ext}`;

                  uploadPromises.push(
                    uploadFileToStorageClient(file, storagePath, (progress) => {
                      const baseProgress = 20;
                      const imageProgress = (progress / totalImages) * 0.6;
                      const currentImageProgress = (index / totalImages) * 0.6;
                      setImagesProgress(baseProgress + currentImageProgress + imageProgress);
                    })
                      .then((url) => {
                        uploadedImageUrls.push(url);
                        const completed = uploadedImageUrls.length;
                        setImagesProgress(20 + (completed / totalImages) * 80);
                      })
                      .catch((error) => {
                        console.error(`Image ${index + 1} upload error:`, error);
                        throw new Error(
                          error instanceof Error
                            ? error.message
                            : `Failed to upload image ${index + 1}.`
                        );
                      })
                  );
                });
              } else {
                setImagesProgress(100);
              }

              // Upload video
              if (videoFiles.length > 0 && videoFiles[0]) {
                const videoFile = videoFiles[0];
                const ext = videoFile.name.match(/\.[^/.]+$/)?.at(0) || ".mp4";
                const storagePath = `${galleryFolder}/video${ext}`;

                uploadPromises.push(
                  uploadFileToStorageClient(videoFile, storagePath, (progress) => {
                    setVideoProgress(20 + progress * 0.8); // 20-100%
                  })
                    .then((url) => {
                      videoUrl = url;
                      setVideoProgress(100);
                    })
                    .catch((error) => {
                      console.error("Video upload error:", error);
                      throw new Error(
                        error instanceof Error
                          ? error.message
                          : "Failed to upload video."
                      );
                    })
                );
              } else {
                setVideoProgress(100);
              }

              // Wait for all uploads to complete
              await Promise.all(uploadPromises);

              // Now update gallery with URLs only (no files)
              const updateFormData = new FormData();
              updateFormData.set("id", gallery.id);
              updateFormData.set("slug", normalizedSlug);
              updateFormData.set("title", formData.get("title")?.toString() ?? "");
              updateFormData.set("description", formData.get("description")?.toString() ?? "");
              if (coverUrl) {
                updateFormData.set("coverImageUrl", coverUrl);
              }
              uploadedImageUrls.forEach((url) => {
                updateFormData.append("galleryImageUrls", url);
              });
              if (videoUrl) {
                updateFormData.set("videoUrl", videoUrl);
              }
              updateFormData.set("existingImages", JSON.stringify(gallery.images));
              updateFormData.set("existingCoverImage", gallery.coverImageUrl ?? "");
              updateFormData.set("existingVideoUrl", gallery.video ?? "");
              if (formData.get("isFeatured") === "on") {
                updateFormData.set("isFeatured", "on");
              }

              setCoverProgress(60);
              setImagesProgress(60);
              setVideoProgress(60);

              const response = await fetch(getApiUrl("api/galleries"), {
                method: "PUT",
                body: updateFormData,
              });

              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.error || "Failed to update gallery");
              }

              setCoverProgress(100);
              setImagesProgress(100);
              setVideoProgress(100);
              toast.success(result.message || "Gallery updated successfully!", {
                id: `gallery-update-${gallery.id}`,
                duration: 4000,
              });

              setTimeout(() => {
                setCoverProgress(0);
                setImagesProgress(0);
                setVideoProgress(0);
              }, 800);

              setCoverFiles([]);
              setImageFiles([]);
              setVideoFiles([]);
            } catch (error) {
              console.error("Gallery update error:", error);
              toast.error(
                (error as Error).message || "Failed to update gallery",
                { id: `gallery-update-${gallery.id}`, duration: 4000 }
              );
              setCoverProgress(0);
              setImagesProgress(0);
              setVideoProgress(0);
            } finally {
              setPendingUpdate(false);
            }
          }}
        >
          <input type="hidden" name="id" value={gallery.id} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                name="slug"
                defaultValue={gallery.slug}
                className="bg-brand-background text-brand-text"
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                name="title"
                defaultValue={gallery.title}
                className="bg-brand-background text-brand-text"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              rows={3}
              defaultValue={gallery.description}
              className="bg-brand-background text-brand-text"
            />
          </div>
          <input
            type="hidden"
            name="existingImages"
            value={JSON.stringify(retainedImages)}
          />
          <input
            type="hidden"
            name="existingCoverImage"
            value={existingCover}
          />
          <input type="hidden" name="existingVideoUrl" value={existingVideo} />
          <MediaDropzone
            name="coverImage"
            label="Cover image"
            description="Upload a new cover image."
            accept={{ "image/*": [] }}
            progress={coverProgress}
            onFilesChange={setCoverFiles}
            existingFiles={coverPreview ? [coverPreview] : undefined}
            onRemoveExisting={() => setExistingCover("")}
          />
          <MediaDropzone
            name="galleryImages"
            label="Gallery images"
            description="Upload additional gallery images."
            accept={{ "image/*": [] }}
            multiple
            progress={imagesProgress}
            onFilesChange={setImageFiles}
            existingFiles={retainedImages}
            onRemoveExisting={(index) =>
              setRetainedImages((prev) =>
                prev.filter((_, idx) => idx !== index)
              )
            }
          />
          <MediaDropzone
            name="galleryVideo"
            label="Highlight video"
            description="Upload or replace the highlight video."
            accept={{ "video/*": [] }}
            progress={videoProgress}
            onFilesChange={setVideoFiles}
            existingFiles={existingVideo ? [existingVideo] : undefined}
            onRemoveExisting={() => setExistingVideo("")}
          />
          <div className="flex items-center gap-2">
            <Checkbox name="isFeatured" defaultChecked={gallery.isFeatured} />
            <Label>Feature on home page</Label>
          </div>
          <CardFooter className="flex flex-col gap-3 px-0">
            <div className="flex w-full items-center justify-between gap-3">
              <Button
                type="submit"
                disabled={pendingUpdate}
                className="bg-brand-primary text-brand-contrast cursor-pointer"
              >
                {pendingUpdate ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pendingDelete}
                onClick={async () => {
                  try {
                    setPendingDelete(true);
                    toast.loading("Deleting gallery...", { id: `gallery-delete-${gallery.id}` });

                    const formData = new FormData();
                    formData.append("id", gallery.id);

                    const response = await fetch(getApiUrl("api/galleries"), {
                      method: "DELETE",
                      body: formData,
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || "Failed to delete gallery");
                    }

                    toast.success(result.message || "Gallery deleted successfully!", {
                      id: `gallery-delete-${gallery.id}`,
                      duration: 4000,
                    });
                  } catch (error) {
                    console.error("Gallery delete error:", error);
                    toast.error(
                      (error as Error).message || "Failed to delete gallery",
                      { id: `gallery-delete-${gallery.id}`, duration: 4000 }
                    );
                  } finally {
                    setPendingDelete(false);
                  }
                }}
              >
                {pendingDelete ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

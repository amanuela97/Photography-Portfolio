"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaDropzone } from "@/app/admin/components/media-dropzone";
import { X, Save, Sparkles } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import type { GalleryDocument } from "@/utils/types";
import { slugify, SLUG_INPUT_PATTERN } from "@/utils/slug";
import { appendCacheBuster } from "@/utils/cache-buster";
import { getApiUrl } from "@/utils/api-url";
import { uploadFileToStorageClient } from "@/utils/firebase/client-upload";

interface GalleryEditFormProps {
  gallery: GalleryDocument;
}

export function GalleryEditForm({ gallery }: GalleryEditFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
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
  const [slugInput, setSlugInput] = useState(gallery.slug ?? "");
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    if (coverFiles.length === 0) {
      setCoverProgress(0);
      return;
    }
    if (isSaving) {
      setCoverProgress((prev) => (prev < 60 ? 60 : prev));
    }
  }, [coverFiles.length, isSaving]);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setImagesProgress(0);
      return;
    }
    if (isSaving) {
      setImagesProgress((prev) => (prev < 60 ? 60 : prev));
    }
  }, [imageFiles.length, isSaving]);

  useEffect(() => {
    if (videoFiles.length === 0) {
      setVideoProgress(0);
      return;
    }
    if (isSaving) {
      setVideoProgress((prev) => (prev < 60 ? 60 : prev));
    }
  }, [videoFiles.length, isSaving]);

  useEffect(() => {
    setSlugInput(gallery.slug ?? "");
  }, [gallery.slug]);

  useEffect(() => {
    setExistingCover(gallery.coverImageUrl ?? "");
  }, [gallery.coverImageUrl]);

  const handleSlugChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSlugInput(cleaned);
    setSlugError(null);
  };

  const handleImageDelete = async (imageUrl: string) => {
    try {
      toast.loading("Deleting image...", { id: `image-delete-${imageUrl}` });

      const formData = new FormData();
      formData.append("id", gallery.id);
      formData.append("deleteImageUrl", imageUrl);
      formData.append("existingImages", JSON.stringify(retainedImages));
      formData.append("slug", gallery.slug);
      formData.append("title", gallery.title);
      formData.append("description", gallery.description || "");
      formData.append("existingCoverImage", existingCover);
      formData.append("existingVideoUrl", existingVideo);
      if (gallery.isFeatured) {
        formData.append("isFeatured", "on");
      }

      const response = await fetch(getApiUrl("api/galleries"), {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete image");
      }

      toast.success("Image deleted successfully!", {
        id: `image-delete-${imageUrl}`,
        duration: 3000,
        position: "top-right",
      });

      setRetainedImages((prev) => prev.filter((url) => url !== imageUrl));
      router.refresh();
    } catch (error) {
      console.error("Image delete error:", error);
      toast.error((error as Error).message || "Unable to delete image.", {
        id: `image-delete-${imageUrl}`,
        duration: 4000,
      });
    }
  };

  return (
    <Card className="border-2 border-border bg-secondary shadow-soft overflow-hidden">
      <CardHeader className="bg-linear-to-r from-secondary to-background border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Edit Gallery Details
          </CardTitle>
        </div>
        <p className="text-muted text-sm mt-2">
          Update your gallery content, images, and settings
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <form
          className="grid gap-6 sm:gap-8 w-full"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              setIsSaving(true);
              setCoverProgress(10);
              setImagesProgress(10);
              setVideoProgress(10);
              toast.loading("Updating gallery...", {
                id: `gallery-update-${gallery.id}`,
              });

              const form = e.currentTarget;
              const formData = new FormData(form);
              const normalizedSlug = slugify(slugInput);

              if (!normalizedSlug) {
                setSlugError(
                  "Please enter a slug using letters, numbers, or dashes."
                );
                throw new Error("Slug is required.");
              }

              setSlugError(null);

              // Ensure we have a valid slug for storage paths
              const validSlug = normalizedSlug || slugify(gallery.slug || gallery.id || "gallery");
              if (!validSlug) {
                throw new Error("Invalid gallery slug. Please enter a valid slug.");
              }

              const galleryFolder = `galleries/${validSlug}`;
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
                          : "Failed to upload cover image. Please check the file size and try again."
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
                      // Distribute progress across all images
                      const baseProgress = 20;
                      const imageProgress = (progress / totalImages) * 0.6; // 20-80%
                      const currentImageProgress = (index / totalImages) * 0.6;
                      setImagesProgress(
                        baseProgress + currentImageProgress + imageProgress
                      );
                    })
                      .then((url) => {
                        uploadedImageUrls.push(url);
                        // Update progress when each image completes
                        const completed = uploadedImageUrls.length;
                        setImagesProgress(20 + (completed / totalImages) * 80);
                      })
                      .catch((error) => {
                        console.error(`Image ${index + 1} upload error:`, error);
                        throw new Error(
                          error instanceof Error
                            ? error.message
                            : `Failed to upload image ${
                                index + 1
                              }. Please check the file size and try again.`
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
                          : "Failed to upload video. Please check the file size and try again."
                      );
                    })
                );
              } else {
                setVideoProgress(100);
              }

              // Wait for all uploads to complete in parallel
              await Promise.all(uploadPromises);

              // Now update gallery with URLs only (no files)
              const updateFormData = new FormData();
              updateFormData.set("id", gallery.id);
              updateFormData.set("slug", normalizedSlug);
              updateFormData.set(
                "title",
                formData.get("title")?.toString() ?? ""
              );
              updateFormData.set(
                "description",
                formData.get("description")?.toString() ?? ""
              );
              if (coverUrl) {
                updateFormData.set("coverImageUrl", coverUrl);
              }
              uploadedImageUrls.forEach((url) => {
                updateFormData.append("galleryImageUrls", url);
              });
              if (videoUrl) {
                updateFormData.set("videoUrl", videoUrl);
              }
              updateFormData.set(
                "existingImages",
                JSON.stringify(retainedImages)
              );
              updateFormData.set("existingCoverImage", existingCover);
              updateFormData.set("existingVideoUrl", existingVideo);
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

              // Check if response is JSON
              let result;
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                result = await response.json();
              } else {
                const text = await response.text();
                throw new Error(
                  text ||
                    `Server error: ${response.status} ${response.statusText}`
                );
              }

              if (!response.ok) {
                if (response.status === 409) {
                  setSlugError(
                    result.error ||
                      "That slug already exists. Please choose another."
                  );
                }
                // Check for Firebase Storage pattern errors
                const errorMessage = result.error || "Failed to update gallery";
                if (
                  errorMessage.includes("pattern") ||
                  errorMessage.includes("string did not match")
                ) {
                  throw new Error(
                    "Invalid gallery slug or path. Please ensure the slug contains only letters, numbers, and dashes."
                  );
                }
                throw new Error(errorMessage);
              }

              setCoverProgress(100);
              setImagesProgress(100);
              setVideoProgress(100);
              toast.success(result.message || "Gallery updated successfully!", {
                id: `gallery-update-${gallery.id}`,
                duration: 4000,
                position: "top-right",
              });

              setTimeout(() => {
                setCoverProgress(0);
                setImagesProgress(0);
                setVideoProgress(0);
              }, 800);

              setCoverFiles([]);
              setImageFiles([]);
              setVideoFiles([]);

              const updatedSlug = result.slug || normalizedSlug || gallery.slug;
              if (updatedSlug) {
                setSlugInput(updatedSlug);
              }

              if (updatedSlug && updatedSlug !== gallery.slug) {
                router.replace(`/admin/gallery/${updatedSlug}`);
              } else {
                router.refresh();
              }
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
              setIsSaving(false);
            }
          }}
        >
          <input type="hidden" name="id" value={gallery.id} />

          <div className="space-y-6 w-full max-w-full">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full"></span>
                Basic Information
              </h3>
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <div className="space-y-2 min-w-0">
                  <Label className="text-sm font-semibold text-foreground">
                    Gallery Slug
                  </Label>
                  <Input
                    name="slug"
                    value={slugInput}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    onBlur={(e) => handleSlugChange(slugify(e.target.value))}
                    className="bg-background border-border focus:border-accent focus:ring-accent/20 transition-all w-full"
                    placeholder="gallery-slug"
                    required
                    pattern={SLUG_INPUT_PATTERN}
                  />
                  <p className="text-xs text-muted">
                    URL-friendly identifier for this gallery
                  </p>
                  {slugError ? (
                    <p className="text-xs text-destructive">{slugError}</p>
                  ) : null}
                </div>
                <div className="space-y-2 min-w-0">
                  <Label className="text-sm font-semibold text-foreground">
                    Gallery Title
                  </Label>
                  <Input
                    name="title"
                    defaultValue={gallery.title}
                    className="bg-background border-border focus:border-accent focus:ring-accent/20 transition-all w-full"
                    placeholder="Enter gallery title"
                  />
                  <p className="text-xs text-muted">
                    Display name for this gallery
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label className="text-sm font-semibold text-foreground">
                Description
              </Label>
              <Textarea
                name="description"
                rows={4}
                defaultValue={gallery.description}
                className="bg-background border-border focus:border-accent focus:ring-accent/20 transition-all resize-none w-full"
                placeholder="Write a beautiful description for this gallery..."
              />
              <p className="text-xs text-muted">
                Share the story behind this collection
              </p>
            </div>
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

          <div className="space-y-6 sm:space-y-8 w-full max-w-full">
            <div className="w-full">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full"></span>
                Cover Image
              </h3>
              <MediaDropzone
                name="coverImage"
                label="Gallery Thumbnail"
                description="This image will represent your gallery in listings and previews."
                accept={{ "image/*": [] }}
                progress={coverProgress}
                onFilesChange={setCoverFiles}
                existingFiles={
                  existingCover
                    ? [appendCacheBuster(existingCover, gallery.updatedAt)]
                    : undefined
                }
                onRemoveExisting={() => setExistingCover("")}
                onExistingFileCrop={async (croppedFile) => {
                  try {
                    toast.loading("Uploading cropped image...", {
                      id: "crop-upload",
                    });
                    setCoverProgress(10);

                    // Ensure we have a valid slug for the storage path
                    const validSlug = slugify(
                      gallery.slug || gallery.id || "gallery"
                    );
                    if (!validSlug) {
                      throw new Error(
                        "Invalid gallery slug. Please save the gallery with a valid slug first."
                      );
                    }

                    // Upload the cropped file to Firebase Storage
                    const ext =
                      croppedFile.name.match(/\.[^/.]+$/)?.at(0) || ".webp";
                    const storagePath = `galleries/${validSlug}/cover${ext}`;

                    const croppedUrl = await uploadFileToStorageClient(
                      croppedFile,
                      storagePath,
                      (progress) => {
                        setCoverProgress(10 + progress * 0.9); // 10-100%
                      }
                    );

                    // Update the existing cover URL (this will update the preview)
                    setExistingCover(croppedUrl);
                    setCoverProgress(100);

                    toast.success("Cover image updated successfully!", {
                      id: "crop-upload",
                      duration: 3000,
                    });

                    setTimeout(() => {
                      setCoverProgress(0);
                    }, 800);
                  } catch (error) {
                    console.error("Error uploading cropped image:", error);
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to upload cropped image",
                      { id: "crop-upload", duration: 4000 }
                    );
                    setCoverProgress(0);
                  }
                }}
                onExistingFilePreviewUpdate={() => {
                  // Preview is already updated in MediaDropzone component
                  // This callback is optional and can be used for additional logic if needed
                }}
                disabled={isSaving}
              />
            </div>

            <div className="w-full">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full"></span>
                Gallery Images
              </h3>
              <div className="space-y-6 w-full">
                <MediaDropzone
                  name="galleryImages"
                  label="Add New Images"
                  description="Upload additional photos to this gallery. Multiple images can be selected at once."
                  accept={{ "image/*": [] }}
                  multiple
                  progress={imagesProgress}
                  onFilesChange={setImageFiles}
                  disabled={isSaving}
                />

                {retainedImages.length > 0 && (
                  <div className="space-y-3 w-full">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">
                        Current Gallery Images
                      </Label>
                      <span className="text-xs text-muted bg-accent/10 px-3 py-1 rounded-full">
                        {retainedImages.length}{" "}
                        {retainedImages.length === 1 ? "image" : "images"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
                      {retainedImages.map((imageUrl, index) => (
                        <div
                          key={imageUrl}
                          className="group relative aspect-square rounded-xl overflow-hidden border-2 border-border hover:border-accent transition-all duration-300 shadow-subtle hover:shadow-soft"
                        >
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={`Gallery image ${index + 1}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-linear-to-b from-primary/80 via-primary/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-4 right-4 h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 bg-black/50 hover:bg-black/70 cursor-pointer"
                            onClick={() => handleImageDelete(imageUrl)}
                          >
                            <X className="h-4 w-4 text-white" />
                          </Button>
                          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="text-xs text-white font-medium bg-primary/80 px-2 py-1 rounded-md">
                              Image {index + 1}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full">
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full"></span>
                Highlight Video
              </h3>
              <MediaDropzone
                name="galleryVideo"
                label="Gallery Video"
                description="Optional: Add a highlight video to showcase this gallery in motion."
                accept={{ "video/*": [] }}
                progress={videoProgress}
                onFilesChange={setVideoFiles}
                existingFiles={existingVideo ? [existingVideo] : undefined}
                onRemoveExisting={() => setExistingVideo("")}
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="pt-4 sm:pt-6 border-t border-border w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 p-4 rounded-lg bg-accent/5 border border-accent/20 w-full sm:w-auto">
                <Checkbox
                  name="isFeatured"
                  defaultChecked={gallery.isFeatured}
                  disabled={isSaving}
                  className="border-accent data-[state=checked]:bg-accent data-[state=checked]:border-accent mt-0.5 sm:mt-0"
                />
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-semibold text-foreground cursor-pointer">
                    Feature on Home Page
                  </Label>
                  <p className="text-xs text-muted mt-0.5">
                    Display this gallery prominently on the homepage
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="bg-brand-primary text-brand-contrast cursor-pointer transition-all shadow-subtle hover:shadow-soft px-6 sm:px-8 py-5 sm:py-6 text-base font-semibold w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormShell } from "../components/form-shell";
import toast from "react-hot-toast";
import { MediaDropzone } from "../components/media-dropzone";
import { slugify, SLUG_INPUT_PATTERN } from "@/utils/slug";
import { getApiUrl } from "@/utils/api-url";
import { uploadFileToStorageClient } from "@/utils/firebase/client-upload";

interface GalleryCreateResponse {
  success?: boolean;
  message?: string;
  slug?: string;
  error?: string;
}

export function GalleryCreateForm() {
  const [isCreating, setIsCreating] = useState(false);
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [coverProgress, setCoverProgress] = useState(0);
  const [imagesProgress, setImagesProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [slugInput, setSlugInput] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  // Use a counter instead of Date.now() to avoid hydration mismatches
  const [formKey, setFormKey] = useState(0);

  const handleSlugChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    setSlugInput(cleaned);
    setSlugError(null);
  };

  return (
    <FormShell
      title="Galleries"
      description="Add a new gallery to the portfolio."
      footer={
        <Button
          type="submit"
          form="gallery-create-form"
          disabled={isCreating}
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
        >
          {isCreating ? "Creating..." : "Create gallery"}
        </Button>
      }
    >
      <form
        id="gallery-create-form"
        className="grid gap-6 md:grid-cols-2"
        key={formKey}
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setIsCreating(true);
            setCoverProgress(10);
            setImagesProgress(10);
            setVideoProgress(10);
            toast.loading("Creating gallery...", { id: "gallery-create" });

            const form = e.currentTarget;
            const formData = new FormData(form);
            const normalizedSlug = slugify(slugInput);

            if (!normalizedSlug) {
              setSlugError(
                "Please enter a slug using letters, numbers, or dashes."
              );
              throw new Error("Slug is required.");
            }

            formData.set("slug", normalizedSlug);
            setSlugError(null);

            // Upload files first to avoid Vercel payload size limits
            let coverUrl: string | null = null;
            const uploadedImageUrls: string[] = [];
            let videoUrl = "";

            const galleryFolder = `galleries/${normalizedSlug}`;

            // Upload cover image directly to Firebase Storage
            if (coverFiles.length > 0 && coverFiles[0]) {
              setCoverProgress(20);
              const coverFile = coverFiles[0];
              const ext = coverFile.name.match(/\.[^/.]+$/)?.at(0) || ".jpg";
              const storagePath = `${galleryFolder}/cover${ext}`;

              try {
                coverUrl = await uploadFileToStorageClient(
                  coverFile,
                  storagePath
                );
                setCoverProgress(60);
              } catch (error) {
                console.error("Cover image upload error:", error);
                throw new Error(
                  error instanceof Error
                    ? error.message
                    : "Failed to upload cover image. Please check the file size and try again."
                );
              }
            }

            // Upload gallery images directly to Firebase Storage in parallel
            if (imageFiles.length > 0) {
              setImagesProgress(20);
              const imageUploadPromises = imageFiles.map(
                async (file, index) => {
                  const ext = file.name.match(/\.[^/.]+$/)?.at(0) || ".jpg";
                  const storagePath = `${galleryFolder}/images/${Date.now()}-${index}${ext}`;

                  try {
                    return await uploadFileToStorageClient(file, storagePath);
                  } catch (error) {
                    console.error(`Image ${index + 1} upload error:`, error);
                    throw new Error(
                      error instanceof Error
                        ? error.message
                        : `Failed to upload image ${
                            index + 1
                          }. Please check the file size and try again.`
                    );
                  }
                }
              );

              const urls = await Promise.all(imageUploadPromises);
              uploadedImageUrls.push(...urls);
              setImagesProgress(100);
            }

            // Upload video directly to Firebase Storage
            if (videoFiles.length > 0 && videoFiles[0]) {
              setVideoProgress(20);
              const videoFile = videoFiles[0];
              const ext = videoFile.name.match(/\.[^/.]+$/)?.at(0) || ".mp4";
              const storagePath = `${galleryFolder}/video${ext}`;

              try {
                videoUrl = await uploadFileToStorageClient(
                  videoFile,
                  storagePath
                );
                setVideoProgress(100);
              } catch (error) {
                console.error("Video upload error:", error);
                throw new Error(
                  error instanceof Error
                    ? error.message
                    : "Failed to upload video. Please check the file size and try again."
                );
              }
            }

            setCoverProgress(coverUrl ? 100 : 0);

            // Now create gallery with URLs only (no files)
            const galleryFormData = new FormData();
            galleryFormData.set("slug", normalizedSlug);
            galleryFormData.set(
              "title",
              formData.get("title")?.toString() ?? ""
            );
            galleryFormData.set(
              "description",
              formData.get("description")?.toString() ?? ""
            );
            if (coverUrl) {
              galleryFormData.set("coverImageUrl", coverUrl);
            }
            uploadedImageUrls.forEach((url) => {
              galleryFormData.append("galleryImageUrls", url);
            });
            if (videoUrl) {
              galleryFormData.set("videoUrl", videoUrl);
            }
            if (formData.get("isFeatured") === "on") {
              galleryFormData.set("isFeatured", "on");
            }

            const response = await fetch(getApiUrl("api/galleries"), {
              method: "POST",
              body: galleryFormData,
            });

            // Check content-type before parsing JSON
            const contentType = response.headers.get("content-type");
            let result: GalleryCreateResponse;

            if (contentType?.includes("application/json")) {
              try {
                result = (await response.json()) as GalleryCreateResponse;
              } catch (jsonError) {
                // If JSON parsing fails, read as text for better error message
                const text = await response.text();
                console.error(
                  "Failed to parse JSON response:",
                  text,
                  jsonError
                );
                throw new Error(
                  response.status >= 500
                    ? "Server error occurred. Please try again later."
                    : "Failed to create gallery. Please check your input and try again."
                );
              }
            } else {
              // Non-JSON response (likely HTML error page)
              const text = await response.text();
              console.error(
                "Non-JSON response received:",
                text.substring(0, 200)
              );
              throw new Error(
                response.status >= 500
                  ? "Server error occurred. Please try again later."
                  : "Failed to create gallery. Please check your input and try again."
              );
            }

            if (!response.ok) {
              if (response.status === 409) {
                setSlugError(
                  result?.error ||
                    "That slug already exists. Please choose another."
                );
              }
              throw new Error(result?.error || "Failed to create gallery");
            }

            setCoverProgress(100);
            setImagesProgress(100);
            setVideoProgress(100);
            toast.success(result.message || "Gallery created successfully!", {
              id: "gallery-create",
              duration: 4000,
            });

            setTimeout(() => {
              setCoverProgress(0);
              setImagesProgress(0);
              setVideoProgress(0);
            }, 800);

            form.reset();
            setCoverFiles([]);
            setImageFiles([]);
            setVideoFiles([]);
            setSlugInput("");
            setSlugError(null);
            setFormKey((prev) => prev + 1);
          } catch (error) {
            console.error("Gallery create error:", error);
            toast.error(
              (error as Error).message || "Failed to create gallery",
              { id: "gallery-create", duration: 4000 }
            );
            setCoverProgress(0);
            setImagesProgress(0);
            setVideoProgress(0);
          } finally {
            setIsCreating(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            placeholder="emma-mikko"
            className="bg-brand-background text-brand-text"
            value={slugInput}
            onChange={(e) => handleSlugChange(e.target.value)}
            onBlur={(e) => handleSlugChange(slugify(e.target.value))}
            pattern={SLUG_INPUT_PATTERN}
            required
          />
          <p className="text-xs text-brand-muted">
            Use lowercase letters, numbers, and dashes. Example: emma-mikko
          </p>
          {slugError ? (
            <p className="text-xs text-destructive">{slugError}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Emma & Mikko"
            className="bg-brand-background text-brand-text"
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={3}
            className="bg-brand-background text-brand-text"
            placeholder="Describe the story..."
          />
        </div>
        <input type="hidden" name="existingImages" value="[]" />
        <input type="hidden" name="existingCoverImage" value="" />
        <input type="hidden" name="existingVideoUrl" value="" />
        <MediaDropzone
          name="coverImage"
          label="Cover image"
          description="Upload the gallery cover image."
          accept={{ "image/*": [] }}
          progress={coverProgress}
          onFilesChange={setCoverFiles}
        />
        <MediaDropzone
          name="galleryImages"
          label="Gallery images"
          description="Upload multiple gallery images."
          accept={{ "image/*": [] }}
          multiple
          progress={imagesProgress}
          onFilesChange={setImageFiles}
        />
        <MediaDropzone
          name="galleryVideo"
          label="Highlight video"
          description="Upload an optional highlight video."
          accept={{ "video/*": [] }}
          progress={videoProgress}
          onFilesChange={setVideoFiles}
        />
        <div className="flex items-center gap-2">
          <Checkbox id="isFeatured" name="isFeatured" />
          <Label htmlFor="isFeatured" className="text-sm text-brand-text">
            Feature on home page
          </Label>
        </div>
      </form>
    </FormShell>
  );
}

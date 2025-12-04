"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormShell } from "../components/form-shell";
import { MediaDropzone } from "../components/media-dropzone";
import toast from "react-hot-toast";
import type { EventType } from "@/utils/types";
import { getApiUrl } from "@/utils/api-url";
import { uploadFileToStorageClient } from "@/utils/firebase/client-upload";

const EVENT_TYPES: EventType[] = [
  "Wedding",
  "Birthday",
  "Baby Showers",
  "Elopement",
  "Birthdays",
  "Ceremonies",
  "Anniversaries",
  "Engagements",
  "Graduation",
  "Other",
];

const MAX_FAVORITES = 6;

interface PhotoUploadFormProps {
  favoriteCount: number;
}

export function PhotoUploadForm({ favoriteCount }: PhotoUploadFormProps) {
  const router = useRouter();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dropzoneKey, setDropzoneKey] = useState(0);

  const canAddFavorite = favoriteCount < MAX_FAVORITES;

  return (
    <FormShell
      title="Photos"
      description="Upload spotlight photos for the gallery."
      footer={
        <Button
          type="submit"
          form="photo-upload-form"
          disabled={isUploading}
          className="ml-auto bg-brand-primary text-brand-contrast cursor-pointer"
        >
          {isUploading ? "Uploading..." : "Upload photo"}
        </Button>
      }
    >
      <form
        id="photo-upload-form"
        className="grid gap-6 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setIsUploading(true);
            toast.loading("Uploading photo...", { id: "photo-upload" });

            const form = e.currentTarget;
            const formData = new FormData(form);

            // Check if image file is selected
            const imageFile = imageFiles[0];
            if (!imageFile || imageFile.size === 0) {
              throw new Error("Image file is required.");
            }

            // Upload image directly to Firebase Storage to avoid Vercel payload size limits
            const ext = imageFile.name.match(/\.[^/.]+$/)?.at(0) || ".jpg";
            const storagePath = `photos/${Date.now()}${ext}`;

            let imageUrl: string;
            try {
              imageUrl = await uploadFileToStorageClient(
                imageFile,
                storagePath
              );
            } catch (error) {
              console.error("Image upload error:", error);
              throw new Error(
                error instanceof Error
                  ? error.message
                  : "Failed to upload image. Please check the file size and try again."
              );
            }

            // Now create photo with URL only (no file)
            const photoFormData = new FormData();
            photoFormData.set("title", formData.get("title")?.toString() ?? "");
            photoFormData.set(
              "eventType",
              formData.get("eventType")?.toString() ?? "Other"
            );
            if (formData.get("isFavorite") === "on") {
              photoFormData.set("isFavorite", "on");
            }
            photoFormData.set("imageUrl", imageUrl);

            const response = await fetch(getApiUrl("api/photos"), {
              method: "POST",
              body: photoFormData,
            });

            // Check content-type before parsing JSON
            const contentType = response.headers.get("content-type");
            let result;

            if (contentType?.includes("application/json")) {
              try {
                result = await response.json();
              } catch (jsonError) {
                const text = await response.text();
                console.error(
                  "Failed to parse JSON response:",
                  text,
                  jsonError
                );
                throw new Error(
                  response.status >= 500
                    ? "Server error occurred. Please try again later."
                    : "Failed to upload photo. Please check your input and try again."
                );
              }
            } else {
              const text = await response.text();
              console.error(
                "Non-JSON response received:",
                text.substring(0, 200)
              );
              throw new Error(
                response.status >= 500
                  ? "Server error occurred. Please try again later."
                  : "Failed to upload photo. Please check your input and try again."
              );
            }

            if (!response.ok) {
              throw new Error(result.error || "Failed to upload photo");
            }

            toast.success(result.message || "Photo uploaded successfully!", {
              id: "photo-upload",
              duration: 4000,
            });

            form.reset();
            setImageFiles([]);
            // Reset MediaDropzone by changing key
            setDropzoneKey((prev) => prev + 1);
            // Refresh server data to show new photo in grid
            router.refresh();
          } catch (error) {
            console.error("Photo upload error:", error);
            toast.error((error as Error).message || "Failed to upload photo", {
              id: "photo-upload",
              duration: 4000,
            });
          } finally {
            setIsUploading(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Sunset embrace"
            className="bg-brand-background text-brand-text"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Event type</Label>
          <Select defaultValue="Wedding" name="eventType">
            <SelectTrigger className="bg-brand-background text-brand-text">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent className="bg-brand-background text-brand-text">
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <MediaDropzone
            key={dropzoneKey}
            name="image"
            label="Upload file"
            description="Drag and drop an image file here, or click Browse to select a file."
            accept={{ "image/*": [] }}
            onFilesChange={setImageFiles}
            disabled={isUploading}
          />
        </div>
        {canAddFavorite && (
          <div className="flex items-center gap-2">
            <Checkbox id="isFavorite" name="isFavorite" />
            <Label htmlFor="isFavorite">Mark as favorite (max 6)</Label>
          </div>
        )}
      </form>
    </FormShell>
  );
}

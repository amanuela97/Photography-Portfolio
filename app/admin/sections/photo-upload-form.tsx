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
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
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

            // Add the image file if selected
            const imageFile = imageFiles[0];
            if (imageFile && imageFile.size > 0) {
              formData.set("image", imageFile);
            } else {
              throw new Error("Image file is required.");
            }

            const response = await fetch(getApiUrl("api/photos"), {
              method: "POST",
              body: formData,
            });

            const result = await response.json();

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

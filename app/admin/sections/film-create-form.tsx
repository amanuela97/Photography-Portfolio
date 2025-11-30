"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormShell } from "../components/form-shell";
import { MediaDropzone } from "../components/media-dropzone";
import toast from "react-hot-toast";
import { getApiUrl } from "@/utils/api-url";
import { uploadFileToStorageClient } from "@/utils/firebase/client-upload";

export function FilmCreateForm() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [videoProgress, setVideoProgress] = useState(0);
  const [formKey, setFormKey] = useState(0);

  return (
    <FormShell
      title="Films"
      description="Showcase cinematic work."
      footer={
        <Button
          type="submit"
          form="film-create-form"
          disabled={isCreating}
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
        >
          {isCreating ? "Uploading..." : "Add film"}
        </Button>
      }
    >
      <form
        id="film-create-form"
        className="grid gap-6 md:grid-cols-2"
        key={formKey}
        encType="multipart/form-data"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setIsCreating(true);
            setVideoProgress(10);
            toast.loading("Uploading film...", { id: "film-create" });

            if (!videoFiles.length || !videoFiles[0]) {
              toast.error("Video file is required.", { id: "film-create" });
              setIsCreating(false);
              setVideoProgress(0);
              return;
            }

            const videoFile = videoFiles[0];
            const form = e.currentTarget;
            const formData = new FormData(form);

            // Upload video file directly to Firebase Storage to avoid Vercel payload size limits
            setVideoProgress(10);
            const ext = videoFile.name.match(/\.[^/.]+$/)?.at(0) || ".mp4";
            const storagePath = `films/${Date.now()}${ext}`;

            let videoUrl: string;
            try {
              videoUrl = await uploadFileToStorageClient(
                videoFile,
                storagePath,
                (progress) => {
                  setVideoProgress(10 + progress * 0.9); // 10-100%
                }
              );
            } catch (error) {
              console.error("Video upload error:", error);
              throw new Error(
                error instanceof Error
                  ? error.message
                  : "Failed to upload video. Please check the file size and try again."
              );
            }

            // Now create film with URL only (no file)
            const filmFormData = new FormData();
            filmFormData.set("title", formData.get("title")?.toString() ?? "");
            filmFormData.set("videoUrl", videoUrl);

            const response = await fetch(getApiUrl("api/films"), {
              method: "POST",
              body: filmFormData,
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || "Failed to create film");
            }

            setVideoProgress(100);

            toast.success(result.message || "Film uploaded successfully!", {
              id: "film-create",
              duration: 3000,
            });

            // Reset form
            form.reset();
            setVideoFiles([]);
            setVideoProgress(0);
            setFormKey((prev) => prev + 1);
            router.refresh();
          } catch (error) {
            console.error("Film create error:", error);
            toast.error((error as Error).message || "Failed to create film", {
              id: "film-create",
              duration: 4000,
            });
            setVideoProgress(0);
          } finally {
            setIsCreating(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="film-title">Title</Label>
          <Input
            id="film-title"
            name="title"
            placeholder="A Winter Vow"
            className="bg-brand-background text-brand-text"
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <MediaDropzone
            name="video"
            label="Video file"
            description="Upload a video file (MP4, WebM, OGG, MOV, AVI). Max 500MB."
            accept={{ "video/*": [] }}
            progress={videoProgress}
            onFilesChange={setVideoFiles}
            disabled={isCreating}
          />
        </div>
      </form>
    </FormShell>
  );
}

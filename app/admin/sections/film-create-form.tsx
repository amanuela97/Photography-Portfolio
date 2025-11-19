"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormShell } from "../components/form-shell";
import { MediaDropzone } from "../components/media-dropzone";
import toast from "react-hot-toast";

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

            const form = e.currentTarget;
            const formData = new FormData(form);

            // Add video file if present
            if (videoFiles.length > 0 && videoFiles[0]) {
              formData.set("video", videoFiles[0]);
            }

            if (!videoFiles.length || !videoFiles[0]) {
              toast.error("Video file is required.", { id: "film-create" });
              setIsCreating(false);
              setVideoProgress(0);
              return;
            }

            setVideoProgress(30);

            const response = await fetch("/api/films", {
              method: "POST",
              body: formData,
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

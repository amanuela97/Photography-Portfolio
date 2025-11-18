"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useActionState, useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FormShell } from "../components/form-shell";
import { createGalleryAction } from "../actions/galleries-actions";
import { initialActionState } from "../actions/action-state";
import toast from "react-hot-toast";
import { MediaDropzone } from "../components/media-dropzone";

export function GalleryCreateForm() {
  const [state, formAction] = useActionState(
    createGalleryAction,
    initialActionState()
  );
  const [pending, startTransition] = useTransition();
  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [coverProgress, setCoverProgress] = useState(0);
  const [imagesProgress, setImagesProgress] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [formKey, setFormKey] = useState(() => Date.now());

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Gallery created.");
      if (coverFiles.length) setCoverProgress(100);
      if (imageFiles.length) setImagesProgress(100);
      if (videoFiles.length) setVideoProgress(100);
      const timeout = setTimeout(() => {
        setCoverProgress(0);
        setImagesProgress(0);
        setVideoProgress(0);
      }, 800);
      const form = document.getElementById(
        "gallery-create-form"
      ) as HTMLFormElement | null;
      form?.reset();
      setCoverFiles([]);
      setImageFiles([]);
      setVideoFiles([]);
      setFormKey(Date.now());
      return () => clearTimeout(timeout);
    } else if (state.status === "error") {
      toast.error(state.message ?? "Unable to create gallery.");
      setCoverProgress(0);
      setImagesProgress(0);
      setVideoProgress(0);
    }
  }, [state, coverFiles.length, imageFiles.length, videoFiles.length]);

  useEffect(() => {
    if (coverFiles.length === 0) {
      setCoverProgress(0);
      return;
    }
    if (pending) {
      setCoverProgress((prev) => (prev < 60 ? 60 : prev));
    } else if (state.status === "success") {
      setCoverProgress(100);
    } else if (state.status === "error") {
      setCoverProgress(0);
    }
  }, [pending, state.status, coverFiles.length]);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setImagesProgress(0);
      return;
    }
    if (pending) {
      setImagesProgress((prev) => (prev < 60 ? 60 : prev));
    } else if (state.status === "success") {
      setImagesProgress(100);
    } else if (state.status === "error") {
      setImagesProgress(0);
    }
  }, [pending, state.status, imageFiles.length]);

  useEffect(() => {
    if (videoFiles.length === 0) {
      setVideoProgress(0);
      return;
    }
    if (pending) {
      setVideoProgress((prev) => (prev < 60 ? 60 : prev));
    } else if (state.status === "success") {
      setVideoProgress(100);
    } else if (state.status === "error") {
      setVideoProgress(0);
    }
  }, [pending, state.status, videoFiles.length]);

  return (
    <FormShell
      title="Galleries"
      description="Add a new gallery to the portfolio."
      footer={
        <Button
          type="submit"
          form="gallery-create-form"
          disabled={pending}
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
        >
          {pending ? "Creating..." : "Create gallery"}
        </Button>
      }
    >
      <form
        id="gallery-create-form"
        className="grid gap-6 md:grid-cols-2"
        action={(formData) => startTransition(() => formAction(formData))}
        key={formKey}
      >
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            placeholder="emma-mikko"
            className="bg-brand-background text-brand-text"
            required
          />
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

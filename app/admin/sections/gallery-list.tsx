"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useActionState, useEffect, useState } from "react";
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
import {
  deleteGalleryAction,
  updateGalleryAction,
} from "../actions/galleries-actions";
import { initialActionState } from "../actions/action-state";
import { MediaDropzone } from "../components/media-dropzone";

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
  const [updateState, updateAction] = useActionState(
    updateGalleryAction,
    initialActionState()
  );
  const [deleteState, deleteAction] = useActionState(
    deleteGalleryAction,
    initialActionState()
  );
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

  useEffect(() => {
    if (updateState.status === "success") {
      setPendingUpdate(false);
      toast.success("Gallery updated.");
      if (coverFiles.length) setCoverProgress(100);
      if (imageFiles.length) setImagesProgress(100);
      if (videoFiles.length) setVideoProgress(100);
      setTimeout(() => {
        setCoverProgress(0);
        setImagesProgress(0);
        setVideoProgress(0);
      }, 800);
      setCoverFiles([]);
      setImageFiles([]);
      setVideoFiles([]);
    } else if (updateState.status === "error") {
      setPendingUpdate(false);
      toast.error(updateState.message ?? "Update failed.");
      setCoverProgress(0);
      setImagesProgress(0);
      setVideoProgress(0);
    } else if (updateState.status === "idle") {
      setPendingUpdate(false);
    }
  }, [updateState, coverFiles.length, imageFiles.length, videoFiles.length]);

  useEffect(() => {
    if (deleteState.status === "success") {
      setPendingDelete(false);
      toast.success("Gallery deleted.");
    } else if (deleteState.status === "error") {
      setPendingDelete(false);
      toast.error(deleteState.message ?? "Delete failed.");
    } else if (deleteState.status === "idle") {
      setPendingDelete(false);
    }
  }, [deleteState]);

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
            ? new Date(gallery.updatedAt).toLocaleDateString()
            : "—"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4"
          action={async (formData) => {
            setPendingUpdate(true);
            await updateAction(formData);
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
            existingFiles={existingCover ? [existingCover] : undefined}
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
                className="bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
              >
                {pendingUpdate ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pendingDelete}
                onClick={async () => {
                  setPendingDelete(true);
                  const formData = new FormData();
                  formData.append("id", gallery.id);
                  await deleteAction(formData);
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

"use client";

import { useActionState, useEffect, useTransition } from "react";
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
import { createPhotoAction } from "../actions/photos-actions";
import { initialActionState } from "../actions/action-state";
import toast from "react-hot-toast";
import type { EventType } from "@/utils/types";

const EVENT_TYPES: EventType[] = [
  "Wedding",
  "Birthday",
  "Baby Showers",
  "Elopement",
  "Birthdays",
  "Ceremonies",
  "Anniversaries",
  "Other",
];

export function PhotoUploadForm() {
  const [state, formAction] = useActionState(
    createPhotoAction,
    initialActionState()
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Photo uploaded.");
      const form = document.getElementById(
        "photo-upload-form"
      ) as HTMLFormElement | null;
      form?.reset();
    } else if (state.status === "error") {
      toast.error(state.message ?? "Unable to upload photo.");
    }
  }, [state]);

  return (
    <FormShell
      title="Photos"
      description="Upload spotlight photos for the gallery."
      footer={
        <Button
          type="submit"
          form="photo-upload-form"
          disabled={pending}
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
        >
          {pending ? "Uploading..." : "Upload photo"}
        </Button>
      }
    >
      <form
        id="photo-upload-form"
        className="grid gap-6 md:grid-cols-2"
        action={(formData) => startTransition(() => formAction(formData))}
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
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="url">Image URL</Label>
          <Input
            id="url"
            name="url"
            placeholder="https://"
            className="bg-brand-background text-brand-text"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="image">Upload file</Label>
          <Input id="image" name="image" type="file" accept="image/*" />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="isFavorite" name="isFavorite" />
          <Label htmlFor="isFavorite">Mark as favorite (max 6)</Label>
        </div>
      </form>
    </FormShell>
  );
}

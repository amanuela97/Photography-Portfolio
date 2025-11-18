"use client";

import { useActionState, useEffect, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormShell } from "../components/form-shell";
import { createFilmAction } from "../actions/films-actions";
import { initialActionState } from "../actions/action-state";
import toast from "react-hot-toast";

export function FilmCreateForm() {
  const [state, formAction] = useActionState(
    createFilmAction,
    initialActionState()
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Film added.");
      const form = document.getElementById(
        "film-create-form"
      ) as HTMLFormElement | null;
      form?.reset();
    } else if (state.status === "error") {
      toast.error(state.message ?? "Unable to add film.");
    }
  }, [state]);

  return (
    <FormShell
      title="Films"
      description="Showcase cinematic work."
      footer={
        <Button
          type="submit"
          form="film-create-form"
          disabled={pending}
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
        >
          {pending ? "Saving..." : "Add film"}
        </Button>
      }
    >
      <form
        id="film-create-form"
        className="grid gap-6 md:grid-cols-2"
        action={(formData) => startTransition(() => formAction(formData))}
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
        <div className="space-y-2">
          <Label htmlFor="film-url">Video URL</Label>
          <Input
            id="film-url"
            name="url"
            placeholder="https://vimeo.com/..."
            className="bg-brand-background text-brand-text"
            required
          />
        </div>
      </form>
    </FormShell>
  );
}

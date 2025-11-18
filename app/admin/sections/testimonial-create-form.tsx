"use client";

import { useActionState, useEffect, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormShell } from "../components/form-shell";
import { createTestimonialAction } from "../actions/testimonials-actions";
import { initialActionState } from "../actions/action-state";
import toast from "react-hot-toast";

export function TestimonialCreateForm() {
  const [state, formAction] = useActionState(
    createTestimonialAction,
    initialActionState()
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Testimonial saved.");
      const form = document.getElementById(
        "testimonial-create-form"
      ) as HTMLFormElement | null;
      form?.reset();
    } else if (state.status === "error") {
      toast.error(state.message ?? "Unable to save testimonial.");
    }
  }, [state]);

  return (
    <FormShell
      title="Testimonials"
      description="Capture new client feedback."
      footer={
        <Button
          type="submit"
          form="testimonial-create-form"
          disabled={pending}
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
        >
          {pending ? "Saving..." : "Add testimonial"}
        </Button>
      }
    >
      <form
        id="testimonial-create-form"
        className="grid gap-6"
        action={(formData) => startTransition(() => formAction(formData))}
      >
        <div className="space-y-2">
          <Label htmlFor="quote">Quote</Label>
          <Textarea
            id="quote"
            name="quote"
            rows={3}
            className="bg-brand-background text-brand-text"
            placeholder="“Working with Jitendra was a dream...”"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            name="author"
            className="bg-brand-background text-brand-text"
            placeholder="Emma & Mikko"
            required
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="isApproved" name="isApproved" />
            <Label htmlFor="isApproved">Approved</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isFeatured" name="isFeatured" />
            <Label htmlFor="isFeatured">Feature on home page</Label>
          </div>
        </div>
      </form>
    </FormShell>
  );
}

"use client";

import { useActionState, useEffect, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { createTestimonialAction } from "../actions/testimonials-actions";
import { initialActionState } from "../actions/action-state";
import toast from "react-hot-toast";

interface TestimonialCreateFormProps {
  showTitle?: boolean;
}

export function TestimonialCreateForm({
  showTitle = false,
}: TestimonialCreateFormProps = {}) {
  const [state, formAction] = useActionState(
    createTestimonialAction,
    initialActionState()
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Thank you! Your testimonial has been submitted.");
      const form = document.getElementById(
        "testimonial-create-form"
      ) as HTMLFormElement | null;
      form?.reset();
    } else if (state.status === "error") {
      toast.error(state.message ?? "Unable to submit testimonial.");
    }
  }, [state]);

  return (
    <Card className="border border-brand-muted/40 bg-brand-surface shadow-soft">
      <CardContent className="pt-6">
        {showTitle && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-brand-primary mb-2">
              Leave a Testimonial
            </h2>
            <p className="text-sm text-brand-muted">
              Share your experience with us
            </p>
          </div>
        )}
        <form
          id="testimonial-create-form"
          className="grid gap-6"
          action={(formData) => startTransition(() => formAction(formData))}
        >
          <div className="space-y-2">
            <Label htmlFor="quote">Your Testimonial</Label>
            <Textarea
              id="quote"
              name="quote"
              rows={4}
              className="bg-brand-background text-brand-text"
              placeholder="“Working with Jitendra was a dream. The photos captured our special day perfectly...”"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Your Name</Label>
            <Input
              id="author"
              name="author"
              className="bg-brand-background text-brand-text"
              placeholder="Emma & Mikko"
              required
            />
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="testimonial-create-form"
          disabled={pending}
          className="ml-auto bg-brand-primary text-brand-contrast cursor-pointer"
        >
          {pending ? "Submitting..." : "Submit Testimonial"}
        </Button>
      </CardFooter>
    </Card>
  );
}

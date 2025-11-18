"use client";

import { useActionState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";
import type { TestimonialDocument } from "@/utils/types";
import {
  deleteTestimonialAction,
  updateTestimonialAction,
} from "../actions/testimonials-actions";
import { initialActionState } from "../actions/action-state";

interface TestimonialListProps {
  testimonials: TestimonialDocument[];
}

export function TestimonialList({ testimonials }: TestimonialListProps) {
  if (!testimonials.length) {
    return (
      <Card className="border border-brand-muted/40 bg-brand-surface shadow-soft">
        <CardContent className="py-6 text-brand-muted">
          No testimonials yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {testimonials.map((testimonial) => (
        <TestimonialCard key={testimonial.id} testimonial={testimonial} />
      ))}
    </div>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: TestimonialDocument;
}) {
  const [updateState, updateAction] = useActionState(
    updateTestimonialAction,
    initialActionState()
  );
  const [deleteState, deleteAction] = useActionState(
    deleteTestimonialAction,
    initialActionState()
  );
  const [pendingUpdate, startUpdate] = useTransition();
  const [pendingDelete, startDelete] = useTransition();

  useEffect(() => {
    if (updateState.status === "success") {
      toast.success("Testimonial updated.");
    } else if (updateState.status === "error") {
      toast.error(updateState.message ?? "Unable to update testimonial.");
    }
  }, [updateState]);

  useEffect(() => {
    if (deleteState.status === "success") {
      toast.success("Testimonial removed.");
    } else if (deleteState.status === "error") {
      toast.error(deleteState.message ?? "Unable to delete testimonial.");
    }
  }, [deleteState]);

  return (
    <Card className="border border-brand-muted/40 bg-brand-surface shadow-soft">
      <CardHeader>
        <CardTitle className="text-brand-primary">
          {testimonial.author}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={(formData) => startUpdate(() => updateAction(formData))}
        >
          <input type="hidden" name="id" value={testimonial.id} />
          <div className="space-y-2">
            <Label>Quote</Label>
            <Textarea
              name="quote"
              rows={3}
              defaultValue={testimonial.quote}
              className="bg-brand-background text-brand-text"
            />
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <Input
              name="author"
              defaultValue={testimonial.author}
              className="bg-brand-background text-brand-text"
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id={`approved-${testimonial.id}`}
                defaultChecked={testimonial.isApproved}
                onCheckedChange={(checked) => {
                  const formData = new FormData();
                  formData.append("id", testimonial.id);
                  formData.append("isApproved", checked ? "true" : "false");
                  formData.append(
                    "isFeatured",
                    testimonial.isFeatured ? "true" : "false"
                  );
                  formData.append("quote", testimonial.quote);
                  formData.append("author", testimonial.author);
                  startUpdate(() => updateAction(formData));
                }}
              />
              <Label htmlFor={`approved-${testimonial.id}`}>Approved</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`featured-${testimonial.id}`}
                defaultChecked={testimonial.isFeatured}
                onCheckedChange={(checked) => {
                  const formData = new FormData();
                  formData.append("id", testimonial.id);
                  formData.append("isFeatured", checked ? "true" : "false");
                  formData.append(
                    "isApproved",
                    testimonial.isApproved ? "true" : "false"
                  );
                  formData.append("quote", testimonial.quote);
                  formData.append("author", testimonial.author);
                  startUpdate(() => updateAction(formData));
                }}
              />
              <Label htmlFor={`featured-${testimonial.id}`}>Featured</Label>
            </div>
          </div>
          <CardFooter className="px-0">
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
              className="ml-auto"
              disabled={pendingDelete}
              onClick={() => {
                const formData = new FormData();
                formData.append("id", testimonial.id);
                startDelete(() => deleteAction(formData));
              }}
            >
              {pendingDelete ? "Deleting..." : "Delete"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

"use client";

import {
  useActionState,
  useEffect,
  useTransition,
  useState,
  useRef,
} from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { TestimonialDocument } from "@/utils/types";
import {
  deleteTestimonialAction,
  updateTestimonialAction,
} from "../actions/testimonials-actions";
import { initialActionState } from "../actions/action-state";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

interface TestimonialListProps {
  testimonials: TestimonialDocument[];
}

// Custom Switch with visible thumb
function VisibleSwitch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer data-[state=checked]:bg-brand-accent data-[state=unchecked]:bg-brand-muted/60 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent shadow-sm transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "bg-white pointer-events-none block h-5 w-5 rounded-full ring-0 transition-transform shadow-md data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5"
        )}
      />
    </SwitchPrimitive.Root>
  );
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
        <TestimonialCard
          key={`${testimonial.id}-${
            testimonial.updatedAt || testimonial.createdAt
          }`}
          testimonial={testimonial}
        />
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
  const [isApproved, setIsApproved] = useState(testimonial.isApproved);
  const [isFeatured, setIsFeatured] = useState(testimonial.isFeatured);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (updateState.status === "success") {
      toast.success("Testimonial saved successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } else if (updateState.status === "error") {
      toast.error(updateState.message ?? "Unable to update testimonial.", {
        duration: 4000,
        position: "top-right",
      });
      // Revert on error - component will remount with new key
    }
  }, [updateState]);

  useEffect(() => {
    if (deleteState.status === "success") {
      toast.success("Testimonial deleted successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } else if (deleteState.status === "error") {
      toast.error(deleteState.message ?? "Unable to delete testimonial.", {
        duration: 4000,
        position: "top-right",
      });
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
          ref={formRef}
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!formRef.current) return;

            const formData = new FormData(formRef.current);
            // Override with current state values
            formData.set("isApproved", isApproved ? "true" : "false");
            formData.set("isFeatured", isFeatured ? "true" : "false");

            startUpdate(() => updateAction(formData));
          }}
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
              <VisibleSwitch
                id={`approved-${testimonial.id}`}
                checked={isApproved}
                disabled={pendingUpdate}
                onCheckedChange={(checked) => {
                  setIsApproved(checked); // Only update local state, don't save
                }}
              />
              <Label
                htmlFor={`approved-${testimonial.id}`}
                className="font-medium text-brand-text"
              >
                Approved
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <VisibleSwitch
                id={`featured-${testimonial.id}`}
                checked={isFeatured}
                disabled={pendingUpdate}
                onCheckedChange={(checked) => {
                  setIsFeatured(checked); // Only update local state, don't save
                }}
              />
              <Label
                htmlFor={`featured-${testimonial.id}`}
                className="font-medium text-brand-text"
              >
                Featured
              </Label>
            </div>
          </div>
          <CardFooter className="px-0 flex items-center justify-start gap-4">
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
              onClick={() => {
                const formData = new FormData();
                formData.append("id", testimonial.id);
                startDelete(() => deleteAction(formData));
              }}
              className="flex items-center gap-2 bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
            >
              <Trash2 className="h-4 w-4" />
              {pendingDelete ? "Deleting..." : "Delete"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

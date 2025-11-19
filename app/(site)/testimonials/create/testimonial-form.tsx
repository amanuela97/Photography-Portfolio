"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTestimonialAction } from "@/app/admin/actions/testimonials-actions";
import { initialActionState } from "@/app/admin/actions/action-state";
import toast from "react-hot-toast";

export default function TestimonialForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createTestimonialAction,
    initialActionState()
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success("Thank you! Your testimonial has been submitted.", {
        duration: 3000,
        position: "top-right",
      });
      // Reset form
      const form = document.getElementById(
        "testimonial-form"
      ) as HTMLFormElement | null;
      form?.reset();
      // Redirect after a short delay to show the toast
      setTimeout(() => {
        router.push("/testimonials");
      }, 1500);
    } else if (state.status === "error") {
      toast.error(
        state.message ?? "Unable to submit testimonial. Please try again.",
        {
          duration: 3000,
          position: "top-right",
        }
      );
    }
  }, [state, router]);

  return (
    <div className="bg-white rounded-lg shadow-soft p-8 md:p-12">
      <h2 className="text-3xl font-serif text-charcoal mb-2 text-center">
        Write Your Testimonial
      </h2>
      <p className="text-warm-gray text-center mb-8">
        Your feedback helps Studio of G10 grow and serve you better
      </p>

      <form
        id="testimonial-form"
        action={(formData) => startTransition(() => formAction(formData))}
        className="space-y-6"
      >
        {/* Testimonial Text */}
        <div>
          <label
            htmlFor="quote"
            className="block text-sm font-medium text-charcoal mb-2"
          >
            Your Testimonial *
          </label>
          <textarea
            id="quote"
            name="quote"
            rows={6}
            required
            placeholder="Share your experience with Studio of G10..."
            className="w-full px-4 py-3 border border-warm-gray/30 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors resize-none"
          />
          <p className="text-xs text-warm-gray mt-1">
            Tell Studio of G10 about your photography experience
          </p>
        </div>

        {/* Author Name */}
        <div>
          <label
            htmlFor="author"
            className="block text-sm font-medium text-charcoal mb-2"
          >
            Your Name *
          </label>
          <input
            type="text"
            id="author"
            name="author"
            required
            placeholder="John Doe"
            className="w-full px-4 py-3 border border-warm-gray/30 rounded-md focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors"
          />
          <p className="text-xs text-warm-gray mt-1">
            How would you like to be credited?
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-charcoal text-ivory px-8 py-4 rounded-full font-medium hover:bg-charcoal/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Submitting..." : "Submit Testimonial"}
          </button>
        </div>
      </form>
    </div>
  );
}

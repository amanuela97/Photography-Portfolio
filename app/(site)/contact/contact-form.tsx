"use client";

import { useActionState, useEffect, useTransition } from "react";
import { sendContactEmailAction } from "./actions/contact-actions";
import { initialActionState } from "@/app/admin/actions/action-state";
import { useSiteProfile } from "@/app/(site)/components/site-profile-context";
import toast from "react-hot-toast";

export default function ContactForm() {
  const profile = useSiteProfile();
  const [state, formAction] = useActionState(
    sendContactEmailAction,
    initialActionState()
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(
        state.message ?? "Thank you! Your message has been sent successfully.",
        {
          duration: 4000,
          position: "top-right",
        }
      );
      // Reset form after success
      const form = document.getElementById(
        "contact-form"
      ) as HTMLFormElement | null;
      form?.reset();
    } else if (state.status === "error") {
      toast.error(
        state.message ??
          "Sorry, there was an error sending your message. Please try again.",
        {
          duration: 4000,
          position: "top-right",
        }
      );
    }
  }, [state]);

  // Get recipient email from profile, fallback to hardcoded email
  const recipientEmail = profile?.contact?.email || "gtengten1010@gmail.com";

  return (
    <form
      id="contact-form"
      action={(formData) => {
        // Add recipient email to form data
        formData.set("recipientEmail", recipientEmail);
        startTransition(() => formAction(formData));
      }}
      className="space-y-6"
    >
      <div>
        <label className="block text-ivory text-sm font-medium mb-2">
          Name <span className="text-gold">(required)</span>
        </label>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            required
            className="w-full px-4 py-3 bg-[#6B5D57] border border-[#8B7D77] rounded text-ivory placeholder:text-ivory/60 focus:outline-none focus:ring-2 focus:ring-gold transition-all duration-300"
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            required
            className="w-full px-4 py-3 bg-[#6B5D57] border border-[#8B7D77] rounded text-ivory placeholder:text-ivory/60 focus:outline-none focus:ring-2 focus:ring-gold transition-all duration-300"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-ivory text-sm font-medium mb-2"
        >
          Email <span className="text-gold">(required)</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="your.email@example.com"
          required
          className="w-full px-4 py-3 bg-[#6B5D57] border border-[#8B7D77] rounded text-ivory placeholder:text-ivory/60 focus:outline-none focus:ring-2 focus:ring-gold transition-all duration-300"
        />
      </div>

      <div>
        <label
          htmlFor="bookingDate"
          className="block text-ivory text-sm font-medium mb-2"
        >
          Date on which you would like to book my services
        </label>
        <input
          type="date"
          id="bookingDate"
          name="bookingDate"
          className="w-full px-4 py-3 bg-[#6B5D57] border border-[#8B7D77] rounded text-ivory focus:outline-none focus:ring-2 focus:ring-gold transition-all duration-300"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-ivory text-sm font-medium mb-2"
        >
          Message <span className="text-gold">(required)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Tell us about your event, special requests, or any questions you have..."
          required
          className="w-full px-4 py-3 bg-[#6B5D57] border border-[#8B7D77] rounded text-ivory placeholder:text-ivory/60 focus:outline-none focus:ring-2 focus:ring-gold transition-all duration-300 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full md:w-auto px-12 py-4 bg-[#D4A574] text-charcoal font-medium rounded-full hover:bg-[#EDE6E3] hover:text-charcoal transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

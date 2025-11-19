import { TestimonialCreateForm } from "@/app/admin/sections/testimonial-create-form";

export default function TestimonialCreatePage() {
  return (
    <main className="min-h-screen bg-brand-background py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-primary mb-4">
            Share Your Experience
          </h1>
          <p className="text-lg text-brand-text">
            We&apos;d love to hear about your experience working with Studio of
            G10. Your feedback helps me improve and continue to provide
            exceptional service.
          </p>
        </div>
        <TestimonialCreateForm showTitle={false} />
      </div>
    </main>
  );
}

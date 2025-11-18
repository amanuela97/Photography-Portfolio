import { getTestimonials } from "@/utils/data-access/testimonials";
import { TestimonialCreateForm } from "./testimonial-create-form";
import { TestimonialList } from "./testimonial-list";

export default async function TestimonialsManager() {
  const testimonials = await getTestimonials();
  return (
    <div className="space-y-8">
      <TestimonialCreateForm />
      <TestimonialList testimonials={testimonials} />
    </div>
  );
}


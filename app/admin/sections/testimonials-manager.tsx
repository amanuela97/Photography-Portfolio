import { getTestimonials } from "@/utils/data-access/testimonials";
import { TestimonialList } from "./testimonial-list";

export default async function TestimonialsManager() {
  const testimonials = await getTestimonials();
  return <TestimonialList testimonials={testimonials} />;
}

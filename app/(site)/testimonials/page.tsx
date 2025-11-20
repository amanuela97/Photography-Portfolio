import { getTestimonials } from "@/utils/data-access/testimonials";
import { TestimonialsContent } from "./testimonials-content";

export const revalidate = 3600;

export default async function TestimonialsPage() {
  let testimonials: Awaited<ReturnType<typeof getTestimonials>> = [];

  try {
    testimonials = await getTestimonials();
  } catch (error) {
    console.error("Error fetching testimonials in TestimonialsPage:", error);
    // Continue with empty array - page will show empty state
  }

  // Filter to only show approved testimonials
  const approvedTestimonials = testimonials.filter(
    (testimonial) => testimonial.isApproved
  );

  return <TestimonialsContent approvedTestimonials={approvedTestimonials} />;
}

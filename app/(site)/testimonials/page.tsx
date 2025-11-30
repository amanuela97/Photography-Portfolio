import { getTestimonials } from "@/utils/data-access/testimonials";
import { getCoverPhoto } from "@/utils/data-access/photos";
import { TestimonialsContent } from "./testimonials-content";

export const revalidate = 3600;

export default async function TestimonialsPage() {
  let testimonials: Awaited<ReturnType<typeof getTestimonials>> = [];
  let coverPhoto: Awaited<ReturnType<typeof getCoverPhoto>> = null;

  try {
    [testimonials, coverPhoto] = await Promise.all([
      getTestimonials(),
      getCoverPhoto("TESTIMONIALS"),
    ]);
  } catch (error) {
    console.error("Error fetching testimonials in TestimonialsPage:", error);
    // Continue with empty array - page will show empty state
  }

  // Filter to only show approved testimonials
  const approvedTestimonials = testimonials.filter(
    (testimonial) => testimonial.isApproved
  );

  return (
    <TestimonialsContent
      approvedTestimonials={approvedTestimonials}
      coverImageUrl={coverPhoto?.url}
    />
  );
}

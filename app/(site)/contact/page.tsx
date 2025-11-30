import { getCoverPhoto } from "@/utils/data-access/photos";
import { ContactPageClient } from "./contact-page-client";

export const revalidate = 3600;

export default async function ContactPage() {
  let coverPhoto: Awaited<ReturnType<typeof getCoverPhoto>> = null;

  try {
    coverPhoto = await getCoverPhoto("CONTACT");
  } catch (error) {
    console.error("Error fetching cover photo in ContactPage:", error);
    // Continue with null - will use fallback image
  }

  return <ContactPageClient coverImageUrl={coverPhoto?.url} />;
}

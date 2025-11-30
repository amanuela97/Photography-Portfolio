import { getFilms } from "@/utils/data-access/films";
import { getCoverPhoto } from "@/utils/data-access/photos";
import { FilmsContent } from "./films-content";

export const revalidate = 3600;

export const metadata = {
  title: "Films | Studio of G10 Photography",
  description: "A collection of cinematic films captured by Studio of G10",
};

export default async function FilmsPage() {
  let initialFilms: Awaited<ReturnType<typeof getFilms>> = [];
  let coverPhoto: Awaited<ReturnType<typeof getCoverPhoto>> = null;

  try {
    [initialFilms, coverPhoto] = await Promise.all([
      getFilms(),
      getCoverPhoto("FILMS"),
    ]);
  } catch (error) {
    console.error("Error fetching films in FilmsPage:", error);
    // Continue with empty array - page will show empty state
  }

  return <FilmsContent initialFilms={initialFilms} coverImageUrl={coverPhoto?.url} />;
}

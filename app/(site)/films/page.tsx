import { getFilms } from "@/utils/data-access/films";
import { FilmsContent } from "./films-content";

export const revalidate = 3600;

export const metadata = {
  title: "Films | Studio of G10 Photography",
  description: "A collection of cinematic films captured by Studio of G10",
};

export default async function FilmsPage() {
  let initialFilms: Awaited<ReturnType<typeof getFilms>> = [];

  try {
    initialFilms = await getFilms();
  } catch (error) {
    console.error("Error fetching films in FilmsPage:", error);
    // Continue with empty array - page will show empty state
  }

  return <FilmsContent initialFilms={initialFilms} />;
}

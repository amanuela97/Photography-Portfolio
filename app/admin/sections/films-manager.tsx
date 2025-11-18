import { getFilms } from "@/utils/data-access/films";
import { FilmCreateForm } from "./film-create-form";
import { FilmList } from "./film-list";

export default async function FilmsManager() {
  const films = await getFilms();
  return (
    <div className="space-y-8">
      <FilmCreateForm />
      <FilmList films={films} />
    </div>
  );
}


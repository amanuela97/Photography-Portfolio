import { cookies } from "next/headers";
import ProfileManager from "./sections/profile-manager";
import AboutManager from "./sections/about-manager";
import GalleriesManager from "./sections/galleries-manager";
import PhotosManager from "./sections/photos-manager";
import TestimonialsManager from "./sections/testimonials-manager";
import FilmsManager from "./sections/films-manager";
import { LogoutButton } from "@/app/(site)/components/logout-button";
import { adminAuth } from "@/utils/firebase/admin";
import { AdminTabs } from "./components/admin-tabs";

export const dynamic = "force-dynamic";

const sections = [
  { value: "profile", label: "Profile", content: <ProfileManager /> },
  { value: "about", label: "About", content: <AboutManager /> },
  { value: "galleries", label: "Galleries", content: <GalleriesManager /> },
  { value: "photos", label: "Photos", content: <PhotosManager /> },
  {
    value: "testimonials",
    label: "Testimonials",
    content: <TestimonialsManager />,
  },
  { value: "films", label: "Films", content: <FilmsManager /> },
];

async function getUserEmail(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("firebaseSession")?.value;

    if (!sessionCookie) {
      return null;
    }

    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    );
    return decodedClaims.email ?? null;
  } catch (error) {
    console.error("Failed to get user email:", error);
    return null;
  }
}

export default async function AdminPage() {
  const userEmail = await getUserEmail();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 text-brand-text md:px-8">
      <header className="space-y-2 text-center">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            {userEmail && (
              <p className="text-sm text-brand-muted">
                Signed in as{" "}
                <span className="text-brand-primary font-medium">
                  {userEmail}
                </span>
              </p>
            )}
            <LogoutButton />
          </div>
        </div>
        <p className="text-4xl font-bold uppercase tracking-[0.3em] text-brand-text">
          Admin Workspace
        </p>
        <h1 className="text-small font-semibold text-brand-primary">
          Manage your photography portfolio in one place.
        </h1>
      </header>
      <AdminTabs sections={sections} defaultValue="profile" />
    </main>
  );
}

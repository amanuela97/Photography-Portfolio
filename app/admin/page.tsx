import { Suspense } from "react";
import { cookies } from "next/headers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileManager from "./sections/profile-manager";
import AboutManager from "./sections/about-manager";
import GalleriesManager from "./sections/galleries-manager";
import PhotosManager from "./sections/photos-manager";
import TestimonialsManager from "./sections/testimonials-manager";
import FilmsManager from "./sections/films-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton } from "@/app/(site)/components/logout-button";
import { adminAuth } from "@/utils/firebase/admin";

const sections = [
  { value: "profile", label: "Profile", component: <ProfileManager /> },
  { value: "about", label: "About", component: <AboutManager /> },
  { value: "galleries", label: "Galleries", component: <GalleriesManager /> },
  { value: "photos", label: "Photos", component: <PhotosManager /> },
  {
    value: "testimonials",
    label: "Testimonials",
    component: <TestimonialsManager />,
  },
  { value: "films", label: "Films", component: <FilmsManager /> },
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
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 bg-brand-surface p-2 shadow-soft">
          {sections.map((section) => (
            <TabsTrigger
              key={section.value}
              value={section.value}
              className="px-4 py-2 data-[state=active]:bg-brand-primary data-[state=active]:text-brand-contrast"
            >
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((section) => (
          <TabsContent
            key={section.value}
            value={section.value}
            className="space-y-6"
          >
            <Suspense fallback={<SectionSkeleton />}>
              {section.component}
            </Suspense>
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-1/3 bg-brand-muted/40" />
      <Skeleton className="h-64 rounded-2xl bg-brand-muted/20" />
    </div>
  );
}

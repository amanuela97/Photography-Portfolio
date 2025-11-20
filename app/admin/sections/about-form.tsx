"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { appendCacheBuster } from "@/utils/cache-buster";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormShell } from "../components/form-shell";
import toast from "react-hot-toast";
import type { AboutDocument, GearItem, ProcessStep } from "@/utils/types";
import { MediaDropzone } from "../components/media-dropzone";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";

interface AboutFormProps {
  about?: AboutDocument;
}

export function AboutForm({ about }: AboutFormProps) {
  const router = useRouter();
  const initialSteps = useMemo<ProcessStep[]>(
    () => about?.process.steps ?? [{ number: 1, title: "", description: "" }],
    [about]
  );
  const initialCamera = useMemo<GearItem[]>(
    () => about?.gear.camera ?? [{ name: "", type: "" }],
    [about]
  );
  const initialLenses = useMemo<GearItem[]>(
    () => about?.gear.lenses ?? [{ name: "", type: "" }],
    [about]
  );
  const initialSoftware = useMemo<GearItem[]>(
    () => about?.gear.software ?? [{ name: "", type: "" }],
    [about]
  );

  const [steps, setSteps] = useState<ProcessStep[]>(initialSteps);
  const [camera, setCamera] = useState<GearItem[]>(initialCamera);
  const [lenses, setLenses] = useState<GearItem[]>(initialLenses);
  const [software, setSoftware] = useState<GearItem[]>(initialSoftware);
  const [landscapeFiles, setLandscapeFiles] = useState<File[]>([]);
  const [currentLandscapeImage, setCurrentLandscapeImage] = useState(
    about?.hero.landscapeImage
      ? appendCacheBuster(about.hero.landscapeImage, about.updatedAt)
      : undefined
  );
  const [landscapeProgress, setLandscapeProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const initialized = useRef(false);

  // Controlled state for hero intro to prevent reset on remount
  const [heroIntro, setHeroIntro] = useState(about?.hero.intro ?? "");

  // Initialize heroIntro only once when about data first becomes available
  // This prevents overwriting user input during re-renders or form submission
  useEffect(() => {
    if (!initialized.current && about?.hero.intro !== undefined) {
      setHeroIntro(about.hero.intro);
      initialized.current = true;
    }
  }, [about?.hero.intro]);

  useEffect(() => {
    if (landscapeFiles.length === 0) {
      setLandscapeProgress(0);
    }
  }, [landscapeFiles.length]);

  const renderGearEditor = (
    label: string,
    values: GearItem[],
    setter: (next: GearItem[]) => void,
    hiddenName: string
  ) => {
    const typePlaceholder =
      hiddenName === "cameraGear"
        ? "Camera Body"
        : hiddenName === "lensGear"
        ? "Lens"
        : "Software";

    const namePlaceholder =
      hiddenName === "cameraGear"
        ? "Sony A7 IV"
        : hiddenName === "lensGear"
        ? "Canon EF 24-70mm f/2.8"
        : "Adobe Photoshop";

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>{label}</Label>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setter([...values, { name: "", type: "" }])}
            className="bg-brand-background text-brand-primary hover:bg-brand-accent/20"
          >
            Add item
          </Button>
        </div>
        <input type="hidden" name={hiddenName} value={JSON.stringify(values)} />
        <div className="space-y-4">
          {values.map((item, index) => (
            <div
              key={`${hiddenName}-${index}`}
              className="grid gap-4 md:grid-cols-2 rounded-xl border border-brand-muted/40 p-4 bg-brand-background/60"
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={item.name}
                  onChange={(event) =>
                    setter(
                      values.map((gear, idx) =>
                        idx === index
                          ? { ...gear, name: event.target.value }
                          : gear
                      )
                    )
                  }
                  className="bg-white text-brand-text"
                  placeholder={namePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input
                  value={item.type}
                  onChange={(event) =>
                    setter(
                      values.map((gear, idx) =>
                        idx === index
                          ? { ...gear, type: event.target.value }
                          : gear
                      )
                    )
                  }
                  className="bg-white text-brand-text"
                  placeholder={typePlaceholder}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setter(values.filter((_, idx) => idx !== index))}
                className="md:col-span-2 justify-self-start text-brand-primary"
                disabled={values.length === 1}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <FormShell
      title="About"
      description="Maintain the storytelling content across the About page."
      footer={
        <Button
          type="submit"
          form="about-form"
          disabled={isSaving}
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save content"}
        </Button>
      }
      contentClassName="space-y-12"
    >
      <form
        ref={formRef}
        id="about-form"
        className="space-y-10"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setIsSaving(true);
            setLandscapeProgress(10);
            toast.loading("Saving content...", { id: "about-save" });

            const form = e.currentTarget;
            const formData = new FormData(form);

            // Set controlled state values
            formData.set("heroIntro", heroIntro);
            formData.set("processSteps", JSON.stringify(steps));
            formData.set("cameraGear", JSON.stringify(camera));
            formData.set("lensGear", JSON.stringify(lenses));
            formData.set("softwareGear", JSON.stringify(software));

            // Add landscape file if present
            if (landscapeFiles.length > 0 && landscapeFiles[0]) {
              formData.set("landscapeFile", landscapeFiles[0]);
              setLandscapeProgress(30);
            } else if (about?.hero.landscapeImage) {
              // Use existing image URL if no new file
              formData.set("landscapeImageUrl", about.hero.landscapeImage);
            }

            setLandscapeProgress(50);
            const response = await fetch("/api/about", {
              method: "POST",
              body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
              throw new Error(result.error || "Failed to save content");
            }

            setLandscapeProgress(100);
            toast.success(
              result.message || "About content saved successfully!",
              {
                id: "about-save",
                duration: 4000,
              }
            );

            setTimeout(() => {
              setLandscapeFiles([]);
              setLandscapeProgress(0);
            }, 1000);
            if (result.landscapeImageUrl) {
              setCurrentLandscapeImage(
                appendCacheBuster(
                  result.landscapeImageUrl,
                  new Date().toISOString()
                )
              );
            }
            router.refresh();
          } catch (error) {
            console.error("About save error:", error);
            toast.error((error as Error).message || "Failed to save content", {
              id: "about-save",
              duration: 4000,
            });
            setLandscapeProgress(0);
          } finally {
            setIsSaving(false);
          }
        }}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="heroIntro">Hero Intro</Label>
            <Textarea
              id="heroIntro"
              name="heroIntro"
              rows={3}
              value={heroIntro}
              onChange={(e) => setHeroIntro(e.target.value)}
              className="bg-brand-background text-brand-text"
              placeholder="Studio of G10 – Portraits & Life Stories..."
            />
          </div>
          <div className="space-y-2">
            <MediaDropzone
              name="landscapeFile"
              label="landscape image"
              description="Upload a single landscape image for the hero section."
              accept={{ "image/*": [] }}
              progress={landscapeProgress}
              onFilesChange={setLandscapeFiles}
              existingFiles={
                currentLandscapeImage ? [currentLandscapeImage] : undefined
              }
              disabled={isSaving}
            />
            {landscapeProgress > 0 && (
              <div className="space-y-2 rounded-lg border border-brand-muted/40 bg-brand-surface/50 p-4">
                <div className="flex items-center gap-2">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
                  ) : landscapeProgress === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Upload className="h-4 w-4 text-brand-accent" />
                  )}
                  <span className="text-sm font-medium text-brand-text">
                    {isSaving
                      ? "Saving content..."
                      : landscapeProgress === 100
                      ? "Content saved successfully"
                      : "Preparing..."}
                  </span>
                </div>
                {landscapeProgress > 0 && landscapeProgress < 100 && (
                  <div className="space-y-1">
                    <Progress value={landscapeProgress} className="h-2" />
                    <p className="text-xs text-brand-muted">
                      {landscapeProgress}% complete
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="space-y-4">
          <Label className="text-lg font-semibold text-brand-primary">
            Story
          </Label>
          <div className="grid gap-6 md:grid-cols-2">
            <Textarea
              name="storyWhoIAm"
              rows={3}
              defaultValue={about?.story.whoIAm ?? ""}
              className="bg-brand-background text-brand-text"
              placeholder="Who I am..."
            />
            <Textarea
              name="storyInspiration"
              rows={3}
              defaultValue={about?.story.inspiration ?? ""}
              className="bg-brand-background text-brand-text"
              placeholder="Inspiration..."
            />
            <Textarea
              name="storyHowIStarted"
              rows={3}
              defaultValue={about?.story.howIStarted ?? ""}
              className="bg-brand-background text-brand-text"
              placeholder="How it started..."
            />
            <Textarea
              name="storyPhilosophy"
              rows={3}
              defaultValue={about?.story.philosophy ?? ""}
              className="bg-brand-background text-brand-text"
              placeholder="Philosophy..."
            />
          </div>
        </section>

        <section className="space-y-6">
          <Label className="text-lg font-semibold text-brand-primary">
            Process
          </Label>
          <div className="grid gap-6 md:grid-cols-2">
            <Textarea
              name="processIntro"
              rows={3}
              defaultValue={about?.process.intro ?? ""}
              className="bg-brand-background text-brand-text"
              placeholder="Process intro..."
            />
            <Textarea
              name="processExpect"
              rows={3}
              defaultValue={about?.process.whatToExpect ?? ""}
              className="bg-brand-background text-brand-text"
              placeholder="What clients can expect..."
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Steps</Label>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setSteps((prev) => [
                    ...prev,
                    { number: prev.length + 1, title: "", description: "" },
                  ])
                }
                className="bg-brand-background text-brand-primary hover:bg-brand-accent/20"
              >
                Add step
              </Button>
            </div>
            <input
              type="hidden"
              name="processSteps"
              value={JSON.stringify(steps)}
            />
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={`step-${index}`}
                  className="grid gap-4 rounded-xl border border-brand-muted/40 p-4 bg-brand-background/60"
                >
                  <div className="grid gap-4 md:grid-cols-[120px,1fr]">
                    <div className="space-y-2">
                      <Label>Number</Label>
                      <Input
                        type="number"
                        min={1}
                        value={step.number}
                        onChange={(event) =>
                          setSteps((prev) =>
                            prev.map((item, idx) =>
                              idx === index
                                ? {
                                    ...item,
                                    number: Number(event.target.value),
                                  }
                                : item
                            )
                          )
                        }
                        className="bg-white text-brand-text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={step.title}
                        onChange={(event) =>
                          setSteps((prev) =>
                            prev.map((item, idx) =>
                              idx === index
                                ? { ...item, title: event.target.value }
                                : item
                            )
                          )
                        }
                        className="bg-white text-brand-text"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      rows={3}
                      value={step.description}
                      onChange={(event) =>
                        setSteps((prev) =>
                          prev.map((item, idx) =>
                            idx === index
                              ? { ...item, description: event.target.value }
                              : item
                          )
                        )
                      }
                      className="bg-white text-brand-text"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setSteps((prev) => prev.filter((_, idx) => idx !== index))
                    }
                    disabled={steps.length === 1}
                    className="justify-self-start text-brand-primary"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <Label className="text-lg font-semibold text-brand-primary">
            Gear
          </Label>
          {renderGearEditor("Camera", camera, setCamera, "cameraGear")}
          {renderGearEditor("Lenses", lenses, setLenses, "lensGear")}
          {renderGearEditor("Software", software, setSoftware, "softwareGear")}
        </section>
      </form>
    </FormShell>
  );
}

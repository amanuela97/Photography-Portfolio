"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormShell } from "../components/form-shell";
import { saveAboutAction } from "../actions/about-actions";
import { initialActionState } from "../actions/action-state";
import toast from "react-hot-toast";
import type { AboutDocument, GearItem, ProcessStep } from "@/utils/types";
import { MediaDropzone } from "../components/media-dropzone";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";

interface AboutFormProps {
  about?: AboutDocument;
}

export function AboutForm({ about }: AboutFormProps) {
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
  const [landscapeProgress, setLandscapeProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [state, formAction] = useActionState(
    saveAboutAction,
    initialActionState<AboutDocument>()
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // Only show toasts for success/error, not for idle state
    if (state.status === "idle") {
      return;
    }

    if (state.status === "success") {
      toast.success(state.message ?? "About content saved successfully!", { 
        id: "firestore-save",
        duration: 4000,
      });
      setLandscapeProgress(100);
      setTimeout(() => {
        setLandscapeFiles([]);
        setLandscapeProgress(0);
      }, 1000);
    } else if (state.status === "error") {
      toast.error(state.message ?? "Failed to save content.", { 
        id: "firestore-save",
        duration: 4000,
      });
      setLandscapeProgress(0);
    }
  }, [state]);

  useEffect(() => {
    if (landscapeFiles.length === 0) {
      setLandscapeProgress(0);
      return;
    }
    if (pending) {
      setLandscapeProgress((prev) => (prev < 60 ? 60 : prev));
    } else if (state.status === "success") {
      setLandscapeProgress(100);
      const timeout = setTimeout(() => setLandscapeProgress(0), 800);
      return () => clearTimeout(timeout);
    } else if (state.status === "error") {
      setLandscapeProgress(0);
    }
  }, [pending, landscapeFiles.length, state.status]);

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
          disabled={pending}
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
        >
          {pending ? "Saving..." : "Save content"}
        </Button>
      }
      contentClassName="space-y-12"
    >
      <form
        id="about-form"
        className="space-y-10"
        action={async (formData) => {
          // Upload landscape file if present
          if (landscapeFiles.length > 0 && landscapeFiles[0]) {
            try {
              setIsUploading(true);
              setLandscapeProgress(5);
              toast.loading("Replacing existing image...", { id: "image-upload" });

              const uploadFormData = new FormData();
              uploadFormData.append("file", landscapeFiles[0]);
              uploadFormData.append("folder", "about/landscape");
              uploadFormData.append("replaceExisting", "true");

              setLandscapeProgress(20);
              const uploadResponse = await fetch("/api/upload", {
                method: "POST",
                body: uploadFormData,
              });

              if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                throw new Error(error.error || "Upload failed");
              }

              setLandscapeProgress(70);
              const { url } = await uploadResponse.json();
              formData.append("landscapeImageUrl", url);
              setLandscapeProgress(90);
              
              toast.success("Image uploaded successfully!", { id: "image-upload" });
              setIsUploading(false);
            } catch (error) {
              console.error("Upload error:", error);
              toast.error((error as Error).message || "Failed to upload image", { id: "image-upload" });
              setLandscapeProgress(0);
              setIsUploading(false);
              return;
            }
          } else if (about?.hero.landscapeImage) {
            // Use existing image if no new file
            formData.append("landscapeImageUrl", about.hero.landscapeImage);
          }

          // Show toast for Firestore submission
          toast.loading("Saving to database...", { id: "firestore-save" });
          setLandscapeProgress(95);
          startTransition(() => formAction(formData));
        }}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="heroIntro">Hero Intro</Label>
            <Textarea
              id="heroIntro"
              name="heroIntro"
              rows={3}
              defaultValue={about?.hero.intro ?? ""}
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
                about?.hero.landscapeImage
                  ? [about.hero.landscapeImage]
                  : undefined
              }
              disabled={isUploading || pending}
            />
            {(isUploading || landscapeProgress > 0) && (
              <div className="space-y-2 rounded-lg border border-brand-muted/40 bg-brand-surface/50 p-4">
                <div className="flex items-center gap-2">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
                  ) : landscapeProgress === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Upload className="h-4 w-4 text-brand-accent" />
                  )}
                  <span className="text-sm font-medium text-brand-text">
                    {isUploading
                      ? "Uploading image to storage..."
                      : landscapeProgress === 100
                        ? "Image uploaded successfully"
                        : pending
                          ? "Saving to database..."
                          : "Preparing upload..."}
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

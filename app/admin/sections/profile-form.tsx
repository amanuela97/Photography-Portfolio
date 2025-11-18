"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormShell } from "../components/form-shell";
import { saveProfileAction } from "../actions/profile-actions";
import { initialActionState } from "../actions/action-state";
import toast from "react-hot-toast";
import type { ProfileDocument, SocialLink, SocialType } from "@/utils/types";

const SOCIAL_OPTIONS: SocialType[] = ["Instagram", "Facebook", "Twitter"];

interface ProfileFormProps {
  profile?: ProfileDocument;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const initialSocials = useMemo<SocialLink[]>(() => {
    if (profile?.contact?.socials?.length) {
      return profile.contact.socials;
    }
    return [{ type: "Instagram", href: "" }];
  }, [profile]);

  const [socials, setSocials] = useState<SocialLink[]>(initialSocials);
  const [state, formAction] = useActionState(
    saveProfileAction,
    initialActionState<ProfileDocument>()
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Profile saved.");
    } else if (state.status === "error") {
      toast.error(state.message ?? "Unable to save profile.");
    }
  }, [state]);

  useEffect(() => {
    setSocials(initialSocials);
  }, [initialSocials]);

  const handleSocialChange = (
    index: number,
    field: keyof SocialLink,
    value: string
  ) => {
    setSocials((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddSocial = () => {
    setSocials((prev) => [...prev, { type: "Instagram", href: "" }]);
  };

  const handleRemoveSocial = (index: number) => {
    setSocials((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <FormShell
      title="Profile"
      description="Edit the hero information displayed across the site."
      footer={
        <Button
          type="submit"
          form="profile-form"
          disabled={pending}
          className="ml-auto bg-brand-primary text-brand-contrast hover:bg-brand-accent hover:text-brand-primary"
        >
          {pending ? "Saving..." : "Save changes"}
        </Button>
      }
    >
      <form
        id="profile-form"
        className="grid gap-6 md:grid-cols-2"
        action={(formData) => startTransition(() => formAction(formData))}
      >
        <input type="hidden" name="socials" value={JSON.stringify(socials)} />
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={profile?.name ?? ""}
            placeholder="Jitendra"
            className="bg-brand-background text-brand-text"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={profile?.title ?? ""}
            placeholder="Photographer & Founder"
            className="bg-brand-background text-brand-text"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            name="location"
            defaultValue={profile?.location ?? ""}
            placeholder="Finland"
            className="bg-brand-background text-brand-text"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={profile?.contact?.email ?? ""}
            placeholder="studio@example.com"
            className="bg-brand-background text-brand-text"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={profile?.contact?.phone ?? ""}
            placeholder="+977 ..."
            className="bg-brand-background text-brand-text"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={profile?.bio ?? ""}
            placeholder="Share your story..."
            className="bg-brand-background text-brand-text"
          />
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Social links</Label>
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddSocial}
              className="bg-brand-background text-brand-primary hover:bg-brand-accent/20"
            >
              Add link
            </Button>
          </div>
          <div className="grid gap-4">
            {socials.map((social, index) => (
              <div
                key={`${social.type}-${index}`}
                className="grid gap-4 md:grid-cols-[180px,1fr,auto] items-end rounded-xl border border-brand-muted/40 p-4 bg-brand-background/60"
              >
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    value={social.type}
                    onValueChange={(value) =>
                      handleSocialChange(index, "type", value)
                    }
                  >
                    <SelectTrigger className="bg-white text-brand-text">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://"
                    value={social.href}
                    onChange={(event) =>
                      handleSocialChange(index, "href", event.target.value)
                    }
                    className="bg-white text-brand-text"
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleRemoveSocial(index)}
                  disabled={socials.length === 1}
                  className="text-brand-primary"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </FormShell>
  );
}

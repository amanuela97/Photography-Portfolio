import type { Timestamp } from "firebase-admin/firestore";

export interface AdminUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

export type SocialType = "Facebook" | "Instagram" | "Twitter";

export interface SocialLink {
  type: SocialType;
  href: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  socials: SocialLink[];
}

export interface ProfileDocument {
  id?: string;
  name: string;
  title: string;
  location: string;
  bio: string;
  portraitImage?: string;
  contact: ContactInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface AboutDocument {
  hero: {
    intro: string;
    landscapeImage: string;
  };
  story: {
    whoIAm: string;
    inspiration: string;
    howIStarted: string;
    philosophy: string;
  };
  process: {
    intro: string;
    whatToExpect: string;
    steps: ProcessStep[];
  };
  gear: {
    camera: GearItem[];
    lenses: GearItem[];
    software: GearItem[];
  };
  updatedAt?: string;
}

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

export interface GearItem {
  name: string;
  type: string;
}

export type EventType =
  | "Wedding"
  | "Birthday"
  | "Baby Showers"
  | "Elopement"
  | "Birthdays"
  | "Ceremonies"
  | "Anniversaries"
  | "Engagements"
  | "Graduation"
  | "Other";

export interface GalleryDocument {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  images: string[];
  video?: string | null;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PhotoDocument {
  id: string;
  title: string;
  url: string;
  eventType: EventType;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TestimonialDocument {
  id: string;
  quote: string;
  author: string;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilmDocument {
  id: string;
  title: string;
  url: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TimestampLike =
  | Timestamp
  | { toDate: () => Date }
  | string
  | number
  | null
  | undefined;

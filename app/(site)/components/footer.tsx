"use client";

import Link from "next/link";
import { useSiteProfile } from "@/app/(site)/components/site-profile-context";
import { ScrollTextAnimation } from "./scroll-text-animation";

export function Footer() {
  const profile = useSiteProfile();

  if (!profile) {
    return null;
  }
  return (
    <footer className="bg-charcoal text-ivory py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand & Description */}
          <ScrollTextAnimation>
            <div>
              <h3 className="text-2xl font-serif mb-4">{profile.name}</h3>
              <p className="text-warm-gray leading-relaxed">{profile.title}</p>
            </div>
          </ScrollTextAnimation>

          {/* Contact Information */}
          <ScrollTextAnimation delay={0.1}>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gold">Contact</h4>
              <div className="space-y-3 text-warm-gray">
                <div>
                  <span className="block text-sm">Email</span>
                  <a
                    href={`mailto:${profile.contact.email}`}
                    className="hover:text-gold transition-colors duration-300"
                  >
                    {profile.contact.email}
                  </a>
                </div>
                <div>
                  <span className="block text-sm">Phone</span>
                  <a
                    href={`tel:${profile.contact.phone}`}
                    className="hover:text-gold transition-colors duration-300"
                  >
                    {profile.contact.phone}
                  </a>
                </div>
                <div>
                  <p className="font-semibold mb-2">Follow Us</p>
                  <div className="flex flex-col gap-3">
                    {profile.contact.socials &&
                    profile.contact.socials.length > 0 ? (
                      profile.contact.socials.map((social, index) => {
                        // Format URL based on social type
                        let url = social.href;
                        if (social.type === "Instagram") {
                          // Handle Instagram URLs - if it starts with @, convert to instagram.com format
                          if (url.startsWith("@")) {
                            url = `https://instagram.com/${url.replace("@", "")}`;
                          } else if (!url.startsWith("http")) {
                            url = `https://instagram.com/${url}`;
                          }
                        } else if (social.type === "Facebook") {
                          // Ensure Facebook URLs are complete
                          if (!url.startsWith("http")) {
                            url = `https://facebook.com/${url}`;
                          }
                        } else if (social.type === "Twitter") {
                          // Ensure Twitter URLs are complete
                          if (!url.startsWith("http")) {
                            url = `https://twitter.com/${url}`;
                          }
                        }

                        return (
                          <a
                            key={`${social.type}-${index}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 hover:text-gold transition-colors duration-300"
                          >
                            {social.type === "Instagram" && (
                              <svg
                                className="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              </svg>
                            )}
                            {social.type === "Facebook" && (
                              <svg
                                className="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                              </svg>
                            )}
                            {social.type === "Twitter" && (
                              <svg
                                className="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                              </svg>
                            )}
                            {social.type}
                          </a>
                        );
                      })
                    ) : (
                      <p className="text-warm-gray">No social links available</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollTextAnimation>

          {/* Quick Links */}
          <ScrollTextAnimation delay={0.2}>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gold">
                Quick Links
              </h4>
              <nav className="space-y-2">
                <Link
                  href="/about"
                  className="block text-warm-gray hover:text-gold transition-colors duration-300"
                >
                  About
                </Link>
                <Link
                  href="/galleries"
                  className="block text-warm-gray hover:text-gold transition-colors duration-300"
                >
                  Galleries
                </Link>
                <Link
                  href="/photos"
                  className="block text-warm-gray hover:text-gold transition-colors duration-300"
                >
                  Photos
                </Link>
                <Link
                  href="/films"
                  className="block text-warm-gray hover:text-gold transition-colors duration-300"
                >
                  Films
                </Link>
                <Link
                  href="/testimonials"
                  className="block text-warm-gray hover:text-gold transition-colors duration-300"
                >
                  Testimonials
                </Link>
                <Link
                  href="/contact"
                  className="block text-warm-gray hover:text-gold transition-colors duration-300"
                >
                  Contact
                </Link>
              </nav>
            </div>
          </ScrollTextAnimation>
        </div>

        {/* Copyright */}
        <ScrollTextAnimation delay={0.3}>
          <div className="mt-12 pt-8 border-t border-warm-gray/30 text-center text-warm-gray text-sm">
            <p>
              &copy; {new Date().getFullYear()} {profile.name}. All rights
              reserved.
            </p>
          </div>
        </ScrollTextAnimation>
      </div>
    </footer>
  );
}

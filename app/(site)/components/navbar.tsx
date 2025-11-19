"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isWorkDropdownOpen, setIsWorkDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    {
      label: "My Work",
      href: "#",
      hasDropdown: true,
      dropdownItems: [
        { label: "Galleries", href: "/galleries" },
        { label: "Photos", href: "/photos" },
        { label: "Videos", href: "/videos" },
      ],
    },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 mt-[10vh] bg-transparent">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-start">
          <Image
            src="/web-logo.png"
            alt="Studio of G10"
            width={300}
            height={250}
            priority
            className="h-[250px] w-[300px] object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-center gap-8 w-fit p-4">
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              {item.hasDropdown ? (
                <div
                  className="relative group"
                  onMouseEnter={() => setIsWorkDropdownOpen(true)}
                  onMouseLeave={() => setIsWorkDropdownOpen(false)}
                >
                  <button
                    className={`flex items-center gap-1 px-3 py-2 text-lg font-medium transition-colors hover:text-accent ${
                      pathname.startsWith("/galleries") ||
                      pathname.startsWith("/photos") ||
                      pathname.startsWith("/videos")
                        ? "text-white border-b-2 border-white"
                        : "text-white"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isWorkDropdownOpen && (
                    <div className="absolute top-full left-0 pt-2 w-36">
                      <div className="bg-charcoal/20 backdrop-blur-sm border border-white/10 rounded-lg shadow-soft overflow-hidden">
                        {item.dropdownItems?.map((dropdownItem) => (
                          <Link
                            key={dropdownItem.label}
                            href={dropdownItem.href}
                            className="block px-4 py-3 text-lg text-white hover:underline hover:underline-offset-4 transition-all"
                            onClick={() => setIsWorkDropdownOpen(false)}
                          >
                            {dropdownItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`px-3 py-2 text-lg font-medium transition-colors hover:text-accent ${
                    pathname === item.href
                      ? "text-white border-b-2 border-white"
                      : "text-white"
                  }`}
                  onClick={() => setIsWorkDropdownOpen(false)}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Hamburger for mobile */}
        <button
          type="button"
          aria-label="Open navigation menu"
          className="flex lg:hidden flex-col justify-center items-center gap-1.5 p-3"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          {[0, 1, 2].map((line) => (
            <span
              key={line}
              className="block h-0.5 w-8 bg-white rounded-full"
            />
          ))}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white text-brand-primary flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-muted/40">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Image
                src="/logo-last.png"
                alt="Studio of G10"
                width={180}
                height={120}
                className="h-[120px] w-[180px] object-contain"
              />
            </Link>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="p-3"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="h-8 w-8 text-black" />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-6 px-6 py-8 text-lg">
            {navItems.map((item) => (
              <div key={item.label} className="flex flex-col gap-3">
                {item.hasDropdown ? (
                  <>
                    <p className="font-semibold">{item.label}</p>
                    <div className="flex flex-col gap-2 pl-4 text-base text-brand-muted">
                      {item.dropdownItems?.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.label}
                          href={dropdownItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {dropdownItem.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="font-semibold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

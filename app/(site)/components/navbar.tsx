"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isWorkDropdownOpen, setIsWorkDropdownOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/web-logo-1.png"
            alt="Studio of G10"
            width={180}
            height={60}
            className="h-12 w-auto"
          />
        </Link>

        {/* Navigation Items */}
        <div className="flex items-center gap-8">
          {navItems.map((item) => (
            <div key={item.label} className="relative">
              {item.hasDropdown ? (
                <div
                  className="relative group"
                  onMouseEnter={() => setIsWorkDropdownOpen(true)}
                  onMouseLeave={() => setIsWorkDropdownOpen(false)}
                >
                  <button
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:text-accent ${
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
                            className="block px-4 py-3 text-sm text-white hover:underline hover:underline-offset-4 transition-all"
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
                  className={`px-3 py-2 text-sm font-medium transition-colors hover:text-accent ${
                    pathname === item.href
                      ? "text-white border-b-2 border-white"
                      : "text-white"
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

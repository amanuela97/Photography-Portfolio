"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  unoptimized?: boolean;
}

export function AnimatedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = "",
  priority = false,
  unoptimized = false,
}: AnimatedImageProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!imageRef.current) return;

    const element = imageRef.current;
    const imageElement = element.querySelector(
      "img"
    ) as HTMLImageElement | null;

    if (!imageElement) return;

    // Set initial state on the image element
    gsap.set(imageElement, {
      opacity: 0.3, // Start with some visibility so images are at least partially visible
      y: 20,
      filter: "blur(8px)",
    });

    // Wait for image to load before animating
    if (!isLoaded) {
      // If image hasn't loaded yet, set a timeout to show it anyway after a delay
      const timeout = setTimeout(() => {
        if (imageElement) {
          gsap.to(imageElement, {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power2.out",
          });
        }
      }, 2000); // Show image after 2 seconds even if onLoad didn't fire

      return () => clearTimeout(timeout);
    }

    // Check if element is already in view on mount
    const rect = element.getBoundingClientRect();
    const isInView = rect.top < window.innerHeight * 0.85;

    if (isInView) {
      // If already in view, animate immediately
      gsap.to(imageElement, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1,
        ease: "power2.out",
      });
    } else {
      // Otherwise, animate on scroll
      const animation = gsap.to(imageElement, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      return () => {
        animation.kill();
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.vars.trigger === element) {
            trigger.kill();
          }
        });
      };
    }
  }, [isLoaded]);

  const imageProps = fill
    ? {
        fill: true as const,
        sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
      }
    : {
        width: width || 800,
        height: height || 600,
      };

  return (
    <div
      ref={imageRef}
      className={fill ? `relative w-full h-full ${className}` : className}
    >
      <Image
        src={src}
        alt={alt}
        {...imageProps}
        className={fill ? "object-cover" : "w-full h-full object-cover"}
        priority={priority}
        unoptimized={unoptimized}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          console.error("Failed to load image:", src);
          setIsLoaded(true); // Still trigger animation even on error
        }}
      />
    </div>
  );
}

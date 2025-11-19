"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollTextAnimationProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ScrollTextAnimation({
  children,
  className = "",
  delay = 0,
}: ScrollTextAnimationProps) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;

    // Set initial state
    gsap.set(element, {
      opacity: 0,
      y: 30,
    });

    // Check if element is already in view on mount
    const rect = element.getBoundingClientRect();
    const isInView = rect.top < window.innerHeight * 0.85;

    if (isInView) {
      // If already in view, animate immediately
      gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay,
        ease: "power2.out",
      });
    } else {
      // Otherwise, animate on scroll
      const animation = gsap.to(element, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay,
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
  }, [delay]);

  return (
    <div ref={textRef} className={className}>
      {children}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function HomePageAnimations() {
  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const cleanupFns: Array<() => void> = [];

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-kicker, .hero-logo, .hero-subtitle, .hero-cta-row, .hero-scroll-indicator",
        { autoAlpha: 0, y: 30 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
        }
      );

      gsap.fromTo(
        ".hero-img",
        { scale: 1.08 },
        {
          scale: 1,
          duration: 1.8,
          ease: "power2.out",
        }
      );

      gsap.to(".hero-img", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          scrub: true,
          start: "top top",
          end: "bottom top",
        },
      });

      gsap.fromTo(
        ".elegance-item",
        { autoAlpha: 0, y: 45 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".elegance-section",
            start: "top 70%",
          },
        }
      );

      gsap.fromTo(
        ".popular-card",
        { autoAlpha: 0, y: 45 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".popular-picks-wrapper",
            start: "top 72%",
          },
        }
      );

      gsap.fromTo(
        ".flexible-area .content",
        { autoAlpha: 0, y: 25 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".flexible-area",
            start: "top 78%",
          },
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(".elegance-item");
      cards.forEach((card) => {
        const onMove = (event: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width - 0.5;
          const py = (event.clientY - rect.top) / rect.height - 0.5;
          gsap.to(card, {
            rotateY: px * 8,
            rotateX: py * -6,
            transformPerspective: 900,
            transformOrigin: "center",
            duration: 0.25,
            ease: "power2.out",
          });
        };
        const onLeave = () => {
          gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.4,
            ease: "power2.out",
          });
        };
        card.addEventListener("mousemove", onMove);
        card.addEventListener("mouseleave", onLeave);
        cleanupFns.push(() => {
          card.removeEventListener("mousemove", onMove);
          card.removeEventListener("mouseleave", onLeave);
        });
      });
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return null;
}

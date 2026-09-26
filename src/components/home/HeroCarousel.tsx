"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  { src: "/1.png", alt: "Velora featured fashion collection" },
  { src: "/2.png", alt: "Explore everyday styles from Velora" },
  { src: "/3.png", alt: "Discover the latest looks from Velora" },
];

export default function HeroCarousel() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="relative aspect-[8/3] max-h-[760px] w-full overflow-hidden bg-stone-200"
      aria-roledescription="carousel"
      aria-label="Featured Velora styles"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ${index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={index !== activeSlide}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      ))}

    </div>
  );
}

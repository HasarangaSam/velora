"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

type ProductGalleryProps = {
  productName: string;
  images: ProductImage[];
};

export default function ProductGallery({
  productName,
  images,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-stone-100 text-sm text-stone-400">
        No image available
      </div>
    );
  }

  const selectedImage = images[selectedIndex] ?? images[0];
  const changeImage = (direction: -1 | 1) => {
    setSelectedIndex((index) => (index + direction + images.length) % images.length);
  };

  return (
    <div className={images.length > 1 ? "grid grid-cols-[3.25rem_minmax(0,1fr)] gap-2.5 sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-4" : "block"}>
      {images.length > 1 ? (
        <div className="flex max-h-[min(78vw,42rem)] flex-col gap-2 overflow-y-auto pr-0.5 sm:gap-3">
          {images.map((image, index) => (
            <button key={image.id} type="button" onClick={() => setSelectedIndex(index)}
              aria-label={`View image ${index + 1}`} aria-pressed={selectedIndex === index}
              className={`relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-lg border transition ${selectedIndex === index ? "border-stone-900 ring-1 ring-stone-900" : "border-transparent opacity-75 hover:opacity-100"}`}>
              <Image src={image.url} alt={`${productName} view ${index + 1}`} fill sizes="(max-width: 640px) 52px, 72px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative aspect-[4/5] min-w-0 overflow-hidden rounded-2xl bg-stone-100">
        <Image src={selectedImage.url} alt={`${productName}, image ${selectedIndex + 1}`} fill priority
          sizes="(max-width: 1024px) 80vw, 45vw" className="object-cover" />
        {images.length > 1 && <>
          <button type="button" onClick={() => changeImage(-1)} aria-label="Previous product image"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-stone-800 shadow-sm backdrop-blur transition hover:bg-white">
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => changeImage(1)} aria-label="Next product image"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-stone-800 shadow-sm backdrop-blur transition hover:bg-white">
            <ChevronRight size={20} />
          </button>
          <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-stone-700 shadow-sm">{selectedIndex + 1} / {images.length}</span>
        </>}
      </div>
    </div>
  );
}

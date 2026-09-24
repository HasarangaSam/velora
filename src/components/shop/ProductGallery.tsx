"use client";

import Image from "next/image";
import { useState } from "react";

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
      <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
        No image available
      </div>
    );
  }

  const selectedImage = images[selectedIndex] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
        <Image
          src={selectedImage.url}
          alt={productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                selectedIndex === index
                  ? "border-blue-600"
                  : "border-transparent"
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt={`${productName} ${index + 1}`}
                fill
                sizes="100px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

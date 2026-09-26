"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from "lucide-react";

type ProductImage = {
  id: string;
  url: string;
  publicId: string;
  sortOrder: number;
  isPrimary: boolean;
};

type ProductImageManagerProps = {
  productId: string;
  initialImages: ProductImage[];
};

export default function ProductImageManager({
  productId,
  initialImages,
}: ProductImageManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    fileName: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));

    if (files.length === 0) {
      setError(true);
      setMessage("Please select valid image files (JPG, PNG, WEBP).");
      return;
    }

    setUploading(true);
    setMessage("");
    setError(false);

    let successCount = 0;
    const failures: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress({
        current: i + 1,
        total: files.length,
        fileName: file.name,
      });

      if (file.size > 5 * 1024 * 1024) {
        failures.push(`${file.name} (exceeds 5 MB limit)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          failures.push(`${file.name} (${data.message ?? "upload failed"})`);
          continue;
        }

        setImages((current) => [...current, data.image]);
        successCount++;
      } catch {
        failures.push(`${file.name} (network error)`);
      }
    }

    setUploading(false);
    setUploadProgress(null);

    if (failures.length > 0 && successCount > 0) {
      setError(true);
      setMessage(
        `Uploaded ${successCount} image${successCount > 1 ? "s" : ""}, but failed: ${failures.join(", ")}`,
      );
    } else if (failures.length > 0 && successCount === 0) {
      setError(true);
      setMessage(`Failed to upload images: ${failures.join(", ")}`);
    } else {
      setError(false);
      setMessage(
        `Successfully uploaded ${successCount} image${successCount > 1 ? "s" : ""}.`,
      );
    }
  }

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    void uploadFiles(files);
    event.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  async function updateImage(
    imageId: string,
    action: "primary" | "move-left" | "move-right",
  ) {
    setBusyImageId(imageId);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images/${imageId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(true);
        setMessage(data.message ?? "Unable to update image.");
        return;
      }

      if (action === "primary") {
        setImages((current) =>
          current.map((image) => ({
            ...image,
            isPrimary: image.id === imageId,
          })),
        );
      } else {
        setImages((current) => {
          const next = [...current];

          const currentIndex = next.findIndex((image) => image.id === imageId);

          if (currentIndex === -1) {
            return current;
          }

          const targetIndex =
            action === "move-left" ? currentIndex - 1 : currentIndex + 1;

          if (targetIndex < 0 || targetIndex >= next.length) {
            return current;
          }

          [next[currentIndex], next[targetIndex]] = [
            next[targetIndex],
            next[currentIndex],
          ];

          return next;
        });
      }

      setMessage(data.message);
    } catch {
      setError(true);
      setMessage("Unable to connect to the server.");
    } finally {
      setBusyImageId(null);
    }
  }

  async function deleteImage(image: ProductImage) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this image?",
    );

    if (!confirmed) {
      return;
    }

    setBusyImageId(image.id);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(
        `/api/admin/products/${productId}/images/${image.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(true);
        setMessage(data.message ?? "Unable to delete image.");
        return;
      }

      setImages((current) =>
        current
          .filter((currentImage) => currentImage.id !== image.id)
          .map((currentImage, index) => ({
            ...currentImage,
            sortOrder: index,
          })),
      );

      if (image.isPrimary) {
        setImages((current) =>
          current.map((currentImage, index) => ({
            ...currentImage,
            isPrimary: index === 0,
          })),
        );
      }

      setMessage("Image deleted successfully.");
    } catch {
      setError(true);
      setMessage("Unable to connect to the server.");
    } finally {
      setBusyImageId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Product images
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Upload images, choose the primary image and control their display
            order.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ImagePlus className="h-4 w-4" />
            {uploadProgress
              ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`
              : uploading
                ? "Uploading..."
                : "Upload images"}
          </button>
          {uploadProgress && (
            <span className="text-xs text-slate-500 truncate max-w-[200px]">
              {uploadProgress.fileName}
            </span>
          )}
        </div>
      </div>

      {/* Drag & drop upload area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50/50"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
        }`}
      >
        <ImagePlus
          className={`h-8 w-8 ${
            isDragging ? "text-blue-500" : "text-slate-400"
          }`}
        />
        <p className="mt-2 text-sm font-medium text-slate-700">
          {isDragging
            ? "Drop images here to upload"
            : "Click to browse or drag & drop multiple images"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          JPG, PNG, WEBP up to 5 MB each. You can select multiple images at once.
        </p>
      </div>

      {images.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            No product images yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Upload images above to showcase this product.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="relative aspect-square bg-slate-100">
                <Image
                  src={image.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />

                {image.isPrimary && (
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-sm">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    Primary
                  </div>
                )}
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Image {index + 1}</span>

                  <span>{image.isPrimary ? "Main image" : "Secondary"}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={index === 0 || busyImageId === image.id}
                    onClick={() => updateImage(image.id, "move-left")}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Left
                  </button>

                  <button
                    type="button"
                    disabled={
                      index === images.length - 1 || busyImageId === image.id
                    }
                    onClick={() => updateImage(image.id, "move-right")}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Right
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={image.isPrimary || busyImageId === image.id}
                  onClick={() => updateImage(image.id, "primary")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Star className="h-4 w-4" />
                  {image.isPrimary ? "Primary image" : "Set as primary"}
                </button>

                <button
                  type="button"
                  disabled={busyImageId === image.id || images.length <= 1}
                  onClick={() => deleteImage(image)}
                  title={images.length <= 1 ? "A product must have at least one image." : undefined}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete image
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {message}
        </div>
      )}
    </section>
  );
}

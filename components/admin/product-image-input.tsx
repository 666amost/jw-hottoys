"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 3_500_000;
const MAX_DIMENSION = 1600;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("WEBP_NOT_SUPPORTED"))),
      "image/webp",
      quality,
    );
  });
}

export function ProductImageInput({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    const preventEarlySubmit = (event: SubmitEvent) => {
      if (!optimizing) return;
      event.preventDefault();
      setError("Tunggu sampai kompresi gambar selesai.");
    };

    form.addEventListener("submit", preventEarlySubmit);
    return () => form.removeEventListener("submit", preventEarlySubmit);
  }, [optimizing]);

  async function optimize(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setMessage("");
    setError("");
    if (!file) return;

    if (file.size > MAX_SOURCE_BYTES) {
      input.value = "";
      setError("Ukuran gambar asli maksimal 15 MB.");
      return;
    }

    setOptimizing(true);
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, MAX_DIMENSION / bitmap.width, MAX_DIMENSION / bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("CANVAS_UNAVAILABLE");
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      let output: Blob | null = null;
      for (const quality of [0.82, 0.72, 0.62]) {
        output = await canvasToWebp(canvas, quality);
        if (output.size <= MAX_OUTPUT_BYTES) break;
      }
      if (!output || output.size > MAX_OUTPUT_BYTES) {
        throw new Error("OUTPUT_TOO_LARGE");
      }

      const baseName = file.name.replace(/\.[^.]+$/, "") || "product";
      const optimizedFile = new File([output], `${baseName}.webp`, {
        type: "image/webp",
        lastModified: Date.now(),
      });
      const transfer = new DataTransfer();
      transfer.items.add(optimizedFile);
      input.files = transfer.files;
      setMessage(
        `Siap diunggah: ${formatSize(file.size)} → ${formatSize(output.size)} WebP (${canvas.width}×${canvas.height}px).`,
      );
    } catch {
      input.value = "";
      setError("Gambar tidak dapat diproses. Gunakan JPG, PNG, WebP, atau AVIF.");
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <label className="field-label">
      {label}
      <input
        ref={inputRef}
        className="field file:mr-3 file:rounded-full file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-bold file:text-blue-700"
        name="image_file"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        required={required}
        onChange={optimize}
      />
      <span className="mt-1 block text-xs font-medium normal-case text-slate-500">
        {optimizing ? "Mengompres gambar..." : message || "Otomatis menjadi WebP, maksimal 1600 px."}
      </span>
      {error && <span className="mt-1 block text-xs font-semibold normal-case text-red-600">{error}</span>}
    </label>
  );
}

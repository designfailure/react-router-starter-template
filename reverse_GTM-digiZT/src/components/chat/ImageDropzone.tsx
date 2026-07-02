"use client";

import { useMemo, useRef } from "react";

interface ImageDropzoneProps {
  imagePreviewUrl: string | null;
  fileName: string | null;
  onChange: (payload: { base64: string; mime: string; previewUrl: string; fileName: string } | null) => void;
}

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 4 * 1024 * 1024;

export function ImageDropzone({ imagePreviewUrl, fileName, onChange }: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const helperText = useMemo(() => {
    return "JPEG, PNG ali WebP, do 4 MB.";
  }, []);

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null);
      return;
    }
    if (!acceptedTypes.includes(file.type) || file.size > maxBytes) {
      onChange(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        onChange(null);
        return;
      }
      const [, base64 = ""] = result.split(",");
      onChange({
        base64,
        mime: file.type,
        previewUrl: result,
        fileName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Slika / kreativ</h2>
          <p className="text-sm text-slate-600">{helperText}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Izberi sliko
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />
      <div className="mt-4 flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50">
          {imagePreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreviewUrl} alt="Predogled izbrane slike" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              Predogled
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-800">{fileName ?? "Ni izbrane slike"}</p>
          <p className="text-xs text-slate-500">Vizualna analiza je na voljo ob vklopljenem LLM.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Počisti
        </button>
      </div>
    </section>
  );
}

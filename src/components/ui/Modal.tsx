"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: Props) {
  // Lock page scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* dialog */}
      <div className="relative z-[101] w-full max-w-3xl">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/90 shadow-2xl">
          {/* header */}
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
            <div className="text-base font-semibold text-white">
              {title || "Modal"}
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 p-1.5 text-zinc-300 hover:bg-white/10"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* body (scrolls independently) */}
          <div className="max-h-[78vh] overflow-y-auto px-5 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

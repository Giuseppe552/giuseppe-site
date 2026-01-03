// components/auth/InlineSignOut.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import Modal from "@/components/ui/Modal";
import { LogOut } from "lucide-react";

export default function InlineSignOut({
  returnTo = "/labs/ats",
}: {
  returnTo?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function doSignOut() {
    setBusy(true);
    try {
      await signOut({ redirect: false });     // no navigation
      setOpen(false);
      // Optional: keep them on the exact same route
      router.replace(returnTo);
      router.refresh();                       // re-fetch session on this page
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 hover:bg-white/10"
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title="Sign out">
        <p className="text-sm text-zinc-300">
          Are you sure you want to sign out? You’ll stay on this page.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setOpen(false)}
            disabled={busy}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={doSignOut}
            disabled={busy}
            className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </Modal>
    </>
  );
}

"use client";

import { GuestManager } from "@/components/guest-manager";
import { use, useEffect } from "react";
import { saveWedding, loadSavedWedding } from "@/lib/weddingLocal";

export default function Page({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  // Try to synchronously save code to localStorage to avoid bootstrap race where
  // GuestManager requests /api/bootstrap before the code is persisted.
  if (typeof window !== "undefined" && code) {
    try {
      const existing = loadSavedWedding();
      if (!existing || existing.code !== code) {
        saveWedding(code);
      }
    } catch {}
  }

  useEffect(() => {
    // keep saved window refreshed on mount
    if (code) saveWedding(code);
  }, [params]);

  return <GuestManager code={code}/>;
}

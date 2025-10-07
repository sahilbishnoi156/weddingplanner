"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveWedding } from "@/lib/weddingLocal";

export default function CreateCode() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function start() {
    setBusy(true);
    try {
      const res = await fetch("/api/weddings/create", { method: "POST" });
      const json = await res.json();
      if (!res.ok)
        return toast.error(json?.error || "Could not create wedding");
      // Save code locally for 5 days and navigate
      saveWedding(json.code);
      toast.success(`Wedding created — code ${json.code}`);
      router.push(`/${json.code}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create wedding");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={start} disabled={busy} variant="default">
      {busy ? "Creating…" : "Start instant wedding"}
    </Button>
  );
}

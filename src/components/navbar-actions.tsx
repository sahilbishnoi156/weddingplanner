"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ThemeToggle } from "./theme-toggle";
import { loadSavedWedding, clearSavedWedding } from "@/lib/weddingLocal";
import { Button } from "./ui/button";
import { CheckCheck, Copy, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/state";

export default function NavbarActions({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const deleteWedding = useAppStore.getState().deleteWedding;

  async function handleRenew() {
    const saved = loadSavedWedding();
    if (!saved?.code) return toast.error("No wedding saved to renew");
    setBusy(true);
    try {
      const res = await fetch("/api/weddings/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: saved.code }),
      });
      const body = await res.json();
      if (!res.ok) return toast.error(body?.error || "Could not renew wedding");
      const expires = new Date(body.expiresAt);
      toast.success(`Renewed until ${expires.toLocaleString()}`);
    } catch (err) {
      console.error(err);
      toast.error("Renew failed");
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    clearSavedWedding();
    toast.success("Logged out — saved code cleared");
    router.push("/");
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={"ghost"}
        size={"icon-sm"}
        onClick={() => {
          if (
            !confirm(
              "Are you sure you want to delete this wedding? This action cannot be undone."
            )
          )
            return;
          if (busy) return;
          setBusy(true);
          deleteWedding()
            .then((data) => {
              if (!data) return;
              clearSavedWedding();
              router.push("/");
            })
            .catch((err) => {
              console.error(err);
              toast.error("Delete failed");
            })
            .finally(() => setBusy(false));
        }}
        aria-label="Delete Wedding"
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
      <Button
        variant={"ghost"}
        size={"icon-sm"}
        onClick={() => {
          navigator.clipboard.writeText(code || loadSavedWedding()?.code || "");
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }}
        aria-label="Copy Code to clipboard"
      >
        {isCopied ? (
          <CheckCheck className="size-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant={"ghost"}
        onClick={handleRenew}
        disabled={busy}
        aria-label="Renew wedding"
      >
        Renew
      </Button>

      <Button
        variant={"ghost"}
        onClick={handleLogout}
        aria-label="Logout saved wedding"
      >
        Logout
      </Button>

      <ThemeToggle />
    </div>
  );
}

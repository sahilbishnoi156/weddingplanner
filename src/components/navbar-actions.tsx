"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ThemeToggle } from "./theme-toggle";
import { loadSavedWedding, clearSavedWedding } from "@/lib/weddingLocal";
import { Button } from "./ui/button";
import { CheckCheck, Copy, LogOut, Trash2 } from "lucide-react";

export default function NavbarActions() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  // Determine if we're currently on a code route: /<CODE>
  const [isCodeRoute, setIsCodeRoute] = React.useState(false);
  const [currentCode, setCurrentCode] = React.useState<string | null>(null);
  const [savedWedding, setSavedWedding] = React.useState<{
    code: string;
    savedAt: number;
    expireAt: number;
  } | null>(null);

  React.useEffect(() => {
    const saved = loadSavedWedding();
    setSavedWedding(saved);
    setCurrentCode(saved?.code ?? null);
    if (typeof window !== "undefined") {
      const path = window.location.pathname.replace(/\/$/, "");
      // match a path like /ABCDEF (6-8 chars)
      const m = path.match(/^\/([A-Z0-9]{6,8})$/i);
      if (m) {
        setIsCodeRoute(true);
        if (!saved?.code) setCurrentCode(m[1].toUpperCase());
      } else {
        setIsCodeRoute(false);
      }
    }
  }, []);

  async function handleDelete() {
    const code = currentCode;
    if (!code) return toast.error("No wedding code available to delete");
    if (!confirm("Delete this wedding? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/weddings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const body = await res.json();
      if (!res.ok)
        return toast.error(body?.error || "Could not delete wedding");
      clearSavedWedding();
      toast.success("Wedding deleted");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function handleCopy() {
    const code = currentCode;
    if (!code) return toast.error("No code to copy");
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  }

  function handleLogout() {
    clearSavedWedding();
    toast.success("Logged out — saved code cleared");
    router.push("/");
  }

  return (
    <div className="flex items-center gap-2">
      {isCodeRoute && (
        <>
          <Button
            variant="outline"
            onClick={handleDelete}
            aria-label="Delete wedding"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>

          <Button
            variant="outline"
            onClick={handleCopy}
            aria-label="Copy code"
          >
            {isCopied ? (
              <CheckCheck className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        onClick={handleLogout}
        aria-label="Logout saved wedding"
      >
        <LogOut className="h-4 w-4" />
      </Button>

      <ThemeToggle />
    </div>
  );
}

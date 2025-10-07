"use client"
import { normalizeCode, isValidCode } from "@/lib/code";
import { saveWedding } from "@/lib/weddingLocal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinForm() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const normalized = normalizeCode(code);
    if (!isValidCode(normalized)) {
      toast.error("Enter a valid 6–8 character code");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/weddings/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const json = await res.json();
      if (!res.ok) return toast.error(json?.error || "Not found or expired");
      saveWedding(normalized);
      toast.success("Opened wedding");
      router.push(`/${normalized}`);
    } catch {
      toast.error("Could not open wedding");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col sm:flex-row gap-4 items-center mt-4 w-full max-w-lg"
      aria-labelledby="join-form-title"
      role="form"
    >
      <label htmlFor="code" className="sr-only">
        Wedding Join Code
      </label>
      <Input
        id="code"
        name="wedding-code"
        value={code}
        onChange={e =>
          setCode(
            e.target.value
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "")
              .replace(/[OI]/g, "")
          )
        }
        placeholder="Enter code (6–8 characters)"
        maxLength={8}
        autoComplete="off"
        required
        aria-required="true"
        aria-label="Enter wedding code"
        className="flex-1 rounded-lg border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 text-lg tracking-widest font-mono py-3"
      />
      <Button
        type="submit"
        disabled={busy}
        className="rounded-lg px-6 text-base py-3 min-w-[120px] font-semibold"
        aria-busy={busy}
      >
        {busy ? "Opening…" : "Join"}
      </Button>
    </form>
  );
}
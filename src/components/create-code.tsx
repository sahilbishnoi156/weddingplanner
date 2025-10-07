"use client"
import { useRouter } from "next/navigation";
import React from "react";

export default function CreateCode() {
  const router = useRouter();
  async function start() {
    const res = await fetch("/api/weddings/create", { method: "POST" });
    const json = await res.json();
    if (!res.ok) return alert(json?.error || "Could not create wedding");
    router.push(`/${json.code}`);
  }
  return (
    <button onClick={start} className="btn-primary">
      Start instant wedding
    </button>
  );
}

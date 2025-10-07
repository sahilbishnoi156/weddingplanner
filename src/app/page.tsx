import CreateCode from "@/components/create-code";
import Link from "next/link";

export default function Landing() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Wedding Planner</h1>
      <p className="mt-2 text-muted-foreground">
        A small guest list planner. Start a temporary wedding or open an
        existing one with a code.
      </p>

      <div className="mt-6 flex gap-3">
        <CreateCode />
        <Link href="/open">Open existing wedding</Link>
      </div>
    </main>
  );
}

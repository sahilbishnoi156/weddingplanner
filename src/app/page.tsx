// app/landing/page.tsx (or your main page file)
// Uses Next.js App Router metadata API + advanced Tailwind for typography/UI

import { Metadata } from "next";

import CreateCode from "@/components/create-code";
import JoinForm from "@/components/join-form";


// --- SEO & OpenGraph Metadata ---
export const metadata: Metadata = {
  title: "Wedding Planner: Effortless Guest Management & Instant Wedding Codes",
  description:
    "The ultimate lightweight, accessible wedding guest list manager. Instantly create or join weddings with shareable codes (no account required, 15-day expiry). Fast, secure, responsive, and private.",
  openGraph: {
    title: "Wedding Planner: Instant Guest List Tool",
    description:
      "Plan and manage your wedding with instant setup or join with a short, easy code. Secure, responsive, and privacy-first.",
    url: "https://yourdomain.com",
    type: "website",
    images: [
      {
        url: "https://yourdomain.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wedding Planner dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Planner: Guest Management",
    description:
      "Instantly create or join a wedding and manage your guest list.",
    images: ["https://yourdomain.com/og-image.png"],
  },
  robots: "index, follow",
};


// --- Main Landing Page ---
export default function Landing() {
  return (
    <main className="min-h-screen bg-gradient-to-br  text-white font-sans tracking-tight antialiased">
      <div className="max-w-4xl mx-auto p-4 flex flex-col gap-10">
        <header className="text-center py-4 border-b border-neutral-700">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-2 font-display">
            Wedding Planner
          </h1>
          <p className="text-xl md:text-2xl font-medium text-neutral-200 max-w-2xl mx-auto">
            Fastest way to organize your guest list and manage your wedding in one place.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-10 items-stretch">
          {/* Left info + Join form */}
          <div>
            <h2 className="text-2xl font-semibold mb-4" id="join-form-title">
              Join With a Code
            </h2>
            <p className="text-base text-neutral-300 mb-3">
              <span className="font-semibold text-white">Returning?</span> Enter your unique wedding code to access your dashboard (saved locally for 5 days). No sign-in or account needed.
            </p>
            <JoinForm />

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-neutral-100 mb-1">Privacy & Security</h3>
              <ul className="text-neutral-400 text-sm space-y-1 list-disc list-inside">
                <li>All codes are temporary (15-day expiry) and not shared or stored on our servers after expiry.</li>
                <li>Your guest data stays private and secure.</li>
                <li>Share your event code only with people you trust.</li>
              </ul>
            </div>
          </div>

          {/* Right: Create and feature area */}
          <div className="flex flex-col gap-6 px-2 justify-between">
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Start an Instant Wedding
              </h2>
              <p className="text-base text-neutral-300 mb-3">
                <span className="font-semibold text-white">New?</span> Instantly generate a new wedding event and code — it’s free, fast, and account-free.
              </p>
              <div className="mt-4">
                <CreateCode />
              </div>
            </section>
            <section className="mt-5">
              <h3 className="text-lg font-light mb-2 text-neutral-100">Features:</h3>
              <ul className="text-neutral-300 text-base space-y-1 list-disc list-inside">
                <li>No registration or downloads required.</li>
                <li>Mobile-first and desktop-responsive design for effortless access.</li>
                <li>Fast setup, human-friendly codes (no confusing letters).</li>
                <li>Clean interface and accessible for screen readers.</li>
              </ul>
            </section>
          </div>
        </section>

        <footer className="mt-4 pt-4 border-t border-neutral-700 text-center text-xs text-neutral-500">
          &copy; {new Date().getFullYear()} Wedding Planner. All rights reserved. | No account required | <span role="img" aria-label="wedding rings">💍</span>
        </footer>
      </div>
    </main>
  );
}

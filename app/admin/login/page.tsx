import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-saffron-50 via-cream to-leaf-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo-mark.svg" alt="" className="h-16 w-16" />
          <p className="mt-3 font-hindi text-2xl font-bold text-saffron-700">गृहस्थ भोजनम्</p>
          <p className="text-sm text-leaf-700">Admin · Kitchen Control Room</p>
        </div>
        <Suspense><LoginForm /></Suspense>
      </div>
    </div>
  );
}

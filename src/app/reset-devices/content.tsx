"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ResetDeviceSessionsContent() {
  const { resetDeviceVerify, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Processing...");

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const handleReset = async () => {
      if (!token) {
        setError("Invalid or missing reset token.");
        setStatus("");
        return;
      }

      try {
        setStatus("Resetting your device sessions...");
        await resetDeviceVerify(token);

        setStatus("Success! Redirecting to login...");
        setTimeout(() => {
          router.replace("/auth/login");
        }, 1500);
      } catch (err: any) {
        setError(err.message || "Device session reset failed.");
        setStatus("");
      }
    };

    handleReset();
  }, [token, resetDeviceVerify, router]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[45%] bg-brand-900 flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-400 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <span className="font-display font-700 text-white text-lg">
            Printex
          </span>
        </Link>
        <div>
          <blockquote className="text-brand-200 text-xl font-300 leading-relaxed mb-6">
            "The most precise carton layout tool we've used. Saves our team
            hours every week."
          </blockquote>
          <div className="text-brand-400 text-sm">
            — Packaging Engineer, Mumbai
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {["Self Lock", "Both Side Tuck"].map((s) => (
            <div key={s} className="bg-brand-800 rounded-xl p-4 text-center">
              <div className="text-brand-300 text-xs font-medium">{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <h1 className="font-display font-700 text-3xl text-surface-900 mb-4">
            Resetting Devices
          </h1>

          {/* Loading / status */}
          {status && !error && (
            <div className="flex flex-col items-center gap-4">
              <svg
                className="animate-spin w-6 h-6 text-brand-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="opacity-25"
                />
                <path
                  fill="currentColor"
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-surface-600">{status}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Back to login */}
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="text-brand-500 font-medium hover:underline"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

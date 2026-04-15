"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function OtpVerificationPageContent() {
  const { signup, otpVerify, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ otp: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect already-authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await otpVerify(form.otp);
      const data = JSON.parse(localStorage.getItem("signup_form") || "");
      await signup(data.name, data.email, data.password);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show blank while checking existing session
  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-[45%] bg-surface-900 flex-col justify-between p-12">
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
            Carton Planner
          </span>
        </Link>
        <div className="space-y-6">
          <h2 className="font-display text-4xl font-700 text-white leading-tight">
            Calculate sheet sizes
            <br />
            in seconds.
          </h2>
          <div className="space-y-3">
            {[
              "✓ 1-day free trial, no card required",
              "✓ All carton styles supported",
              "✓ Full calculation history",
              "✓ Up to 2 devices per account",
            ].map((f) => (
              <p key={f} className="text-surface-400 text-sm">
                {f}
              </p>
            ))}
          </div>
        </div>
        <p className="text-surface-600 text-xs">
          Professional packaging tools for modern print shops.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-display font-700 text-3xl text-surface-900 mb-2">
              OTP Verification
            </h1>
            <p className="text-surface-500">Enter the otp sent to </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">OTP</label>
              <input
                type="number"
                className="input"
                placeholder="••••••"
                value={form.otp}
                onChange={(e) =>
                  setForm((p) => ({ ...p, otp: e.target.value }))
                }
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Verifying…
                </span>
              ) : (
                "Verify"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-brand-500 font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

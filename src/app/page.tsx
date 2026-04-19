"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-surface-100 px-3 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
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
            <span className="font-display font-700 text-lg text-surface-900">
              Printex
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="btn-outline text-sm py-2 px-2 sm:px-4"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="btn-primary text-sm py-2 px-2 sm:px-4"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="badge badge-blue mb-6 text-sm px-4 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Free 1-day trial — No credit card required
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-800 text-surface-900 mb-6 leading-tight tracking-tight">
          Precision Carton
          <br />
          <span className="text-brand-500">Sheet Planning</span>
        </h1>
        <p className="text-xl text-surface-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Calculate exact sheet sizes for any carton style instantly. Built for
          packaging engineers, print buyers, and pre-press professionals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="btn-primary text-base px-8 py-3.5 shadow-brand animate-pulse-glow"
          >
            Start Free Trial
          </Link>
          <Link href="/pricing" className="btn-outline text-base px-8 py-3.5">
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "📐",
              title: "Multi-Style Support",
              desc: "Self Lock, Tuck End, Snap Lock, Crash Lock, Seal End — all carton styles covered.",
            },
            {
              icon: "📏",
              title: "mm & Inches",
              desc: "Work in your preferred unit. Switch between metric and imperial seamlessly.",
            },
            {
              icon: "📋",
              title: "Full History",
              desc: "Every calculation saved to your account. Review past jobs anytime.",
            },
            {
              icon: "📱",
              title: "Device Control",
              desc: "Manage which devices can access your account. Add extra slots as needed.",
            },
            {
              icon: "🔒",
              title: "Secure & Private",
              desc: "JWT-based auth, bcrypt passwords, and encrypted sessions keep your data safe.",
            },
            {
              icon: "⚡",
              title: "Instant Results",
              desc: "Multiple layout options per calculation, including grain direction and 2-up layouts.",
            },
          ].map((f, i) => (
            <div key={i} className="card p-6">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display font-700 text-lg text-surface-900 mb-2">
                {f.title}
              </h3>
              <p className="text-surface-500 text-sm leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-brand-500 rounded-3xl p-12 text-center text-white">
          <h2 className="font-display text-4xl font-700 mb-4">
            Ready to plan smarter?
          </h2>
          <p className="text-brand-100 mb-8 text-lg">
            Start your free 1-day trial — no credit card needed.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-white text-brand-600 font-600 px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Create Free Account <ArrowRight className="text-brand-600" size={14} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-surface-400">
          <span>© 2024 Printex. All rights reserved.</span>
          <Link
            href="/pricing"
            className="hover:text-surface-600 transition-colors"
          >
            Pricing
          </Link>
        </div>
      </footer>
    </div>
  );
}

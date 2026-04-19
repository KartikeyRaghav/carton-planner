"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Calculation, DeviceSession } from "@/types";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { user, subscriptionStatus, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [recentCalcs, setRecentCalcs] = useState<Calculation[]>([]);
  const [totalCalcs, setTotalCalcs] = useState(0);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [maxDevices, setMaxDevices] = useState(2);
  const [dataLoading, setDataLoading] = useState(true);

  // Redirect unauthenticated users after auth check completes
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    Promise.all([
      fetch("/api/sheetSizeCalculations?limit=5", {
        credentials: "include",
      }).then((r) => r.json()),
      fetch("/api/devices", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/total-calcs", {
        credentials: "include",
      }).then((r) => r.json()),
    ])
      .then(([calcData, devData, total]) => {
        if (calcData.success) setRecentCalcs(calcData.data.calculations);
        if (devData.success) {
          setDevices(devData.data.devices);
          setMaxDevices(devData.data.maxDevices);
        }
        if (total.success) setTotalCalcs(total.data.total);
      })
      .finally(() => setDataLoading(false));
  }, [isAuthenticated]);

  // Show spinner while auth is resolving
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <svg
          className="animate-spin w-6 h-6 text-brand-500"
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
      </div>
    );
  }

  const trialHoursRemaining = user?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.trialEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60),
        ),
      )
    : 0;

  return (
    <AppLayout>
      <div className="p-4 sm:px-8 pt-20 lg:py-8">
        {/* Header */}
        <div className="mb-8 animate-in">
          <h1 className="font-display font-700 text-2xl text-surface-900">
            Good day, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-surface-500 mt-1">Here's your account overview.</p>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Subscription Status */}
          <div className="card p-5 animate-in stagger-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                Subscription
              </span>
              <span
                className={`badge ${
                  subscriptionStatus?.isSubscribed
                    ? "badge-green"
                    : subscriptionStatus?.isTrialing
                      ? "badge-yellow"
                      : "badge-red"
                }`}
              >
                {subscriptionStatus?.isSubscribed
                  ? "Active"
                  : subscriptionStatus?.isTrialing
                    ? "Trial"
                    : "Expired"}
              </span>
            </div>
            <div className="font-display font-700 text-2xl text-surface-900 mb-1">
              {subscriptionStatus?.isSubscribed
                ? `${subscriptionStatus.daysRemaining} days left`
                : subscriptionStatus?.isTrialing
                  ? `${trialHoursRemaining}h left`
                  : "No Access"}
            </div>
            <p className="text-xs text-surface-400 mb-4">
              {subscriptionStatus?.isSubscribed
                ? "Paid subscription"
                : subscriptionStatus?.isTrialing
                  ? "Free trial"
                  : "Trial expired"}
            </p>
            {!subscriptionStatus?.isSubscribed && (
              <Link
                href="/pricing"
                className="btn-primary text-sm py-2 w-full text-center"
              >
                Upgrade Now
              </Link>
            )}
          </div>

          {/* Calculator quick access */}
          <div className="card p-5 animate-in stagger-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                Calculator
              </span>
              <span className="badge badge-blue">Ready</span>
            </div>
            <div className="font-display font-700 text-2xl text-surface-900 mb-1">
              {totalCalcs} calculations
            </div>
            <p className="text-xs text-surface-400 mb-4">
              Total calculations done
            </p>
            <Link
              href="/calculator"
              className="btn-outline text-sm py-2 w-full text-center"
            >
              Open Calculator →
            </Link>
          </div>

          {/* Devices */}
          <div className="card p-5 animate-in stagger-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                Devices
              </span>
              <span
                className={`badge ${devices.length >= maxDevices ? "badge-red" : "badge-green"}`}
              >
                {devices.length}/{maxDevices} used
              </span>
            </div>
            <div className="flex items-end gap-1 mb-1">
              <span className="font-display font-700 text-2xl text-surface-900">
                {devices.length}
              </span>
              <span className="text-surface-400 text-sm mb-0.5">
                / {maxDevices} max
              </span>
            </div>
            <div className="h-1.5 bg-surface-100 rounded-full mt-2 mb-4">
              <div
                className={`h-1.5 rounded-full transition-all ${devices.length >= maxDevices ? "bg-red-400" : "bg-brand-400"}`}
                style={{
                  width: `${Math.min((devices.length / maxDevices) * 100, 100)}%`,
                }}
              />
            </div>
            <Link
              href="/pricing"
              className="btn-outline text-sm py-2 w-full text-center"
            >
              Manage / Add Slots
            </Link>
          </div>
        </div>

        {/* No access banner */}
        {!subscriptionStatus?.hasAccess && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between animate-in">
            <div>
              <p className="font-semibold text-amber-800">
                Your free trial has expired
              </p>
              <p className="text-sm text-amber-600 mt-0.5">
                Subscribe to continue using the calculator.
              </p>
            </div>
            <Link
              href="/pricing"
              className="btn-primary text-sm py-2.5 px-5 flex-shrink-0"
            >
              View Plans
            </Link>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Calculations */}
          <div className="card p-3 sm:p-5 animate-in stagger-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-700 text-lg text-surface-900">
                Recent Calculations
              </h2>
              <Link
                href="/history"
                className="text-brand-500 text-sm hover:underline flex items-center gap-1 text-right"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {dataLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-surface-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : recentCalcs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📐</div>
                <p className="text-surface-500 text-sm">No calculations yet.</p>
                <Link
                  href="/calculator"
                  className="btn-primary text-sm mt-4 inline-flex"
                >
                  Run your first calculation
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentCalcs.map((calc) => (
                  <div
                    key={calc.id}
                    className="flex items-center justify-between p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-surface-900">
                        {calc.cartonStyle}
                      </p>
                      <p className="text-xs text-surface-400">
                        {calc.length} × {calc.width} × {calc.height} {calc.unit}
                      </p>
                    </div>
                    <div className="text-xs text-surface-400">
                      {new Date(calc.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Devices */}
          <div className="card p-3 sm:p-5 animate-in stagger-3" id="devices">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-700 text-lg text-surface-900">
                Active Devices
              </h2>
              <span className="text-xs text-surface-400">
                {devices.length}/{maxDevices} slots used
              </span>
            </div>

            {dataLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-surface-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : devices.length === 0 ? (
              <p className="text-surface-400 text-sm text-center py-8">
                No active devices
              </p>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-brand-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">
                        {device.deviceName || "Unknown device"}
                      </p>
                      <p className="text-xs text-surface-400">
                        Last active:{" "}
                        {new Date(device.lastActive).toLocaleDateString()}
                      </p>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"
                      title="Active"
                    />
                  </div>
                ))}
              </div>
            )}

            {devices.length >= maxDevices && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
                Device limit reached.{" "}
                <Link href="/pricing" className="underline font-medium">
                  Purchase an extra slot
                </Link>{" "}
                or remove a device.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useSheetSizeCalculator } from "@/hooks/useCalculator";
import Link from "next/link";

const CARTON_STYLES = ["Self Lock", "Both Side Tuck"] as const;
const UNITS = [
  { value: "mm", label: "Millimeters (mm)" },
  { value: "inches", label: "Inches (in)" },
];

export default function CalculatorPage() {
  const { subscriptionStatus } = useAuth();
  const { form, results, isLoading, error, updateField, calculate, reset } =
    useSheetSizeCalculator();

  const hasAccess = subscriptionStatus?.hasAccess ?? true;

  return (
    <AppLayout>
      <div className="p-8 mx-auto">
        {/* Header */}
        <div className="mb-8 animate-in">
          <h1 className="font-display font-700 text-2xl text-surface-900">
            Carton Calculator
          </h1>
          <p className="text-surface-500 mt-1">
            Enter carton dimensions to calculate possible sheet sizes.
          </p>
        </div>

        {/* Access blocked */}
        {!hasAccess && (
          <div className="mb-6 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-800">
                Trial expired — Calculator locked
              </p>
              <p className="text-sm text-red-600 mt-0.5">
                Subscribe to unlock the calculator and calculation history.
              </p>
            </div>
            <Link
              href="/pricing"
              className="btn-primary text-sm py-2.5 px-5 flex-shrink-0"
            >
              View Plans →
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 card p-6 animate-in stagger-1 h-fit">
            <h2 className="font-display font-600 text-lg text-surface-900 mb-5">
              Input Parameters
            </h2>

            <div className="space-y-4">
              {/* Unit */}
              <div>
                <label className="label">Measurement Unit</label>
                <select
                  className="input"
                  value={form.unit}
                  onChange={(e) => updateField("unit", e.target.value)}
                  disabled={!hasAccess}
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Carton Style */}
              <div>
                <label className="label">Carton Style</label>
                <select
                  className="input"
                  value={form.cartonStyle}
                  onChange={(e) => updateField("cartonStyle", e.target.value)}
                  disabled={!hasAccess}
                >
                  {CARTON_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-3">
                {(["length", "width", "height"] as const).map((dim) => (
                  <div key={dim}>
                    <label className="label capitalize">
                      {dim[0].toUpperCase()} ({form.unit})
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="input"
                      placeholder="0"
                      value={form[dim]}
                      onChange={(e) => updateField(dim, e.target.value)}
                      disabled={!hasAccess}
                    />
                  </div>
                ))}
              </div>

              {/* Flaps */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Pasting Flap (PF)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input"
                    placeholder="0"
                    value={form.pastingFlap}
                    onChange={(e) => updateField("pastingFlap", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>
                <div>
                  <label className="label">Tuck-in Flap (TF)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input"
                    placeholder="0"
                    value={form.tuckInFlap}
                    onChange={(e) => updateField("tuckInFlap", e.target.value)}
                    disabled={!hasAccess}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1">
                <div>
                  <label className="label">
                    Lock Bottom/Self Lock Margin (LBM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input"
                    placeholder="0"
                    value={form.lockBottomMargin}
                    onChange={(e) =>
                      updateField("lockBottomMargin", e.target.value)
                    }
                    disabled={!hasAccess}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={calculate}
                  disabled={isLoading || !hasAccess}
                  className="btn-primary flex-1 py-2.5"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
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
                      Calculating…
                    </span>
                  ) : (
                    "Calculate"
                  )}
                </button>
                <button
                  onClick={reset}
                  className="btn-secondary px-4"
                  disabled={isLoading}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-4 animate-in stagger-2">
            {!results ? (
              <div className="card p-12 text-center">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="font-display font-600 text-lg text-surface-700 mb-2">
                  Ready to calculate
                </h3>
                <p className="text-surface-400 text-sm max-w-xs mx-auto">
                  Fill in the carton dimensions and click Calculate to see
                  possible sheet layouts.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-700 text-lg text-surface-900">
                    Sheet Layouts — {form.cartonStyle}
                  </h2>
                  <span className="badge badge-green">
                    {results.length} options
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {results.map((layout, i) => (
                    <div
                      key={i}
                      className="card p-5 hover:shadow-card-hover transition-shadow duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-surface-900 text-sm">
                            {layout.label}
                          </h3>
                        </div>
                        <div>
                          <h3 className="font-semibold text-surface-900 text-sm">
                            Grid Size: {layout.grid}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-50 rounded-xl p-3 text-center">
                          <div className="font-mono font-500 text-lg text-brand-600">
                            {layout.length.toFixed(form.unit === "mm" ? 1 : 3)}
                          </div>
                          <div className="text-xs text-surface-400 mt-0.5">
                            Length (inches)
                          </div>
                        </div>
                        <div className="bg-surface-50 rounded-xl p-3 text-center">
                          <div className="font-mono font-500 text-lg text-brand-600">
                            {layout.width.toFixed(form.unit === "mm" ? 1 : 3)}
                          </div>
                          <div className="text-xs text-surface-400 mt-0.5">
                            Width (inches)
                          </div>
                        </div>
                      </div>

                      {/* Visual sheet diagram
                    <div className="mt-4 bg-surface-50 rounded-xl p-3 flex items-center justify-center">
                      <div
                        className="relative border-2 border-dashed border-brand-300 bg-brand-50 rounded"
                        style={{
                          width: `${Math.min((layout.length / Math.max(layout.length, layout.width)) * 200, 200)}px`,
                          height: `${Math.min((layout.width / Math.max(layout.length, layout.width)) * 100, 100)}px`,
                          minWidth: "80px",
                          minHeight: "40px",
                        }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-xs text-brand-500 font-mono font-500">
                          {layout.length.toFixed(1)} × {layout.width.toFixed(1)}
                        </span>
                      </div>
                    </div> */}
                    </div>
                  ))}
                </div>

                <div className="card p-4 bg-surface-50">
                  <p className="text-xs text-surface-400 text-center">
                    All sizes include standard press tolerance. Verify with your
                    supplier before ordering. This calculation is saved to your
                    history.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

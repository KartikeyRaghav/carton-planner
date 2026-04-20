"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Calculation } from "@/types";

type Tab = "sheet" | "mono";

interface MonoCalc {
  id: string;
  packagingFormat: string;
  grandTotal: number;
  costPerUnit: number;
  sheetCost: number;
  inputs: any;
  results: any;
  createdAt: string;
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function HistoryPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("sheet");

  // Sheet calculator state
  const [sheetCalcs, setSheetCalcs] = useState<Calculation[]>([]);
  const [sheetPage, setSheetPage] = useState(1);
  const [sheetPagination, setSheetPagination] = useState({
    pages: 1,
    total: 0,
  });
  const [sheetLoading, setSheetLoading] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState<string | null>(null);

  // Mono carton state
  const [monoCalcs, setMonoCalcs] = useState<MonoCalc[]>([]);
  const [monoPage, setMonoPage] = useState(1);
  const [monoPagination, setMonoPagination] = useState({ pages: 1, total: 0 });
  const [monoLoading, setMonoLoading] = useState(true);
  const [monoExpanded, setMonoExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setSheetLoading(true);
    fetch(`/api/sheetSizeCalculations?page=${sheetPage}&limit=15`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSheetCalcs(data.data.calculations);
          console.log(data.data.calculations);
          setSheetPagination(data.data.pagination);
        }
      })
      .finally(() => setSheetLoading(false));
  }, [sheetPage, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setMonoLoading(true);
    fetch(`/api/mono-carton?page=${monoPage}&limit=15`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setMonoCalcs(data.data.calculations);
          setMonoPagination(data.data.pagination);
        }
      })
      .finally(() => setMonoLoading(false));
  }, [monoPage, isAuthenticated]);

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

  return (
    <AppLayout>
      <div className="p-4 sm:px-8 lg:py-8 pt-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display font-700 text-2xl text-surface-900">
            Calculation History
          </h1>
          <p className="text-surface-500 mt-1 text-sm">
            All your past calculations across both calculators.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface-100 rounded-xl p-1 gap-1 mb-6 w-fit">
          <button
            onClick={() => setTab("sheet")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "sheet"
                ? "bg-white shadow text-surface-900"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            📐 Sheet Size Calculator
            {sheetPagination.total > 0 && (
              <span className="ml-2 badge badge-blue">
                {sheetPagination.total}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("mono")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "mono"
                ? "bg-white shadow text-surface-900"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            💰 Mono Carton Rate
            {monoPagination.total > 0 && (
              <span className="ml-2 badge badge-blue">
                {monoPagination.total}
              </span>
            )}
          </button>
        </div>

        {/* Sheet Calculator History */}
        {tab === "sheet" && (
          <>
            {sheetLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-surface-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : sheetCalcs.length === 0 ? (
              <div className="card p-8 sm:p-16 text-center">
                <div className="text-5xl mb-4">📐</div>
                <h3 className="font-display font-600 text-xl text-surface-700 mb-2">
                  No sheet size calculations yet
                </h3>
                <p className="text-surface-400 text-sm">
                  Use the Sheet Size Calculator to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3 animate-in">
                {sheetCalcs.map((calc, i) => {
                  const isOpen = sheetExpanded === calc.id;
                  const results = calc.results as any[];
                  return (
                    <div key={calc.id} className="card overflow-hidden">
                      <button
                        className="w-full px-3 py-2 sm:px-5 sm:py-4 flex items-center justify-between hover:bg-surface-50 transition-colors text-left"
                        onClick={() =>
                          setSheetExpanded(isOpen ? null : calc.id)
                        }
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-brand-500 text-xs font-bold">
                              #{i + 1 + (sheetPage - 1) * 15}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-surface-900 text-sm">
                              {calc.cartonStyle}
                            </p>
                            <p className="text-xs text-surface-400 mt-0.5 font-mono">
                              L:{calc.length} × W:{calc.width} × H:{calc.height}{" "}
                              {calc.unit}
                              &nbsp;· PF:{calc.pastingFlap} · TF:
                              {calc.tuckInFlap}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-surface-400">
                              {new Date(calc.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <span className="badge badge-blue">
                            {results?.length ?? 0} layouts
                          </span>
                          <svg
                            className={`w-4 h-4 text-surface-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>
                      {isOpen && results && (
                        <div className="border-t border-surface-100 px-5 py-4 bg-surface-50">
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {results.map((layout: any, j: number) => (
                              <div
                                key={j}
                                className="bg-white rounded-xl p-3 border border-surface-100"
                              >
                                <div className="flex justify-between">
                                  <p className="text-xs font-semibold text-surface-600 mb-2 truncate">
                                    {layout.label}
                                  </p>
                                  <p className="text-xs font-semibold text-surface-600 mb-2 truncate">
                                    {layout.grid}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-surface-400">
                                      Length
                                    </span>
                                    <span className="font-mono font-500 text-brand-600">
                                      {layout.length?.toFixed(1)} {calc.unit}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-surface-400">
                                      Width
                                    </span>
                                    <span className="font-mono font-500 text-brand-600">
                                      {layout.width?.toFixed(1)} {calc.unit}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {sheetPagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setSheetPage((p) => Math.max(1, p - 1))}
                  disabled={sheetPage === 1}
                  className="btn-outline text-sm py-2 px-4 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-sm text-surface-500 px-4">
                  Page {sheetPage} of {sheetPagination.pages}
                </span>
                <button
                  onClick={() =>
                    setSheetPage((p) => Math.min(sheetPagination.pages, p + 1))
                  }
                  disabled={sheetPage === sheetPagination.pages}
                  className="btn-outline text-sm py-2 px-4 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {tab === "mono" && (
          <>
            {monoLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-surface-100 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : monoCalcs.length === 0 ? (
              <div className="card p-8 sm:p-16 text-center">
                <div className="text-5xl mb-4">💰</div>
                <h3 className="font-display font-600 text-xl text-surface-700 mb-2">
                  No Mono Carton Rate calculations yet
                </h3>
                <p className="text-surface-400 text-sm">
                  Use the Mono Carton Rate calculator to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3 animate-in">
                {monoCalcs.map((calc, i) => {
                  const isOpen = monoExpanded === calc.id;
                  const lineItems: any[] = calc.results?.lineItems ?? [];
                  return (
                    <div key={calc.id} className="card overflow-hidden">
                      <button
                        className="w-full px-3 py-2 sm:px-5 sm:py-4 flex items-center justify-between hover:bg-surface-50 transition-colors text-left"
                        onClick={() => setMonoExpanded(isOpen ? null : calc.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${"bg-blue-50"}`}
                          >
                            {"📦"}
                          </div>
                          <div>
                            <p className="font-semibold text-surface-900 text-sm capitalize">
                              Packaging Cost
                              <span className="ml-2 text-xs text-surface-400 font-mono">
                                #{calc.id}
                              </span>
                            </p>
                            <p className="text-xs flex flex-col sm:flex-row sm:gap-2 text-surface-400 mt-0.5">
                              <p>{calc.inputs?.sheetQty} sheets</p>
                              <p>{calc.inputs?.unitsPerSheet} units/sheet</p>
                              <p>GSM {calc.inputs?.gsm}</p>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-display font-700 text-base text-brand-600">
                              {fmt(calc.grandTotal)}
                            </p>
                            <p className="text-xs text-surface-400">
                              per {"box"}: {fmt(calc.costPerUnit)}
                            </p>
                          </div>
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-surface-400">
                              {new Date(calc.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                          <svg
                            className={`w-4 h-4 text-surface-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-surface-100 px-5 py-4 bg-surface-50">
                          <div className="grid sm:grid-cols-3 gap-3 mb-4">
                            <div className="bg-white rounded-xl p-3 border border-surface-100 text-center">
                              <p className="text-xs text-surface-400 mb-1">
                                Grand Total
                              </p>
                              <p className="font-display font-700 text-lg text-brand-600">
                                {fmt(calc.grandTotal)}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-surface-100 text-center">
                              <p className="text-xs text-surface-400 mb-1">
                                Sheet Cost
                              </p>
                              <p className="font-display font-700 text-lg text-surface-800">
                                {fmt(calc.sheetCost)}
                              </p>
                            </div>
                            <div className="bg-white rounded-xl p-3 border border-surface-100 text-center">
                              <p className="text-xs text-surface-400 mb-1">
                                Cost per {"Box"}
                              </p>
                              <p className="font-display font-700 text-lg text-surface-800">
                                {fmt(calc.costPerUnit)}
                              </p>
                            </div>
                          </div>
                          <div className="bg-white rounded-xl border border-surface-100 divide-y divide-surface-50 max-h-64 overflow-y-auto">
                            {lineItems
                              .filter(
                                (li: any) =>
                                  !li.isSectionHeader && li.value > 0,
                              )
                              .map((li: any, j: number) => (
                                <div
                                  key={j}
                                  className={`flex justify-between px-4 py-2 text-xs ${li.isSubItem ? "pl-8 text-surface-400" : "text-surface-700"}`}
                                >
                                  <span>
                                    {li.label}
                                    {li.sublabel ? ` (${li.sublabel})` : ""}
                                  </span>
                                  <span className="font-mono font-500">
                                    {fmt(li.value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {monoPagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setMonoPage((p) => Math.max(1, p - 1))}
                  disabled={monoPage === 1}
                  className="btn-outline text-sm py-2 px-4 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-sm text-surface-500 px-4">
                  Page {monoPage} of {monoPagination.pages}
                </span>
                <button
                  onClick={() =>
                    setMonoPage((p) => Math.min(monoPagination.pages, p + 1))
                  }
                  disabled={monoPage === monoPagination.pages}
                  className="btn-outline text-sm py-2 px-4 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

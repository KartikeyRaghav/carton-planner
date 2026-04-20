"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  MonoCartonInputs,
  MonoCartonResults,
  MonoCartonLineItem,
} from "@/lib/mono-carton-calculator";

const DEFAULTS: MonoCartonInputs = {
  length: 18,
  width: 25,
  gsm: 280,
  paperRate: 85,
  sheetQty: 1100,
  wastageShts: 50,
  unitsPerSheet: 6,
  noOfPlates: 5,
  plateRate: 225,
  perColourCost: 225,
  noOfColours: 4,
  includePantone: false,
  rateOfInk: 0,
  noOfPantoneColours: 0,
  printPerColour: 0,
  uvCoating: false,
  uvCoatingRate: 3,
  dripOff: true,
  dripOffRate: 1.5,
  warnish: false,
  warnishRate: 7,
  lamination: false,
  laminationRate: 4,
  dieCost: 1200,
  dieSetting: 300,
  dieCutting: 250,
  includeEmbossing: false,
  embossingBlockCost: 0,
  embossingPerBoxCost: 0,
  includeMatPack: false,
  matPackLaminationRate: 0,
  matPackWastage: 0,
  includeLeafing: false,
  leafingBlockCost: 0,
  leafingPerBoxCost: 0,
  stipping: 25,
  shorting: 25,
  sidePasting: 45,
  lockBottom: 0,
  noOfPkt: 4,
  bagRate: 25,
  boxRate: 0,
  ccPcChargesPercent: 5,
  marginPercent: 10,
};

function Field({
  label,
  value,
  onChange,
  disabled,
  step = "0.01",
  min = "0",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="label text-xs">{label}</label>
      <input
        type="number"
        step={step}
        min={min}
        className="input text-sm"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        disabled={disabled}
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-3 sm:p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-surface-500 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PrintReport({
  results,
  inputs,
  calcId,
}: {
  results: MonoCartonResults;
  inputs: MonoCartonInputs;
  calcId?: string;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow || !printRef.current) return;
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Mono Carton Rate Quotation${calcId ? " #" + String(calcId) : ""}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #0f172a; background: #fff; padding: 32px; font-size: 13px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    h2 { font-size: 15px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .sub { color: #64748b; font-size: 12px; margin-bottom: 24px; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
    .divider-light { border: none; border-top: 1px solid #f1f5f9; margin: 10px 0; }

    /* Input sections */
    .input-block { margin-bottom: 20px; }
    .input-block-title { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0c8ee8; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e0f0fd; }
    .input-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 16px; }
    .input-grid.cols-3 { grid-template-columns: repeat(3, 1fr); }
    .input-grid.cols-2 { grid-template-columns: repeat(2, 1fr); }
    .input-item { display: flex; flex-direction: column; gap: 1px; }
    .input-label { font-size: 10px; color: #94a3b8; font-weight: 500; }
    .input-value { font-size: 12px; color: #1e293b; font-weight: 600; }
    .badge { display: inline-block; padding: 1px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-on { background: #d1fae5; color: #065f46; }
    .badge-off { background: #f1f5f9; color: #94a3b8; }
    .inline-inputs { display: flex; gap: 24px; flex-wrap: wrap; }

    /* Results */
    .row { display: flex; justify-content: space-between; align-items: baseline; padding: 5px 0; }
    .row.sub-item { padding-left: 24px; color: #475569; }
    .row.section-header { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #0c8ee8; padding-top: 12px; padding-bottom: 2px; }
    .row.total { font-weight: 700; font-size: 15px; padding: 8px 0; }
    .row.grand { font-weight: 800; font-size: 20px; color: #0c8ee8; padding: 10px 0; border-top: 2px solid #0c8ee8; margin-top: 8px; }
    .sub-label { font-size: 10px; color: #94a3b8; margin-left: 4px; }
    .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
    .summary-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; }
    .summary-card .s-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 4px; }
    .summary-card .s-value { font-size: 22px; font-weight: 700; color: #0c8ee8; }
    .meta { font-size: 11px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
    @media print {
      body { padding: 20px; }
      @page { margin: 15mm; }
    }
  </style>
</head>
<body>
  ${printRef.current.innerHTML}
  <script>window.onload = function(){ window.print(); window.close(); }<\/script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <>
      {/* Hidden printable content */}
      <div ref={printRef} style={{ display: "none" }}>
        <h1>Mono Carton Rate Quotation</h1>
        <p className="sub">
          {calcId ? "Ref: " + String(calcId) + "  ·  " : ""}
          {new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>

        <hr className="divider" />

        {/* ── INPUT SECTIONS ── */}
        <h2>Input Data</h2>

        {/* Sheet & Quantity */}
        <div className="input-block">
          <div className="input-block-title">
            Sheet &amp; Quantity Specifications
          </div>
          <div className="input-grid">
            <div className="input-item">
              <span className="input-label">Length (in)</span>
              <span className="input-value">{inputs.length}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Width (in)</span>
              <span className="input-value">{inputs.width}</span>
            </div>
            <div className="input-item">
              <span className="input-label">GSM</span>
              <span className="input-value">{inputs.gsm}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Paper Rate (₹/kg)</span>
              <span className="input-value">{inputs.paperRate}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Sheet Qty</span>
              <span className="input-value">{inputs.sheetQty}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Wastage (Shts)</span>
              <span className="input-value">{inputs.wastageShts}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Box / Sheet</span>
              <span className="input-value">{inputs.unitsPerSheet}</span>
            </div>
          </div>
        </div>

        {/* Plates & Normal Printing */}
        <div className="input-block">
          <div className="input-block-title">Plates &amp; Normal Printing</div>
          <div className="input-grid">
            <div className="input-item">
              <span className="input-label">No. of Plates</span>
              <span className="input-value">{inputs.noOfPlates}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Plate Rate (₹)</span>
              <span className="input-value">{inputs.plateRate}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Per Colour Cost (₹/1000)</span>
              <span className="input-value">{inputs.perColourCost}</span>
            </div>
            <div className="input-item">
              <span className="input-label">No. of Colours</span>
              <span className="input-value">{inputs.noOfColours}</span>
            </div>
          </div>
        </div>

        {/* Pantone */}
        <div className="input-block">
          <div className="input-block-title">Pantone Colour</div>
          <div className="input-grid cols-3">
            <div className="input-item">
              <span className="input-label">Rate of Ink (₹)</span>
              <span className="input-value">{inputs.rateOfInk}</span>
            </div>
            <div className="input-item">
              <span className="input-label">No. of Colours</span>
              <span className="input-value">{inputs.noOfPantoneColours}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Print Per Colour (₹/1000)</span>
              <span className="input-value">{inputs.printPerColour}</span>
            </div>
          </div>
        </div>

        {/* Die Section */}
        <div className="input-block">
          <div className="input-block-title">Die Section</div>
          <div className="input-grid cols-3">
            <div className="input-item">
              <span className="input-label">Die Cost (₹)</span>
              <span className="input-value">{inputs.dieCost}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Die Setting (₹)</span>
              <span className="input-value">{inputs.dieSetting}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Die Cutting (₹/1000)</span>
              <span className="input-value">{inputs.dieCutting}</span>
            </div>
          </div>
        </div>

        {/* Coating & Lamination */}
        <div className="input-block">
          <div className="input-block-title">Coating &amp; Lamination</div>
          <div className="input-grid">
            <div className="input-item">
              <span className="input-label">UV Coating</span>
              <span className="input-value">
                <span
                  className={`badge ${inputs.uvCoating ? "badge-on" : "badge-off"}`}
                >
                  {inputs.uvCoating ? "ON" : "OFF"}
                </span>
                {inputs.uvCoating && (
                  <span
                    style={{ marginLeft: 6, fontSize: 12, color: "#475569" }}
                  >
                    Rate: {inputs.uvCoatingRate}
                  </span>
                )}
              </span>
            </div>
            <div className="input-item">
              <span className="input-label">Drip Off</span>
              <span className="input-value">
                <span
                  className={`badge ${inputs.dripOff ? "badge-on" : "badge-off"}`}
                >
                  {inputs.dripOff ? "ON" : "OFF"}
                </span>
                {inputs.dripOff && (
                  <span
                    style={{ marginLeft: 6, fontSize: 12, color: "#475569" }}
                  >
                    Rate: {inputs.dripOffRate}
                  </span>
                )}
              </span>
            </div>
            <div className="input-item">
              <span className="input-label">Warnish</span>
              <span className="input-value">
                <span
                  className={`badge ${inputs.warnish ? "badge-on" : "badge-off"}`}
                >
                  {inputs.warnish ? "ON" : "OFF"}
                </span>
                {inputs.warnish && (
                  <span
                    style={{ marginLeft: 6, fontSize: 12, color: "#475569" }}
                  >
                    Rate: {inputs.warnishRate}
                  </span>
                )}
              </span>
            </div>
            <div className="input-item">
              <span className="input-label">Lamination</span>
              <span className="input-value">
                <span
                  className={`badge ${inputs.lamination ? "badge-on" : "badge-off"}`}
                >
                  {inputs.lamination ? "ON" : "OFF"}
                </span>
                {inputs.lamination && (
                  <span
                    style={{ marginLeft: 6, fontSize: 12, color: "#475569" }}
                  >
                    Rate: {inputs.laminationRate}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Mat Pack, Embossing, Leafing */}
        <div className="input-block">
          <div className="input-block-title">
            Mat Pack / Embossing / Leafing
          </div>
          <div className="input-grid">
            <div className="input-item">
              <span className="input-label">Mat Pack</span>
              <span className="input-value">
                <span
                  className={`badge ${inputs.includeMatPack ? "badge-on" : "badge-off"}`}
                >
                  {inputs.includeMatPack ? "ON" : "OFF"}
                </span>
              </span>
            </div>
            {inputs.includeMatPack && (
              <>
                <div className="input-item">
                  <span className="input-label">Mat Pack Lamination Rate</span>
                  <span className="input-value">
                    {inputs.matPackLaminationRate}
                  </span>
                </div>
                <div className="input-item">
                  <span className="input-label">Mat Pack Wastage</span>
                  <span className="input-value">{inputs.matPackWastage}</span>
                </div>
              </>
            )}
            <div className="input-item">
              <span className="input-label">Embossing</span>
              <span className="input-value">
                <span
                  className={`badge ${inputs.includeEmbossing ? "badge-on" : "badge-off"}`}
                >
                  {inputs.includeEmbossing ? "ON" : "OFF"}
                </span>
              </span>
            </div>
            {inputs.includeEmbossing && (
              <>
                <div className="input-item">
                  <span className="input-label">Embossing Block Cost (₹)</span>
                  <span className="input-value">
                    {inputs.embossingBlockCost}
                  </span>
                </div>
                <div className="input-item">
                  <span className="input-label">Embossing Per Box (₹)</span>
                  <span className="input-value">
                    {inputs.embossingPerBoxCost}
                  </span>
                </div>
              </>
            )}
            <div className="input-item">
              <span className="input-label">Leafing</span>
              <span className="input-value">
                <span
                  className={`badge ${inputs.includeLeafing ? "badge-on" : "badge-off"}`}
                >
                  {inputs.includeLeafing ? "ON" : "OFF"}
                </span>
              </span>
            </div>
            {inputs.includeLeafing && (
              <>
                <div className="input-item">
                  <span className="input-label">Leafing Block Cost (₹)</span>
                  <span className="input-value">{inputs.leafingBlockCost}</span>
                </div>
                <div className="input-item">
                  <span className="input-label">Leafing Per Box (₹)</span>
                  <span className="input-value">
                    {inputs.leafingPerBoxCost}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pasting */}
        <div className="input-block">
          <div className="input-block-title">Pasting</div>
          <div className="input-grid">
            <div className="input-item">
              <span className="input-label">Stipping (₹/1000)</span>
              <span className="input-value">{inputs.stipping}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Shorting (₹/1000)</span>
              <span className="input-value">{inputs.shorting}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Side Pasting (₹/1000)</span>
              <span className="input-value">{inputs.sidePasting}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Lock Bottom (₹/1000)</span>
              <span className="input-value">{inputs.lockBottom}</span>
            </div>
          </div>
        </div>

        {/* Packaging */}
        <div className="input-block">
          <div className="input-block-title">Packaging</div>
          <div className="input-grid cols-3">
            <div className="input-item">
              <span className="input-label">No. of Pkt</span>
              <span className="input-value">{inputs.noOfPkt}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Bag Rate (₹/pkt)</span>
              <span className="input-value">{inputs.bagRate}</span>
            </div>
            <div className="input-item">
              <span className="input-label">Box Rate (₹/pkt)</span>
              <span className="input-value">{inputs.boxRate}</span>
            </div>
          </div>
        </div>

        {/* Margins */}
        <div className="input-block">
          <div className="input-block-title">Margins &amp; Overheads</div>
          <div className="input-grid cols-2">
            <div className="input-item">
              <span className="input-label">CC &amp; PC Charges (%)</span>
              <span className="input-value">{inputs.ccPcChargesPercent}%</span>
            </div>
            <div className="input-item">
              <span className="input-label">Margin (%)</span>
              <span className="input-value">{inputs.marginPercent}%</span>
            </div>
          </div>
        </div>

        <hr className="divider" />
        <br />
        <br />
        <br />
        <br />

        {/* ── RESULTS ── */}
        <h2>Final Quotation</h2>

        {results.lineItems.map((item, i) =>
          item.isSectionHeader ? (
            <div key={i} className="row section-header">
              <span>{item.label}</span>
            </div>
          ) : (
            <div key={i} className={`row${item.isSubItem ? " sub-item" : ""}`}>
              <span>
                {item.label}
                {item.sublabel ? (
                  <span className="sub-label">({item.sublabel})</span>
                ) : (
                  ""
                )}
              </span>
              <span>{item.value > 0 ? fmt(item.value) : "—"}</span>
            </div>
          ),
        )}

        <hr className="divider" />
        <div className="row">
          <span>Total Sub-Cost</span>
          <span>
            <strong>{fmt(results.subTotal)}</strong>
          </span>
        </div>
        <div className="row">
          <span>No. of Boxes</span>
          <span>{results.totalUnits}</span>
        </div>
        <div className="row">
          <span>CC &amp; PC Charges ({inputs.ccPcChargesPercent}%)</span>
          <span>{fmt(results.ccPcCharges)}</span>
        </div>
        <div className="row">
          <span>Margin ({inputs.marginPercent}%)</span>
          <span>{fmt(results.margin)}</span>
        </div>
        <div className="row grand">
          <span>Grand Total</span>
          <span>{fmt(results.grandTotal)}</span>
        </div>

        <div className="summary">
          <div className="summary-card">
            <div className="s-label">Sheet Cost</div>
            <div className="s-value">{fmt(results.sheetCost)}</div>
          </div>
          <div className="summary-card">
            <div className="s-label">Cost per Box</div>
            <div className="s-value">{fmt(results.costPerUnit)}</div>
          </div>
        </div>

        <div className="meta">
          Generated by Printex · {new Date().toLocaleString("en-IN")}
        </div>
      </div>

      <button
        onClick={handlePrint}
        className="w-full flex items-center justify-center gap-2.5 bg-surface-900 hover:bg-surface-800 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
        🖨 Print / Export PDF
      </button>
    </>
  );
}

// ─── Report panel ─────────────────────────────────────────────────────────────
function Report({
  results,
  inputs,
  calcId,
  onReset,
}: {
  results: MonoCartonResults;
  inputs: MonoCartonInputs;
  calcId?: string;
  onReset: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="card p-3 sm:p-6">
        <h2 className="font-display font-700 text-xl text-surface-900 text-center mb-1">
          Final Quotation
        </h2>
        {/* <p className="text-xs text-brand-500 font-semibold text-center uppercase tracking-wide mb-5">
          {inputs.packagingFormat} packaging selected
        </p> */}

        <div className="space-y-0.5">
          {results.lineItems.map((item: MonoCartonLineItem, i: number) => {
            if (item.isSectionHeader) {
              return (
                <div key={i} className="pt-3 pb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-500">
                    {item.label}
                  </span>
                </div>
              );
            }
            return (
              <div
                key={i}
                className={`flex items-baseline justify-between py-1.5 ${
                  item.isSubItem ? "pl-4 text-surface-500" : "text-surface-800"
                }`}
              >
                <span className="text-sm">
                  {item.label}
                  {item.sublabel && (
                    <span className="text-xs text-surface-400 ml-1.5">
                      ({item.sublabel})
                    </span>
                  )}
                </span>
                <span
                  className={`font-mono text-sm font-500 ${item.value === 0 ? "text-surface-300" : ""}`}
                >
                  {item.value > 0 ? fmt(item.value) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="border-t border-surface-200 mt-3 pt-3 space-y-1.5">
          <div className="flex justify-between text-sm font-semibold text-surface-800">
            <span>Total Sub-Cost</span>
            <span className="font-mono">{fmt(results.subTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-surface-800">
            <span>No. of Boxes</span>
            <span className="font-mono">{results.totalUnits}</span>
          </div>
          <div className="flex justify-between text-sm text-surface-500">
            <span>CC &amp; PC Charges ({inputs.ccPcChargesPercent}%)</span>
            <span className="font-mono">{fmt(results.ccPcCharges)}</span>
          </div>
          <div className="flex justify-between text-sm text-surface-500">
            <span>Margin ({inputs.marginPercent}%)</span>
            <span className="font-mono">{fmt(results.margin)}</span>
          </div>
        </div>

        <div className="border-t-2 border-brand-400 mt-3 pt-3 flex justify-between items-baseline">
          <span className="font-display font-700 text-lg text-surface-900">
            Grand Total
          </span>
          <span className="font-display font-700 text-2xl text-brand-600">
            {fmt(results.grandTotal)}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-1">
            Sheet Cost
          </p>
          <p className="font-display font-700 text-xl text-surface-900">
            {fmt(results.sheetCost)}
          </p>
        </div>
        <div className="card p-4 border-brand-200 bg-brand-50">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-400 mb-1">
            Cost per {"Box"}
          </p>
          <p className="font-display font-700 text-xl text-brand-700">
            {fmt(results.costPerUnit)}
          </p>
        </div>
      </div>

      <PrintReport results={results} inputs={inputs} calcId={calcId} />

      <button onClick={onReset} className="w-full btn-outline text-sm py-2.5">
        ← New Calculation
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MonoCartonPage() {
  const { subscriptionStatus, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"input" | "report">("input");
  const [form, setForm] = useState<MonoCartonInputs>(DEFAULTS);
  const [results, setResults] = useState<MonoCartonResults | null>(null);
  const [calcId, setCalcId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = useCallback(
    <K extends keyof MonoCartonInputs>(key: K, val: MonoCartonInputs[K]) => {
      setForm((prev) => ({ ...prev, [key]: val }));
    },
    [],
  );

  useEffect(() => {
    const parser = localStorage.getItem("monoCartonRate") || "{}";
    const prevForm = JSON.parse(parser);
    if (parser != "{}") {
      console.log(form);
      setForm(prevForm);
    }
  }, []);

  const handleCalculate = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      localStorage.setItem("monoCartonRate", JSON.stringify(form));
      const res = await fetch("/api/mono-carton", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Calculation failed");
      setResults(data.data.results);
      setCalcId(data.data.calculation.id);
      setView("report");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setView("input");
    setResults(null);
    setCalcId(undefined);
    setError("");
  };

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

  const hasAccess = subscriptionStatus?.hasAccess ?? false;

  return (
    <AppLayout>
      <div className="p-3 sm:px-6 lg:py-8 pt-20 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-700 text-2xl text-surface-900">
              Mono Carton Rate
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">
              Full cost quotation calculator for mono carton packaging
            </p>
          </div>

          {/* Tab toggle (only when report is available) */}
          {results && (
            <div className="flex bg-surface-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setView("input")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === "input"
                    ? "bg-white shadow text-surface-900"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                Input Data
              </button>
              <button
                onClick={() => setView("report")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === "report"
                    ? "bg-white shadow text-surface-900"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                Final Report
              </button>
            </div>
          )}
        </div>

        {!hasAccess && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-700 font-medium">
              Trial expired — subscribe to use the calculator.
            </p>
            <button
              onClick={() => router.push("/pricing")}
              className="btn-primary text-sm py-2 px-4 flex-shrink-0"
            >
              View Plans →
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {view === "report" && results ? (
          <div className="max-w-2xl mx-auto animate-in">
            <Report
              results={results}
              inputs={form}
              calcId={calcId}
              onReset={handleReset}
            />
          </div>
        ) : (
          <div className="space-y-4 animate-in">
            {/* Sheet & Quantity */}
            <Section title="Sheet & Quantity Specifications">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field
                  label="Length (in)"
                  value={form.length}
                  onChange={(v) => set("length", v)}
                  step="0.1"
                />
                <Field
                  label="Width (in)"
                  value={form.width}
                  onChange={(v) => set("width", v)}
                  step="0.1"
                />
                <Field
                  label="GSM"
                  value={form.gsm}
                  onChange={(v) => set("gsm", v)}
                  step="1"
                />
                <Field
                  label="Paper Rate (₹/kg)"
                  value={form.paperRate}
                  onChange={(v) => set("paperRate", v)}
                />
                <Field
                  label="Sheet Qty"
                  value={form.sheetQty}
                  onChange={(v) => set("sheetQty", v)}
                  step="1"
                />
                <Field
                  label="Wastage (Shts)"
                  value={form.wastageShts}
                  onChange={(v) => set("wastageShts", v)}
                  step="1"
                />
                <Field
                  label="Box per Sheet"
                  value={form.unitsPerSheet}
                  onChange={(v) => set("unitsPerSheet", v)}
                  step="1"
                />
              </div>
            </Section>

            {/* Plates & Normal Printing */}
            <Section title="Plates & Normal Printing">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field
                  label="No. of Plates"
                  value={form.noOfPlates}
                  onChange={(v) => set("noOfPlates", v)}
                  step="1"
                />
                <Field
                  label="Plate Rate (₹)"
                  value={form.plateRate}
                  onChange={(v) => set("plateRate", v)}
                />
                <Field
                  label="Per Colour Cost (₹/1000)"
                  value={form.perColourCost}
                  onChange={(v) => set("perColourCost", v)}
                />
                <Field
                  label="No. of Colours"
                  value={form.noOfColours}
                  onChange={(v) => set("noOfColours", v)}
                  step="1"
                />
              </div>
            </Section>

            {/* Pantone */}
            <Section title="Pantone Colour">
              <label className="flex items-center gap-2.5 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.includePantone}
                  onChange={(e) => {
                    set("includePantone", e.target.checked);
                    set("rateOfInk", e.target.checked ? 1000 : 0);
                    set("noOfPantoneColours", e.target.checked ? 1 : 0);
                    set("printPerColour", e.target.checked ? 250 : 0);
                  }}
                  className="w-4 h-4 accent-brand-500"
                />
                <span className="text-sm font-semibold text-surface-700">
                  Include Pantone
                </span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field
                  label="Rate of Ink (₹)"
                  value={form.rateOfInk}
                  onChange={(v) => set("rateOfInk", v)}
                  disabled={!form.includePantone}
                />
                <Field
                  label="No. of Colours"
                  value={form.noOfPantoneColours}
                  onChange={(v) => set("noOfPantoneColours", v)}
                  step="1"
                  disabled={!form.includePantone}
                />
                <Field
                  label="Print Per Colour (₹/1000)"
                  value={form.printPerColour}
                  onChange={(v) => set("printPerColour", v)}
                  disabled={!form.includePantone}
                />
              </div>
            </Section>

            {/* Coating, Lamination & Wastage */}
            <Section title="Coating & Lamination">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    key: "uvCoating" as const,
                    rateKey: "uvCoatingRate" as const,
                    label: "UV Coating",
                  },
                  {
                    key: "dripOff" as const,
                    rateKey: "dripOffRate" as const,
                    label: "Drip Off",
                  },
                  {
                    key: "warnish" as const,
                    rateKey: "warnishRate" as const,
                    label: "Warnish",
                  },
                  {
                    key: "lamination" as const,
                    rateKey: "laminationRate" as const,
                    label: "Lamination",
                  },
                ].map(({ key, rateKey, label }) => (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      form[key]
                        ? "border-brand-300 bg-brand-50"
                        : "border-surface-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="coatingLamination"
                      checked={form[key] as boolean}
                      onChange={() => {
                        set("uvCoating", false as any);
                        set("dripOff", false as any);
                        set("warnish", false as any);
                        set("lamination", false as any);
                        set(key, true as any);
                      }}
                      className="w-4 h-4 accent-brand-500 flex-shrink-0"
                    />
                    <span className="text-sm font-medium text-surface-700 flex-1">
                      {label}
                    </span>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-surface-400 mr-1">
                        Rate
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="w-16 px-2 py-1 text-sm border border-surface-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400 disabled:opacity-40 disabled:cursor-not-allowed"
                        value={form[rateKey] as number}
                        disabled={!form[key]}
                        onChange={(e) =>
                          set(rateKey, parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Embossing & Leafing side by side */}
            <div className="grid md:grid-cols-3 gap-4">
              <Section title="Mat Pack">
                <label className="flex items-center gap-2.5 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.includeMatPack}
                    onChange={(e) => set("includeMatPack", e.target.checked)}
                    className="w-4 h-4 accent-brand-500"
                  />
                  <span className="text-sm font-semibold text-surface-700">
                    Include Mat Pack
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Lamination Rate (₹)"
                    value={form.matPackLaminationRate}
                    onChange={(v) => set("matPackLaminationRate", v)}
                  />
                  <Field
                    label="Wastage (%)"
                    value={form.matPackWastage}
                    onChange={(v) => set("matPackWastage", v)}
                    step="0.01"
                  />
                </div>
              </Section>

              <Section title="Leafing">
                <label className="flex items-center gap-2.5 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.includeLeafing}
                    onChange={(e) => set("includeLeafing", e.target.checked)}
                    className="w-4 h-4 accent-brand-500"
                  />
                  <span className="text-sm font-semibold text-surface-700">
                    Include Leafing
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Block Cost (₹)"
                    value={form.leafingBlockCost}
                    onChange={(v) => set("leafingBlockCost", v)}
                  />
                  <Field
                    label="Per Box Cost (Paise)"
                    value={form.leafingPerBoxCost}
                    onChange={(v) => set("leafingPerBoxCost", v)}
                    step="0.01"
                  />
                </div>
              </Section>
              <Section title="Embossing">
                <label className="flex items-center gap-2.5 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.includeEmbossing}
                    onChange={(e) => set("includeEmbossing", e.target.checked)}
                    className="w-4 h-4 accent-brand-500"
                  />
                  <span className="text-sm font-semibold text-surface-700">
                    Include Embossing
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Block Cost (₹)"
                    value={form.embossingBlockCost}
                    onChange={(v) => set("embossingBlockCost", v)}
                  />
                  <Field
                    label="Per Box Cost (Paise)"
                    value={form.embossingPerBoxCost}
                    onChange={(v) => set("embossingPerBoxCost", v)}
                    step="0.01"
                  />
                </div>
              </Section>
            </div>

            {/* Die Section */}
            <Section title="Die Section">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field
                  label="Die Cost (₹)"
                  value={form.dieCost}
                  onChange={(v) => set("dieCost", v)}
                />
                <Field
                  label="Die Setting (₹)"
                  value={form.dieSetting}
                  onChange={(v) => set("dieSetting", v)}
                />
                <Field
                  label="Die Cutting (₹/1000)"
                  value={form.dieCutting}
                  onChange={(v) => set("dieCutting", v)}
                />
              </div>
            </Section>

            {/* Pasting & Packing */}
            <Section title="Pasting">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <Field
                  label="Stipping (₹/1000)"
                  value={form.stipping}
                  onChange={(v) => set("stipping", v)}
                />
                <Field
                  label="Shorting (₹/1000)"
                  value={form.shorting}
                  onChange={(v) => set("shorting", v)}
                />
                <Field
                  label="Side Pasting (₹/1000)"
                  value={form.sidePasting}
                  onChange={(v) => set("sidePasting", v)}
                />
                <Field
                  label="Lock Bottom (₹/1000)"
                  value={form.lockBottom}
                  onChange={(v) => set("lockBottom", v)}
                />
              </div>
            </Section>

            <Section title="Packaging & Delivery">
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <Field
                  label="No. of Pkt"
                  value={form.noOfPkt}
                  onChange={(v) => set("noOfPkt", v)}
                  step="1"
                />
                <Field
                  label="Bag/Box Rate (₹/pkt)"
                  value={form.bagRate}
                  onChange={(v) => set("bagRate", v)}
                />
              </div>
            </Section>

            {/* Margins & Overheads */}
            <Section title="Margins & Overheads">
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <Field
                  label="CC & PC Charges (%)"
                  value={form.ccPcChargesPercent}
                  onChange={(v) => set("ccPcChargesPercent", v)}
                  step="0.1"
                />
                <Field
                  label="Margin (%)"
                  value={form.marginPercent}
                  onChange={(v) => set("marginPercent", v)}
                  step="0.1"
                />
              </div>
            </Section>

            {/* Calculate button */}
            <div className="flex gap-3 pt-1 pb-8">
              <button
                onClick={handleCalculate}
                disabled={isSubmitting || !hasAccess}
                className="btn-primary flex-1 py-3.5 text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
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
                  "Calculate Quotation"
                )}
              </button>
              <button
                onClick={() => {
                  setForm(DEFAULTS);
                  setError("");
                }}
                className="btn-secondary px-6"
                disabled={isSubmitting}
              >
                Reset All
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

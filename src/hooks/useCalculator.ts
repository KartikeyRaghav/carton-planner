"use client";

import { useState } from "react";
import { SheetLayout } from "@/types";

export interface SheetSizeForm {
  unit: "mm" | "inches";
  cartonStyle: "Self Lock" | "Both Side Tuck";
  length: string;
  width: string;
  height: string;
  pastingFlap: string;
  tuckInFlap: string;
  lockBottomMargin: string;
}

export interface CartonRateForm {
  length: string;
  width: string;
  height: string;
  gsm: string;
  rate: string;
}

const sheetSizeForm: SheetSizeForm = {
  unit: "mm",
  cartonStyle: "Self Lock",
  length: "118",
  width: "72",
  height: "72",
  pastingFlap: "10",
  tuckInFlap: "10",
  lockBottomMargin: "10",
};

export function useSheetSizeCalculator() {
  const [form, setForm] = useState<SheetSizeForm>(sheetSizeForm);
  const [results, setResults] = useState<SheetLayout[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof SheetSizeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const calculate = async () => {
    const {
      unit,
      cartonStyle,
      length,
      width,
      height,
      pastingFlap,
      tuckInFlap,
      lockBottomMargin,
    } = form;

    if (
      !length ||
      !width ||
      !height ||
      !pastingFlap ||
      !tuckInFlap ||
      (cartonStyle == "Self Lock" && !lockBottomMargin)
    ) {
      setError("Please fill in all fields");
      return;
    }

    localStorage.setItem("sheetSizeCalculator", JSON.stringify(form));

    const payload = {
      unit,
      cartonStyle,
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height),
      pastingFlap: parseFloat(pastingFlap),
      tuckInFlap: parseFloat(tuckInFlap),
      lockBottomMargin: parseFloat(lockBottomMargin),
    };

    if (Object.values(payload).some((v) => typeof v === "number" && isNaN(v))) {
      setError("All dimensions must be valid numbers");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sheetSizeCalculations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          setError(data.error + " Please upgrade your subscription.");
        } else {
          setError(data.error || "Calculation failed");
        }
        return;
      }

      setResults(data.data.calculation.results);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setForm(sheetSizeForm);
    setResults(null);
    setError(null);
  };

  return {
    form,
    setForm,
    results,
    isLoading,
    error,
    updateField,
    calculate,
    reset,
  };
}

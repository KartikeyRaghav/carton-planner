export type Unit = "mm" | "inches";
export type CartonStyle = "Self Lock" | "Both Side Tuck";

export interface CartonInputs {
  unit: Unit;
  cartonStyle: CartonStyle;
  length: number;
  width: number;
  height: number;
  pastingFlap: number;
  tuckInFlap: number;
  lockBottomMargin: number;
}

export interface SheetLayout {
  label: string;
  grid: string;
  length: number;
  width: number;
}

export interface CalculationResult {
  inputs: CartonInputs;
  layouts: SheetLayout[];
  unit: Unit;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Core carton sheet size calculation
 *
 * Self Lock / Tuck End / Snap Lock formula:
 *   Blank Width  = (2 × L) + (2 × W) + PF
 *   Blank Height = H + TF + TF  (top tuck + bottom tuck)
 *
 * Crash Lock / Seal End:
 *   Blank Width  = (2 × L) + (2 × W) + PF
 *   Blank Height = H + (0.5 × W) + TF + small allowance
 *
 * We return multiple layout options including grain directions.
 */
export function calculateCarton(inputs: CartonInputs): CalculationResult {
  const {
    unit,
    cartonStyle,
    length,
    width,
    height,
    pastingFlap,
    tuckInFlap,
    lockBottomMargin,
  } = inputs;

  // Convert all to mm for calculation
  let L = length;
  let W = width;
  let H = height;
  let PF = pastingFlap;
  let TF = tuckInFlap;
  let LBM = lockBottomMargin;

  // const L_mm = parseFloat(inputs.length) || 0;
  //       const W_mm = parseFloat(inputs.width) || 0;
  //       const H_mm = parseFloat(inputs.height) || 0;
  //       const PF_mm = parseFloat(inputs.pastingFlap) || 0;
  //       const TF_mm = parseFloat(inputs.tuckInFlap) || 0;

  //       if (L_mm <= 0 || W_mm <= 0 || H_mm <= 0) {
  //           setError('Length, Width, and Height must be greater than zero.');
  //           setResults([]);
  //           return;
  //       }
  //       setError('');

  //       let L = L_mm, W = W_mm, H = H_mm, PF = PF_mm, TF = TF_mm;
  const mmToInch = 1 / 25.4;

  if (unit === "mm") {
    L *= mmToInch;
    W *= mmToInch;
    H *= mmToInch;
    PF *= mmToInch;
    TF *= mmToInch;
    LBM *= mmToInch;
  }

  const MIN_DIM = 10;
  const L_MAX_DIM = 40;
  const W_MAX_DIM = 28;
  const possibleFits = new Map();

  const getAllFactors = (num: number) => {
    const factors = [];
    for (let i = 1; i <= num; i++) {
      if (num % i === 0) {
        factors.push([i, num / i]);
      }
    }
    return factors;
  };

  if (cartonStyle === "Self Lock") {
    const singleUnit = {
      length: 2 * L + 2 * W + PF,
      width: H + 1.5 * W + TF + LBM,
    };
    const pairUnit = {
      length: 2 * L + 2 * W + PF,
      width: 2 * H + 2 * W + TF + 2 * LBM,
    };

    for (let numBoxes = 1; numBoxes <= 40; numBoxes++) {
      const layoutsForN = [];
      const factors = getAllFactors(numBoxes);
      for (const [grid_i, grid_j] of factors) {
        const numPairs = Math.floor(grid_j / 2);
        const numSingles = grid_j % 2;
        const columnWidth =
          numPairs * pairUnit.width + numSingles * singleUnit.width;
        const sheetLength = grid_i * singleUnit.length;
        layoutsForN.push({
          grid: `${grid_i} x ${grid_j}`,
          length: sheetLength,
          width: columnWidth,
        });
      }

      const validLayouts = [];
      for (const layout of layoutsForN) {
        const finalLength = Math.max(layout.length, layout.width);
        const finalWidth = Math.min(layout.length, layout.width);
        if (
          finalLength <= L_MAX_DIM &&
          finalWidth <= W_MAX_DIM &&
          finalLength >= MIN_DIM &&
          finalWidth >= MIN_DIM
        ) {
          validLayouts.push({
            ...layout,
            length: finalLength,
            width: finalWidth,
          });
        }
      }
      if (validLayouts.length > 0) {
        const uniqueLayouts = Array.from(
          new Map(
            validLayouts.map((l) => [
              `${l.length.toFixed(2)}x${l.width.toFixed(2)}`,
              l,
            ]),
          ).values(),
        );
        possibleFits.set(numBoxes, uniqueLayouts);
      }
    }
  } else {
    // bothSideOpen
    const baseLength = (L + W) * 2 + PF;
    const baseWidth = H + 2 * (W + TF);
    const incrementalWidth = H + W + TF;

    const cumulativeWidths = new Map();
    cumulativeWidths.set(1, baseWidth);
    for (let i = 2; i <= 40; i++) {
      cumulativeWidths.set(i, cumulativeWidths.get(i - 1) + incrementalWidth);
    }

    for (let numBoxes = 1; numBoxes <= 40; numBoxes++) {
      const layoutsForN = [];
      const factors = getAllFactors(numBoxes);

      for (const [grid_i, grid_j] of factors) {
        // Grid i x j: i rows of j boxes
        const sheetLength = grid_i * baseLength;
        const sheetWidth = cumulativeWidths.get(grid_j);
        layoutsForN.push({
          grid: `${grid_i} x ${grid_j}`,
          length: sheetLength,
          width: sheetWidth,
        });
      }

      const validLayouts = [];
      for (const layout of layoutsForN) {
        const finalLength = Math.max(layout.length, layout.width);
        const finalWidth = Math.min(layout.length, layout.width);
        if (
          finalLength <= L_MAX_DIM &&
          finalWidth <= W_MAX_DIM &&
          finalLength >= MIN_DIM &&
          finalWidth >= MIN_DIM
        ) {
          validLayouts.push({
            ...layout,
            length: finalLength,
            width: finalWidth,
          });
        }
      }

      if (validLayouts.length > 0) {
        const uniqueLayouts = Array.from(
          new Map(
            validLayouts.map((l) => [
              `${l.length.toFixed(2)}x${l.width.toFixed(2)}`,
              l,
            ]),
          ).values(),
        );
        possibleFits.set(numBoxes, uniqueLayouts);
      }
    }
  }

  const sortedResults = Array.from(possibleFits.entries()).sort(
    (a, b) => a[0] - b[0],
  );

  let layouts: SheetLayout[] = [];
  sortedResults.forEach((result, i) => {
    result[1].forEach((r: SheetLayout) => {
      layouts.push({
        label: String(result[0]) + " ups",
        length: round2(r.length),
        width: round2(r.width),
        grid: r.grid,
      });
    });
  });

  // let blankWidth: number;
  // let blankHeight: number;

  // switch (cartonStyle) {
  //   case "Self Lock":
  //   case "Both Side Tuck":
  //   default: {
  //     blankWidth = 2 * L + 2 * W + PF;
  //     blankHeight = H + TF + TF;
  //   }
  // }

  // // Convert back to original unit if needed
  // const scale = unit === "inches" ? 1 / 25.4 : 1;
  // const bW = round2(blankWidth * scale);
  // const bH = round2(blankHeight * scale);

  // // Standard sheet sizes with small tolerance added (5mm or 0.2in)
  // const tolerance = unit === "inches" ? 0.2 : 5;

  // const layouts: SheetLayout[] = [
  //   {
  //     label: "Standard Sheet (Grain Long)",
  //     length: round2(bW + tolerance),
  //     width: round2(bH + tolerance),
  //   },
  //   {
  //     label: "Standard Sheet (Grain Short)",
  //     length: round2(bH + tolerance),
  //     width: round2(bW + tolerance),
  //   },
  //   {
  //     label: "Economy Layout (+2% trim)",
  //     length: round2((bW + tolerance) * 1.02),
  //     width: round2((bH + tolerance) * 1.02),
  //   },
  // ];

  // // Add a multi-up option if the sheet is not too large
  // const doubleUpW = round2(bW * 2 + tolerance * 3);
  // const doubleUpH = round2(bH + tolerance);
  // if (doubleUpW <= (unit === "inches" ? 50 : 1270)) {
  //   layouts.push({
  //     label: "2-Up Layout (Double Width)",
  //     length: doubleUpW,
  //     width: doubleUpH,
  //   });
  // }

  return { inputs, layouts, unit: "inches" };
}

export function formatValue(value: number, unit: Unit): string {
  return unit === "inches" ? `${value.toFixed(3)}"` : `${value.toFixed(1)} mm`;
}

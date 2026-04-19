export interface MonoCartonInputs {
  // Sheet & Quantity
  length: number;
  width: number;
  gsm: number;
  paperRate: number;
  sheetQty: number;
  wastageShts: number;
  unitsPerSheet: number;

  // Plates & Normal Printing
  noOfPlates: number;
  plateRate: number;
  perColourCost: number;
  noOfColours: number;

  // Pantone Colour
  includePantone: boolean;
  rateOfInk: number;
  noOfPantoneColours: number;
  printPerColour: number;

  // Coating, Lamination & Wastage
  uvCoating: boolean;
  uvCoatingRate: number;
  dripOff: boolean;
  dripOffRate: number;
  warnish: boolean;
  warnishRate: number;
  lamination: boolean;
  laminationRate: number;
  wastagePercent: number;

  // Die Section
  dieCost: number;
  dieSetting: number;
  dieCutting: number; // per 1000

  // Embossing
  includeEmbossing: boolean;
  embossingBlockCost: number;
  embossingPerBoxCost: number;

  includeMatPack: boolean;
  matPackLaminationRate: number;
  matPackWastage: number;

  // Leafing
  includeLeafing: boolean;
  leafingBlockCost: number;
  leafingPerBoxCost: number;

  // Pasting & Packing (all per 1000 unless noted)
  stipping: number;
  shorting: number;
  sidePasting: number;
  lockBottom: number;
  noOfPkt: number;
  bagRate: number;
  boxRate: number;

  // Margins & Overheads
  ccPcChargesPercent: number;
  marginPercent: number;
}

export interface MonoCartonLineItem {
  label: string;
  sublabel?: string;
  value: number;
  isSubItem?: boolean;
  isSectionHeader?: boolean;
  highlight?: boolean;
}

export interface MonoCartonResults {
  lineItems: MonoCartonLineItem[];
  totalSheets: number;
  subTotal: number;
  ccPcCharges: number;
  margin: number;
  grandTotal: number;
  sheetCost: number;
  costPerUnit: number;
  totalUnits: number;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateMonoCarton(inp: MonoCartonInputs): MonoCartonResults {
  const totalSheets = inp.sheetQty + inp.wastageShts;

  // ── 1. Cost of Paper ──────────────────────────────────────────────────────
  // Area of one sheet in sq inches → sq metres: (L × W) / 1550 (1 sq m = 1550 sq in approx)
  // Weight per sheet (kg) = area_sqm × gsm / 1000
  // Cost = weight × paper rate × total sheets
  const areaSqIn = inp.length * inp.width;
  const areaSqM = areaSqIn / 1550;
  const weightPerSheetKg = (areaSqM * inp.gsm) / 1000;
  const sheetRate = r2(weightPerSheetKg * inp.paperRate);
  const costOfPaper = r2(weightPerSheetKg * inp.paperRate * totalSheets);
  const noOfBoxes = inp.sheetQty * inp.unitsPerSheet;

  // ── 2. Cost of Plates ─────────────────────────────────────────────────────
  const costOfPlates = r2(inp.noOfPlates * inp.plateRate);

  // ── 3. Printing Cost (Normal) ─────────────────────────────────────────────
  const printingDetails = totalSheets < 1200 ? 1 : r2(totalSheets / 1000);
  const printingCost = r2(
    inp.perColourCost * inp.noOfColours * printingDetails,
  );

  // ── 4. Pantone ────────────────────────────────────────────────────────────
  const inkCostPantone = r2(inp.rateOfInk * inp.noOfPantoneColours);
  const printingCostPantone = r2(
    inp.printPerColour * inp.noOfPantoneColours * printingDetails,
  );

  // ── 5. Coatings ───────────────────────────────────────────────────────────
  // Each coating rate is per sq metre; total area = areaSqM × totalSheets
  // const totalAreaSqM = areaSqM * totalSheets;

  const coatingRate = inp.uvCoating
    ? inp.uvCoatingRate
    : inp.dripOff
      ? inp.dripOffRate
      : inp.warnish
        ? inp.warnishRate
        : inp.lamination
          ? inp.laminationRate
          : 0;

  const coatingCost =
    coatingRate > 0 ? (areaSqIn * totalSheets) / (coatingRate * 100) : 0;

  // const uvCoatingCost = inp.uvCoating
  //   ? r2(inp.uvCoatingRate * totalAreaSqM)
  //   : 0;
  // const dripOffCost = inp.dripOff ? r2(inp.dripOffRate * totalAreaSqM) : 0;
  // const warnishCost = inp.warnish ? r2(inp.warnishRate * totalAreaSqM) : 0;
  // const laminationCost = inp.lamination
  //   ? r2(inp.laminationRate * totalAreaSqM)
  //   : 0;

  // const coatingsSubTotal =
  //   uvCoatingCost + dripOffCost + warnishCost + laminationCost;

  // Wastage on coatings+paper sub

  // -- 6. Mat Pack Section ---------------------------------------------------
  const laminationCost = inp.includeMatPack
    ? r2(areaSqIn / (inp.matPackLaminationRate * 100))
    : 0;
  const totalLaminationCost = r2(laminationCost * totalSheets);
  const wastageCost = inp.includeMatPack
    ? r2(((costOfPaper + totalLaminationCost) * inp.matPackWastage) / 100)
    : 0;

  // ── 6. Die Section ────────────────────────────────────────────────────────
  // const totalBoxes = inp.sheetQty * inp.unitsPerSheet;
  // const dieCuttingCost = r2((inp.dieCutting * totalBoxes) / 1000);
  // const dieSectionTotal = r2(inp.dieCost + inp.dieSetting + dieCuttingCost);
  const dieCost = r2(
    inp.dieCost + inp.dieSetting + inp.dieCutting * printingDetails,
  );

  // ── 7. Embossing & Leafing ────────────────────────────────────────────────
  const embossingTotal = inp.includeEmbossing
    ? r2(inp.embossingBlockCost + inp.embossingPerBoxCost * noOfBoxes)
    : 0;
  const leafingTotal = inp.includeLeafing
    ? r2(inp.leafingBlockCost + inp.leafingPerBoxCost * noOfBoxes)
    : 0;

  // ── 8. Pasting & Packing ──────────────────────────────────────────────────
  const stippingCost = r2((inp.stipping * noOfBoxes) / 1000);
  const shortingCost = r2((inp.shorting * noOfBoxes) / 1000);
  const sidePastingCost = r2((inp.sidePasting * noOfBoxes) / 1000);
  const lockBottomCost = r2((inp.lockBottom * noOfBoxes) / 1000);
  const pastingCost = r2(
    stippingCost + shortingCost + sidePastingCost + lockBottomCost,
  );

  // Packing cost
  // const noOfBoxesForPacking = Math.ceil(totalBoxes / inp.noOfPkt);
  // const packingCost =
  //   inp.bagRate !== 0
  //     ? r2(noOfBoxesForPacking * inp.bagRate)
  //     : r2(noOfBoxesForPacking * inp.boxRate);
  const packingCost =
    inp.bagRate != 0 ? inp.noOfPkt * inp.bagRate : inp.noOfPkt * inp.boxRate;

  // ── 9. Sub-Total ──────────────────────────────────────────────────────────
  const subTotal = r2(
    costOfPaper +
      costOfPlates +
      printingCost +
      inkCostPantone +
      printingCostPantone +
      coatingCost +
      totalLaminationCost +
      wastageCost +
      dieCost +
      embossingTotal +
      leafingTotal +
      pastingCost +
      packingCost,
  );

  // ── 10. CC & PC + Margin ──────────────────────────────────────────────────
  const ccPcCharges = r2((subTotal * inp.ccPcChargesPercent) / 100);
  const baseForMargin = subTotal + ccPcCharges;
  const margin = r2((baseForMargin * inp.marginPercent) / 100);
  const grandTotal = r2(baseForMargin + margin);

  // ── 11. Per-unit costs ────────────────────────────────────────────────────
  const totalUnits = noOfBoxes;
  const sheetCost = inp.sheetQty > 0 ? r2(grandTotal / inp.sheetQty) : 0;
  const costPerUnit = noOfBoxes > 0 ? r2(grandTotal / noOfBoxes) : 0;

  // ── Build line items for the report ──────────────────────────────────────
  const lineItems: MonoCartonLineItem[] = [
    {
      label: `Sheet Rate`,
      value: sheetRate,
    },
    {
      label: `Cost of Paper`,
      sublabel: `${totalSheets} sheets`,
      value: costOfPaper,
    },
    // { label: `No of Boxes`, value: noOfBoxes },
    { label: "Cost of Plates", value: costOfPlates },
    { label: "Printing", value: 0, isSectionHeader: true },
    { label: "Printing Rate", value: printingDetails },
    { label: "Printing Cost", value: printingCost },
    ...(inp.includePantone
      ? [
          { label: "Pantone", value: 0, isSectionHeader: true },
          { label: "Ink Cost (Pantone)", value: inkCostPantone },
          { label: "Printing Cost (Pantone)", value: printingCostPantone },
        ]
      : []),
    { label: "Coating", value: 0, isSectionHeader: true },
    { label: "Coating Rate", value: coatingRate },
    { label: "Coating Cost", value: coatingCost },
    ...(inp.includeMatPack
      ? [
          { label: "Mat Pack", value: 0, isSectionHeader: true },
          { label: "Lamination Cost", value: laminationCost },
          { label: "Total Cost", value: totalLaminationCost },
        ]
      : []),
    {
      label: "Wastage",
      sublabel: `${inp.wastagePercent}%`,
      value: wastageCost,
    },
    { label: "Die Section Total", value: dieCost },
    ...(inp.includeEmbossing
      ? [{ label: "Embossing", value: embossingTotal }]
      : []),
    ...(inp.includeLeafing ? [{ label: "Leafing", value: leafingTotal }] : []),
    { label: "Pasting Cost", value: pastingCost },
    {
      label: "Packing Cost",
      sublabel: inp.bagRate != 0 ? "Bag" : "Box",
      value: packingCost,
    },
  ];

  return {
    lineItems,
    totalSheets,
    subTotal,
    ccPcCharges,
    margin,
    grandTotal,
    sheetCost,
    costPerUnit,
    totalUnits,
  };
}

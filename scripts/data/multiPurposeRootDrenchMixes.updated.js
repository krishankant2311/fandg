/**
 * MULTI-PURPOSE ROOT DRENCH mixes — CHEM MIX FORM (updated PDF).
 * OZ/TANK lines follow the client's "DRENCH #1 … DRENCH #7" formulation section.
 *
 * COST / PRICE: where the PDF omits exact price lines for this formulation (e.g. DRENCH #5),
 * totals use the same COST | PRICE ratio as PDF DRENCH #1 summary (cost 422.46 → price 994.92).
 */
const EPA_NA = "EPA not required";

const line = ({
  chemicalName,
  brandName,
  epaRegNo = "",
  type,
  quantity,
  costPerOz,
  priceMultiplier,
}) => {
  const qty = Number(quantity);
  const cpo = Number(costPerOz);
  const ppm = Number(priceMultiplier);
  const cost = Number((qty * cpo).toFixed(2));
  const pricePerOz = Number((cpo * ppm).toFixed(4));
  const price = Number((qty * pricePerOz).toFixed(2));
  return {
    chemicalName: chemicalName || brandName,
    brandName,
    epaRegNo,
    type,
    quantity: qty,
    measure: "OZ / 100 GAL",
    costPerOz: Number(cpo.toFixed(4)),
    pricePerOz,
    cost,
    price,
  };
};

// PDF DRENCH #1 — ratio from detailed cost summary
const R_MULT_D1 = 994.92 / 422.46;

// PDF DRENCH #4 summary
const R_MULT_D4 = 514.96 / 182.48;

// PDF DRENCH #6 summary
const R_MULT_D6 = 866.66 / 358.33;

// PDF DRENCH #7 summary
const R_MULT_D7 = 207.6 / 28.8;

// PDF DRENCH #3 summary (without Hydra line in cost table; ratio used when Hydra is in formulation)
const R_MULT_D3 = 1133.44 / 491.72;

const mixes = [
  {
    pdfOrder: 1,
    mixName: "DRENCH #1",
    notes: "MULTI-PURPOSE ROOT DRENCH — per CHEM MIX FORM (updated)",
    chemicals: [
      line({ brandName: "SAFARI", epaRegNo: "86203-11-59639", type: "INSECTICIDE", quantity: 32, costPerOz: 8.52, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "ZYPRO", epaRegNo: EPA_NA, type: "SOIL AMENDMENTS - ENZYMES", quantity: 20, costPerOz: 0.9, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "MEDALLION", epaRegNo: "67545-AZ-1", type: "FUNGICIDE ( FOR ROOT DISEASE )", quantity: 1, costPerOz: 22.0, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "SUBDUE MAX", epaRegNo: "100-796", type: "PREVENTATIVE FUNGICIDE", quantity: 1, costPerOz: 3.98, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "AXILO MIX 5 (QUICK GREEN)", epaRegNo: EPA_NA, type: "FERTILIZER - MINOR ELEMENTS", quantity: 24, costPerOz: 0.63, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "RENOVA", epaRegNo: EPA_NA, type: "FERTILIZER", quantity: 48, costPerOz: 0.55, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "KICKSTAND - RTU (NEW MATERIAL)", epaRegNo: EPA_NA, type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "HYDRA HUME (HUMIC ACID)", epaRegNo: EPA_NA, type: "FERTILIZER EFFICIENCY", quantity: 64, costPerOz: 0.75, priceMultiplier: R_MULT_D1 }),
    ],
  },
  {
    pdfOrder: 2,
    mixName: "DRENCH #2",
    notes: "CORON qty per formulation sheet (48 OZ/TANK)",
    chemicals: [
      line({ brandName: "ZYLAM", epaRegNo: "2217-937", type: "INSECTICIDE", quantity: 72, costPerOz: 3.44, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "MEDALLION", epaRegNo: "67545-AZ-1", type: "FUNGICIDE ( FOR ROOT DISEASE )", quantity: 1, costPerOz: 22.0, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "SUBDUE MAX", epaRegNo: "100-796", type: "PREVENTATIVE FUNGICIDE", quantity: 1, costPerOz: 3.98, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "AXILO MIX 5 (QUICK GREEN)", epaRegNo: EPA_NA, type: "FERTILIZER - MINOR ELEMENTS", quantity: 24, costPerOz: 0.63, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "CORON", epaRegNo: EPA_NA, type: "BASIC FERTILIZER", quantity: 48, costPerOz: 0.2, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "KICKSTAND - RTU (NEW MATERIAL)", epaRegNo: EPA_NA, type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "HYDRA HUME (HUMIC ACID)", epaRegNo: EPA_NA, type: "FERTILIZER EFFICIENCY", quantity: 64, costPerOz: 0.75, priceMultiplier: R_MULT_D3 }),
    ],
  },
  {
    pdfOrder: 3,
    mixName: "DRENCH #3",
    notes: "",
    chemicals: [
      line({ brandName: "ZYLAM", epaRegNo: "2217-937", type: "INSECTICIDE", quantity: 72, costPerOz: 3.44, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "PAGEANT", epaRegNo: "7969-251", type: "FUNGICIDE ( FOR ROOT DISEASE )", quantity: 16, costPerOz: 5.31, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "MEDALLION", epaRegNo: "67545-AZ-1", type: "FUNGICIDE ( FOR ROOT DISEASE )", quantity: 1, costPerOz: 22.0, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "HERITAGE - WETTABLE", epaRegNo: "100-1093", type: "ORNAMENTAL FUNGICIDE", quantity: 4, costPerOz: 19.81, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "AXILO MIX 5 (QUICK GREEN)", epaRegNo: EPA_NA, type: "FERTILIZER - MINOR ELEMENTS", quantity: 24, costPerOz: 0.63, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "RENOVA", epaRegNo: EPA_NA, type: "FERTILIZER", quantity: 48, costPerOz: 0.55, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "KICKSTAND - RTU (NEW MATERIAL)", epaRegNo: EPA_NA, type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51, priceMultiplier: R_MULT_D3 }),
      line({ brandName: "HYDRA HUME (HUMIC ACID)", epaRegNo: EPA_NA, type: "FERTILIZER EFFICIENCY", quantity: 64, costPerOz: 0.75, priceMultiplier: R_MULT_D3 }),
    ],
  },
  {
    pdfOrder: 4,
    mixName: "DRENCH #4",
    notes: "",
    chemicals: [
      line({ brandName: "RENOVA", epaRegNo: EPA_NA, type: "FERTILIZER", quantity: 48, costPerOz: 0.55, priceMultiplier: R_MULT_D4 }),
      line({ brandName: "KICKSTAND", epaRegNo: EPA_NA, type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51, priceMultiplier: R_MULT_D4 }),
      line({ brandName: "HERITAGE - WETTABLE", epaRegNo: "100-1093", type: "FUNGICIDE", quantity: 4, costPerOz: 22.94, priceMultiplier: R_MULT_D4 }),
      line({ brandName: "HYDRA HUME (HUMIC ACID)", epaRegNo: EPA_NA, type: "FERTILIZER EFFICIENCY", quantity: 64, costPerOz: 0.75, priceMultiplier: R_MULT_D4 }),
    ],
  },
  {
    pdfOrder: 5,
    mixName: "DRENCH #5",
    notes: "Cost/price markup uses DRENCH #1 PDF ratio where this formulation lacks a standalone cost-page block",
    chemicals: [
      line({ brandName: "SAFARI", epaRegNo: "86203-11-59639", type: "INSECTICIDE", quantity: 32, costPerOz: 8.52, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "ZYPRO", epaRegNo: EPA_NA, type: "SOIL AMENDMENTS - ENZYMES", quantity: 20, costPerOz: 0.9, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "RENOVA", epaRegNo: EPA_NA, type: "FERTILIZER", quantity: 48, costPerOz: 0.55, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "AXILO MIX 5 (QUICK GREEN)", epaRegNo: EPA_NA, type: "FERTILIZER - MINOR ELEMENTS", quantity: 24, costPerOz: 0.63, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "KICKSTAND", epaRegNo: EPA_NA, type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "HYDRA HUME (HUMIC ACID)", epaRegNo: EPA_NA, type: "FERTILIZER EFFICIENCY", quantity: 64, costPerOz: 0.75, priceMultiplier: R_MULT_D1 }),
      line({ brandName: "MYCO-SOL (1 POUCH PER 100 GL)", epaRegNo: EPA_NA, type: "FRIENDLY FUNGI", quantity: 12, costPerOz: 2.16, priceMultiplier: R_MULT_D1 }),
    ],
  },
  {
    pdfOrder: 6,
    mixName: "DRENCH #6",
    notes: "",
    chemicals: [
      line({ brandName: "SAFARI", epaRegNo: "86203-11-59639", type: "INSECTICIDE", quantity: 32, costPerOz: 8.52, priceMultiplier: R_MULT_D6 }),
      line({ brandName: "KICKSTAND", epaRegNo: EPA_NA, type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51, priceMultiplier: R_MULT_D6 }),
      line({ brandName: "MYCO-SOL (1 POUCH PER 100 GL)", epaRegNo: EPA_NA, type: "FRIENDLY FUNGI", quantity: 12, costPerOz: 2.16, priceMultiplier: R_MULT_D6 }),
      line({ brandName: "RENOVA", epaRegNo: EPA_NA, type: "FERTILIZER", quantity: 64, costPerOz: 0.55, priceMultiplier: R_MULT_D6 }),
      line({ brandName: "RECEPTOR", epaRegNo: "5905-594", type: "ROOT STIMULANT", quantity: 15, costPerOz: 0.55, priceMultiplier: R_MULT_D6 }),
    ],
  },
  {
    pdfOrder: 7,
    mixName: "DRENCH #7 (DROUGHT / SOAKER MIX)",
    notes: "",
    chemicals: [
      line({ brandName: "RENOVA", epaRegNo: EPA_NA, type: "FERTILIZER", quantity: 48, costPerOz: 0.55, priceMultiplier: R_MULT_D7 }),
      line({ brandName: "SOAKER (ONLY WHEN DRY)", epaRegNo: EPA_NA, type: "SOAK", quantity: 6, costPerOz: 0.4, priceMultiplier: R_MULT_D7 }),
    ],
  },
];

mixes.forEach((m) => {
  let tc = 0;
  let tp = 0;
  m.chemicals.forEach((c) => {
    tc += c.cost;
    tp += c.price;
  });
  m.totalCostPerTank = Number(tc.toFixed(2));
  m.totalPricePerTank = Number(tp.toFixed(2));
});

module.exports = { mixes };

/**
 * SOD SPRAY mixes #1–#5 — CHEM MIX FORM (client spreadsheet).
 * Price uses app rule: PRICE/OZ = 2 × COST/OZ (priceMultiplier = 2).
 */
const EPA_NA = "EPA not required";

const line = ({
  chemicalName,
  brandName,
  epaRegNo = EPA_NA,
  type,
  quantity,
  costPerOz,
  priceMultiplier = 2,
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

const mixes = [
  {
    pdfOrder: 8,
    mixName: "SOD SPRAY #1",
    notes: "Per CHEM MIX FORM — SOD SPRAY #1",
    chemicals: [
      line({ brandName: "RENOVA", type: "FERTILIZER", quantity: 48, costPerOz: 0.55 }),
      line({ brandName: "AXILO MIX (B)", type: "FERTILIZER - MINOR ELEMENTS", quantity: 24, costPerOz: 0.63 }),
      line({ brandName: "AXILO MIX (Fe)", type: "FERTILIZER - MINOR ELEMENTS", quantity: 24, costPerOz: 0.63 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 8, costPerOz: 0.63 }),
      line({ brandName: "BREXIL (MINOR ELEMENTS)", type: "NUTRITIONAL FERTILIZER", quantity: 24, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 9,
    mixName: "SOD SPRAY #2",
    notes: "Per CHEM MIX FORM — SOD SPRAY #2",
    chemicals: [
      line({ brandName: "CORON 28-0-0", type: "BASIC FERTILIZER", quantity: 320, costPerOz: 0.2 }),
      line({ brandName: "BREXIL (MINOR ELEMENTS)", type: "NUTRITIONAL FERTILIZER", quantity: 24, costPerOz: 0.63 }),
      line({ brandName: "COMPENDIUM", epaRegNo: "100-1540", type: "FUNGICIDE", quantity: 128, costPerOz: 2.21 }),
      line({ brandName: "CRITERION (1 POUCH PER 1000 GAL)", epaRegNo: "432-1318", type: "INSECTICIDE", quantity: 1.6, costPerOz: 1.76 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 10,
    mixName: "SOD SPRAY #3",
    notes: "Per CHEM MIX FORM — SOD SPRAY #3",
    chemicals: [
      line({ brandName: "ELE-MAX 0-0-25", type: "FERTILIZER", quantity: 48, costPerOz: 0.2 }),
      line({ brandName: "CRITERION (1 POUCH PER 1000 GAL)", epaRegNo: "432-1318", type: "INSECTICIDE", quantity: 1.6, costPerOz: 1.76 }),
      line({ brandName: "RENOVA", type: "FERTILIZER", quantity: 48, costPerOz: 0.55 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 8, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 11,
    mixName: "SOD SPRAY #4",
    notes: "Per CHEM MIX FORM — SOD SPRAY #4",
    chemicals: [
      line({ brandName: "CORON 28-0-0", type: "BASIC FERTILIZER", quantity: 320, costPerOz: 0.2 }),
      line({ brandName: "LEXICON", epaRegNo: "7969-350", type: "TURF FUNGICIDE (group 7 & 11)", quantity: 8, costPerOz: 30.0 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 8, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 12,
    mixName: "SOD SPRAY #5",
    notes: "Per CHEM MIX FORM — SOD SPRAY #5",
    chemicals: [
      line({ brandName: "CORON 28-0-0", type: "BASIC FERTILIZER", quantity: 320, costPerOz: 0.2 }),
      line({ brandName: "RENOVA", type: "FERTILIZER", quantity: 64, costPerOz: 0.55 }),
      line({ brandName: "RECEPTOR", epaRegNo: "5905-594", type: "ROOT STIMULANT", quantity: 15, costPerOz: 0.55 }),
      line({ brandName: "ACELEPRYN", epaRegNo: "100-1480", type: "TURF SYSTEMIC INSECTICIDE", quantity: 12, costPerOz: 6.25 }),
      line({ brandName: "ZYPRO", type: "SOIL AMENDMENT WITH ENZYMES", quantity: 12, costPerOz: 0.9 }),
      line({ brandName: "HERITAGE - WETTABLE", epaRegNo: "100-1093", type: "FUNGICIDE", quantity: 8, costPerOz: 22.94 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 4, costPerOz: 0.63 }),
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

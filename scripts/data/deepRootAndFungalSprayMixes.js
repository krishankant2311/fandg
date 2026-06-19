/**
 * DEEP ROOT INJECTION #1–#3 + FUNGAL SPRAY #1–#3 — client spreadsheet.
 * App price rule: PRICE/OZ = 2 × COST/OZ.
 */
const EPA_NA = "EPA not required";

const line = ({
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
    chemicalName: brandName,
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
    pdfOrder: 13,
    mixName: "DEEP ROOT INJECTION #1",
    chemicals: [
      line({ brandName: "HYDRA HUME (HUMIC ACID)", type: "FERTILIZER EFFICIENCY", quantity: 128, costPerOz: 0.2 }),
      line({ brandName: "KICKSTAND - RTU", type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51 }),
      line({ brandName: "MYCO-SOL (1 POUCH PER 1000 GAL)", type: "FRIENDLY FUNUS", quantity: 12, costPerOz: 2.16 }),
    ],
  },
  {
    pdfOrder: 14,
    mixName: "DEEP ROOT INJECTION #2",
    chemicals: [
      line({ brandName: "HYDRA HUME (HUMIC ACID)", type: "FERTILIZER EFFICIENCY", quantity: 128, costPerOz: 0.2 }),
      line({ brandName: "RENOVA", type: "FERTILIZER", quantity: 48, costPerOz: 0.55 }),
      line({ brandName: "MYCO-SOL (1 POUCH PER 1000 GAL)", type: "FRIENDLY FUNUS", quantity: 12, costPerOz: 2.16 }),
      line({ brandName: "KICKSTAND - RTU (NEW MATERIAL)", type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51 }),
    ],
  },
  {
    pdfOrder: 15,
    mixName: "DEEP ROOT INJECTION #3",
    chemicals: [
      line({ brandName: "HYDRA HUME (HUMIC ACID)", type: "FERTILIZER EFFICIENCY", quantity: 128, costPerOz: 0.2 }),
      line({ brandName: "CORON 28-0-0", type: "BASIC FERTILIZER", quantity: 192, costPerOz: 0.2 }),
      line({ brandName: "MYCO-SOL (1 POUCH PER 1000 GAL)", type: "FRIENDLY FUNUS", quantity: 12, costPerOz: 2.16 }),
      line({ brandName: "ZYPRO", type: "SOIL AMENDMENT WITH ENZYMES", quantity: 20, costPerOz: 0.9 }),
      line({ brandName: "AXILO MIX (5)", type: "FERTILIZER - MINOR ELEMENTS", quantity: 32, costPerOz: 0.94 }),
      line({ brandName: "KICKSTAND - RTU (NEW MATERIAL)", type: "ROOT STIMULATOR", quantity: 64, costPerOz: 0.51 }),
      line({ brandName: "NUCLUES", type: "POTASSIUM FERTILIZER", quantity: 192, costPerOz: 0.13 }),
    ],
  },
  {
    pdfOrder: 15.1,
    mixName: "DEEP ROOT INJECTION #3 (DAVEY TREE MIX)",
    chemicals: [
      line({ brandName: "HYDRA HUME ( HUMIC ACID )", type: "FERTILIZER EFFICIENCY", quantity: 128, costPerOz: 0.2 }),
      line({ brandName: "CORON 28-0-0", type: "BASIC FERTILIZER", quantity: 192, costPerOz: 0.16 }),
      line({ brandName: "MYCO-SOL (1 POUCH PER 100 GL)", type: "FRIENDLY FUNUS", quantity: 100, costPerOz: 0 }),
      line({ brandName: "MYCO-SOL (1 POUCH PER 1000 GAL)", type: "FRIENDLY FUNUS", quantity: 12, costPerOz: 1.83 }),
      line({ brandName: "ZYPRO", type: "SOIL AMENDMENT WITH ENZYMES", quantity: 20, costPerOz: 0.9 }),
      line({ brandName: "AXILO MIX ( 5 )", type: "FERTILIZER - MINOR ELEMENTS", quantity: 32, costPerOz: 0.94 }),
      line({ brandName: "KICKSTAND - RTU ( NEW MATERIAL )", type: "ROOT STIMULATOR", quantity: 64, costPerOz: 0.43 }),
      line({ brandName: "NUCLUES", type: "POTASSIUM FERTILIZER", quantity: 192, costPerOz: 0.13 }),
    ],
  },
  {
    pdfOrder: 16,
    mixName: "FUNGAL SPRAY #1",
    chemicals: [
      line({ brandName: "PAGEANT", epaRegNo: "7969-251", type: "FUNGICIDE (FOR ROOT DISEASE)", quantity: 16, costPerOz: 5.31 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 17,
    mixName: "FUNGAL SPRAY #2",
    chemicals: [
      line({ brandName: "SUBDUE MAX", epaRegNo: "100-796", type: "PREVENTATIVE FUNGICIDE", quantity: 5, costPerOz: 3.98 }),
      line({ brandName: "PAGEANT", epaRegNo: "7969-251", type: "FUNGICIDE (FOR ROOT DISEASE)", quantity: 16, costPerOz: 5.31 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 18,
    mixName: "FUNGAL SPRAY #3",
    chemicals: [
      line({ brandName: "LEXICON", epaRegNo: "7969-350", type: "TURF FUNGICIDE (group 7 & 11)", quantity: 8, costPerOz: 30.0 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 10, costPerOz: 0.63 }),
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
  m.notes = `Per CHEM MIX FORM — ${m.mixName}`;
});

const duplicateMixNamesToRetire = [
  "SUBDUE MAXSUBDUE MAXX",
  "INSCECTICIDE DRENCH #1",
];

module.exports = { mixes, duplicateMixNamesToRetire };

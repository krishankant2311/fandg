/**
 * FUNGAL SPRAY #4–#7, FUNGAL DRENCH #1–#3, INSECTICIDE DRENCH #1
 * Client CHEM MIX FORM — app price: 2 × COST/OZ.
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
    pdfOrder: 19,
    mixName: "FUNGAL SPRAY #4 ( SOD ONLY - CURATIVE )",
    chemicals: [
      line({ brandName: "COMPENDIUM", epaRegNo: "100-1540", type: "FUNGICIDE", quantity: 128, costPerOz: 2.21 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 20,
    mixName: "FUNGAL SPRAY #5 ( SOD ONLY - CURATIVE )",
    chemicals: [
      line({ brandName: "HEADWAY", epaRegNo: "100-1216", type: "TRUF FUNGICIDE (group 3 & 11)", quantity: 60, costPerOz: 4.19 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 21,
    mixName: "FUNGAL SPRAY #6 ( SOD / PLANTS / ORNIMENTALS )",
    chemicals: [
      line({ brandName: "HERITATAGE - WETTABLE", epaRegNo: "100-1093", type: "MULTI PURPOSE FUNGICIDE", quantity: 8, costPerOz: 22.94 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 22,
    mixName: "FUNGAL SPRAY #7 ( CURATIVE & PREVENTION - ANTHRACNOSE - RED OAKS )",
    chemicals: [
      line({ brandName: "CuPro", epaRegNo: "80289-2-67690", type: "TREE FUNGICIDE", quantity: 15, costPerOz: 1.5 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 23,
    mixName: "FUNGAL DRENCH #1",
    chemicals: [
      line({ brandName: "MEDALLION", epaRegNo: "67545-AZ-1", type: "FUNGICIDE", quantity: 1, costPerOz: 22.0 }),
      line({ brandName: "TERRAZOLE", epaRegNo: "400-416", type: "FUNGICIDE", quantity: 8, costPerOz: 0.93 }),
      line({ brandName: "HERITATAGE - WETTABLE", epaRegNo: "100-1093", type: "MULTI PURPOSE FUNGICIDE", quantity: 8, costPerOz: 22.94 }),
    ],
  },
  {
    pdfOrder: 24,
    mixName: "FUNGAL DRENCH #2",
    chemicals: [
      line({ brandName: "T-METHYL", epaRegNo: "228-626", type: "FUNGICIDE", quantity: 16, costPerOz: 0.1 }),
      line({ brandName: "SUBDUE MAXX", epaRegNo: "100-796", type: "PREVENTATIVE FUNGICIDE", quantity: 5, costPerOz: 3.98 }),
      line({ brandName: "KICKSTAND - RTU ( NEW MATERIAL )", type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51 }),
      line({ brandName: "HYDRA HUME ( HUMIC ACID )", type: "FERTILIZER EFFICIENCY", quantity: 64, costPerOz: 0.75 }),
    ],
  },
  {
    pdfOrder: 25,
    mixName: "FUNGAL DRENCH #3",
    chemicals: [
      line({ brandName: "PAGEANT", epaRegNo: "7969-251", type: "FUNGICIDE (FOR ROOT DISEASE)", quantity: 16, costPerOz: 5.31 }),
      line({ brandName: "HERITAGE - WETTABLE", epaRegNo: "100-1093", type: "FUNGICIDE", quantity: 4, costPerOz: 22.94 }),
      line({ brandName: "KICKSTAND - RTU ( NEW MATERIAL )", type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51 }),
      line({ brandName: "HYDRA HUME ( HUMIC ACID )", type: "FERTILIZER EFFICIENCY", quantity: 64, costPerOz: 0.75 }),
    ],
  },
  {
    pdfOrder: 26,
    mixName: "INSECTICIDE DRENCH #1",
    chemicals: [
      line({ brandName: "SAFARI", epaRegNo: "86203-11-59639", type: "INSECTICIDE", quantity: 16, costPerOz: 8.52 }),
      line({ brandName: "KICKSTAND - RTU ( NEW MATERIAL )", type: "ROOT STIMULATOR", quantity: 32, costPerOz: 0.51 }),
      line({ brandName: "HYDRA HUME ( HUMIC ACID )", type: "FERTILIZER EFFICIENCY", quantity: 64, costPerOz: 0.75 }),
    ],
  },
];

// Duplicate bare-name entries to soft-delete after upsert
const duplicateMixNamesToRetire = [
  "FUNGAL SPRAY #5",
  "FUNGAL SPRAY #7",
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

module.exports = { mixes, duplicateMixNamesToRetire };

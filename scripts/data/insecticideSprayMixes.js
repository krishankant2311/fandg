/**
 * INSECTICIDE-GRUB SPRAY #1, INSECTICIDE SPRAY #2, INSECTICIDE SPRAY #3
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
    pdfOrder: 27,
    mixName: "INSECTICIDE-GRUB SPRAY #1",
    chemicals: [
      line({ brandName: "DYLOX", epaRegNo: "5481-543-432", type: "INSECTICIDE - GRUBS", quantity: 138, costPerOz: 0.8 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 8, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 28,
    mixName: "INSECTICIDE SPRAY #2",
    chemicals: [
      line({ brandName: "CRITERION (1 POUCH PER 100GL)", epaRegNo: "432-1318", type: "INSECTICIDE", quantity: 1.6, costPerOz: 1.76 }),
      line({ brandName: "TALSTAR", epaRegNo: "279-3206", type: "INSECTICIDE (NOT GOOD ON SCALE)", quantity: 10, costPerOz: 0.42 }),
      line({ brandName: "JOINT VENTURE", type: "FOLIAR PENETRATION", quantity: 5, costPerOz: 0.55 }),
    ],
  },
  {
    pdfOrder: 29,
    mixName: "INSECTICIDE SPRAY #3",
    chemicals: [
      line({ brandName: "CRITERION (1 POUCH PER 100GL)", epaRegNo: "432-1318", type: "INSECTICIDE", quantity: 1.6, costPerOz: 1.76 }),
      line({ brandName: "SAFARI", epaRegNo: "86203-11-59639", type: "INSECTICIDE", quantity: 32, costPerOz: 8.52 }),
      line({ brandName: "TALSTAR", epaRegNo: "279-3206", type: "INSECTICIDE (NOT GOOD ON SCALE)", quantity: 10, costPerOz: 0.42 }),
      line({ brandName: "JOINT VENTURE", type: "FOLIAR PENETRATION", quantity: 5, costPerOz: 0.42 }),
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

module.exports = { mixes };

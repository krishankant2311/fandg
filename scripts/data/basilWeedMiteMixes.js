/**
 * SAFARI/ZYLAM BASIL, BORE, DORMANT, WEED #1/#2, PRE-EMERGENT, MITE, MOSQUITO
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
    pdfOrder: 30,
    mixName: "SAFARI BASIL SPRAY",
    chemicals: [
      line({ brandName: "SAFARI", epaRegNo: "86203-11-59639", type: "INSECTICIDE", quantity: 30, costPerOz: 6.91 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 31,
    mixName: "ZYLAM BASIL SPRAY",
    chemicals: [
      line({ brandName: "ZYLAM", epaRegNo: "2217-937", type: "INSECTICIDE", quantity: 60, costPerOz: 3.44 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 32,
    mixName: "BORE SPRAY ( BASIL APPLICATION )",
    chemicals: [
      line({ brandName: "ONYX", epaRegNo: "279-3177", type: "INSECTICIDE - OIL BASE", quantity: 32, costPerOz: 6.36 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 5, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 33,
    mixName: "DORMANT SPRAY ( COLD ) > 75 DEGREES",
    chemicals: [
      line({ brandName: "DORMANT OIL - DARMOIL", type: "INSECTICIDE - SUFFOCANT", quantity: 128, costPerOz: 0.1 }),
    ],
  },
  {
    pdfOrder: 34,
    mixName: 'WEED SPRAY #1 "POST IMERGENT"( SEDGE & GRASSY )',
    chemicals: [
      line({ brandName: "CELSIUS", epaRegNo: "432-1507", type: "GRASSY WEED CONTROL", quantity: 0.17, costPerOz: 8.76 }),
      line({ brandName: "CERTAINTY", epaRegNo: "524-534", type: "SEDGE & BROAD LEAF WEED CONTROL", quantity: 0.01, costPerOz: 77.64 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 0.25, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 35,
    mixName: 'WEED SPRAY #2 "POST IMERGENT"( SEDGE, GRASSY & VINE LIKE WEEDS )',
    chemicals: [
      line({ brandName: "MSM", epaRegNo: "83851-3", type: "BROAD SPECTRUM WEED CONTROL", quantity: 0.06, costPerOz: 10.2 }),
      line({ brandName: "CELSIUS", epaRegNo: "432-1507", type: "GRASSY WEED CONTROL", quantity: 0.17, costPerOz: 8.76 }),
      line({ brandName: "CERTAINTY", epaRegNo: "524-534", type: "SEDGE & BROAD LEAF WEED CONTROL", quantity: 0.01, costPerOz: 77.64 }),
      line({ brandName: "KINETIC", type: "FOLIAR PENTRATION", quantity: 0.25, costPerOz: 0.63 }),
    ],
  },
  {
    pdfOrder: 36,
    mixName: "PRE-EMERGENT SPRAY #1 HERBICIDE SPRAY",
    chemicals: [
      line({ brandName: "SPECTICLE", epaRegNo: "432-1508", type: "HERBICIDE", quantity: 4, costPerOz: 12.5 }),
      line({ brandName: "TRIBUTE", epaRegNo: "432-1519", type: "HERBICIDE", quantity: 1, costPerOz: 67.55 }),
    ],
  },
  {
    pdfOrder: 37,
    mixName: "MITE SPRAY ( SPRAY APPLICATION )",
    chemicals: [
      line({ brandName: "AVID", epaRegNo: "100-1492", type: "MITICIDE", quantity: 5, costPerOz: 6.06 }),
      line({ brandName: "JOINT VENTURE", type: "FOLIAR PENETRATION", quantity: 5, costPerOz: 0.42 }),
    ],
  },
  {
    pdfOrder: 38,
    mixName: "MOSQUITO CONTROL (MISTING SYSTEM)",
    chemicals: [
      line({
        brandName: "SECTOR (Permethrin 10%, Piperonyl butoxide 10%)",
        type: "INSECTICIDE - CHEMICAL PLANT DERIVATIVE",
        quantity: 64,
        costPerOz: 0.72,
      }),
    ],
  },
];

const duplicateMixNamesToRetire = [
  "BORE SPRAY",
  "DORMANT SPRAY",
  "MITE SPRAY",
  "MOSQUITO CONTROL (FOGGING)",
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

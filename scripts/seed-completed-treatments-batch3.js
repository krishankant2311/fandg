/* eslint-disable no-console */
/**
 * Import completed treatments (sheet 2) — batch 3
 * Usage: node scripts/seed-completed-treatments-batch3.js
 */
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const ChemicalCustomer = require("../modules/ChemicalMaintenance/Model/customerModel");
const OtherTreatment = require("../modules/ChemicalMaintenance/Model/otherTreatmentModel");

const OSMOCOTE = "OSMOCOTE FERTILIZER (PER 40LBS. BAG)";

function parseDMY(value) {
  const parts = String(value).trim().split("/");
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);
  if (!day || !month || !year) return null;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function money(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function annualCompleted({ date, qty, lineTotal }) {
  const d = parseDMY(date);
  return {
    name: OSMOCOTE,
    quantity: qty,
    scheduleDates: [d],
    scheduleDate: d,
    price: money(lineTotal),
    cost: 0,
    status: "Completed",
  };
}

function otherCompleted({ treatment, date, qty, lineTotal }) {
  const d = parseDMY(date);
  const q = Number(qty) || 0;
  const total = money(lineTotal);
  return {
    treatment,
    qty: q,
    date: d,
    totalPricePerTank: q > 0 ? money(total / q) : total,
    totalCostPerTank: 0,
    status: "Completed",
  };
}

const CUSTOMERS = [
  {
    customerName: "GRAY, TONY",
    contractTotal: 2816.0,
    materialsUsedToDate: 2233.27,
    completedAnnual: [],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "15/4/2026", qty: 2, lineTotal: 1889.84 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "15/4/2026", qty: 0.4, lineTotal: 343.43 }),
    ],
  },
  {
    customerName: "HINES PIERCE, LAURA",
    contractTotal: 9611.0,
    materialsUsedToDate: 3187.66,
    completedAnnual: [],
    completedOther: [
      otherCompleted({ treatment: "SOD SPRAY #4", date: "23/5/2026", qty: 3, lineTotal: 2154.24 }),
      otherCompleted({ treatment: "DEEP ROOT TREATMENT", date: "23/5/2026", qty: 1, lineTotal: 913.88 }),
      otherCompleted({ treatment: "INSECTICIDE SPRAY #2", date: "23/5/2026", qty: 1, lineTotal: 119.54 }),
    ],
  },
  {
    customerName: "MACKEY, BARBARA",
    contractTotal: 2863.0,
    materialsUsedToDate: 1570.35,
    completedAnnual: [
      annualCompleted({ date: "19/2/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "20/4/2026", qty: 1, lineTotal: 944.92 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "20/4/2026", qty: 0.4, lineTotal: 343.43 }),
    ],
  },
  {
    customerName: "MAKRIS, JUSTIN",
    contractTotal: 2141.0,
    materialsUsedToDate: 1515.21,
    completedAnnual: [
      annualCompleted({ date: "18/2/2026", qty: 1, lineTotal: 141.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "SOD SPRAY #5", date: "4/3/2026", qty: 0.5, lineTotal: 429.29 }),
      otherCompleted({ treatment: "DRENCH #1", date: "12/5/2026", qty: 1, lineTotal: 944.92 }),
    ],
  },
  {
    customerName: "MILLER, ADAM & RUTHIE",
    contractTotal: 11109.96,
    materialsUsedToDate: 7428.76,
    completedAnnual: [
      annualCompleted({ date: "25/2/2026", qty: 5, lineTotal: 705.0 }),
      annualCompleted({ date: "4/3/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "17/2/2026", qty: 3, lineTotal: 2834.76 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "13/4/2026", qty: 2, lineTotal: 1717.16 }),
      otherCompleted({ treatment: "DRENCH #1", date: "15/4/2026", qty: 2, lineTotal: 1889.84 }),
    ],
  },
  {
    customerName: "MILLER, ADAM & SARA",
    contractTotal: 2559.96,
    materialsUsedToDate: 2453.84,
    completedAnnual: [
      annualCompleted({ date: "11/2/2026", qty: 2, lineTotal: 282.0 }),
      annualCompleted({ date: "18/2/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "20/2/2026", qty: 2, lineTotal: 1889.84 }),
    ],
  },
  {
    customerName: "NASH, JOHN",
    contractTotal: 7764.0,
    materialsUsedToDate: 2601.13,
    completedAnnual: [
      annualCompleted({ date: "13/2/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "31/3/2026", qty: 2, lineTotal: 1889.84 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "13/4/2026", qty: 0.5, lineTotal: 429.29 }),
    ],
  },
  {
    customerName: "OBULANEY, DIANA",
    contractTotal: 2473.0,
    materialsUsedToDate: 352.5,
    completedAnnual: [
      annualCompleted({ date: "11/2/2026", qty: 1, lineTotal: 141.0 }),
      annualCompleted({ date: "18/2/2026", qty: 1.5, lineTotal: 211.5 }),
    ],
    completedOther: [],
  },
  {
    customerName: "PARMAR, SUNIL",
    contractTotal: 4158.0,
    materialsUsedToDate: 2410.67,
    completedAnnual: [
      annualCompleted({ date: "13/2/2026", qty: 2, lineTotal: 282.0 }),
      annualCompleted({ date: "27/2/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "18/2/2026", qty: 1.5, lineTotal: 1417.38 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "13/4/2026", qty: 0.5, lineTotal: 429.29 }),
    ],
  },
  {
    customerName: "PAPPERT, MEGAN & KASE",
    contractTotal: 2245.5,
    materialsUsedToDate: 528.69,
    completedAnnual: [
      annualCompleted({ date: "24/3/2026", qty: 0.5, lineTotal: 70.5 }),
      annualCompleted({ date: "26/5/2026", qty: 1, lineTotal: 141.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "SOD SPRAY #5", date: "14/4/2026", qty: 0.3, lineTotal: 317.19 }),
    ],
  },
  {
    customerName: "REIZEN, RENNE",
    contractTotal: 2294.0,
    materialsUsedToDate: 1656.21,
    completedAnnual: [
      annualCompleted({ date: "25/2/2026", qty: 1, lineTotal: 141.0 }),
      annualCompleted({ date: "27/5/2026", qty: 1, lineTotal: 141.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "SOD SPRAY #5", date: "13/4/2026", qty: 0.5, lineTotal: 429.29 }),
      otherCompleted({ treatment: "DRENCH #1", date: "15/4/2026", qty: 1, lineTotal: 944.92 }),
    ],
  },
  {
    customerName: "SIEGEL, ADAM & KIMBERLY",
    contractTotal: 2530.0,
    materialsUsedToDate: 1656.21,
    completedAnnual: [
      annualCompleted({ date: "19/2/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "16/2/2026", qty: 1, lineTotal: 944.92 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "13/4/2026", qty: 0.5, lineTotal: 429.29 }),
    ],
  },
  {
    customerName: "SMITH, PLINY",
    contractTotal: 2210.0,
    materialsUsedToDate: 282.0,
    completedAnnual: [
      annualCompleted({ date: "29/4/2026", qty: 1, lineTotal: 141.0 }),
      annualCompleted({ date: "13/5/2026", qty: 1, lineTotal: 141.0 }),
    ],
    completedOther: [],
  },
  {
    customerName: "SMITH, SANDRA",
    contractTotal: 4465.5,
    materialsUsedToDate: 3437.97,
    completedAnnual: [
      annualCompleted({ date: "10/2/2026", qty: 2, lineTotal: 282.0 }),
      annualCompleted({ date: "17/2/2026", qty: 1, lineTotal: 141.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1 + PAGEANT", date: "7/1/2026", qty: 1, lineTotal: 695.84 }),
      otherCompleted({ treatment: "DRENCH #1 + PAGEANT", date: "11/2/2026", qty: 2, lineTotal: 1889.84 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "20/4/2026", qty: 0.5, lineTotal: 429.29 }),
    ],
  },
  {
    customerName: "STEPANIAN, ANDY & LIZ",
    contractTotal: 15685.0,
    materialsUsedToDate: 11615.1,
    completedAnnual: [
      annualCompleted({ date: "29/1/2026", qty: 7, lineTotal: 987.0 }),
      annualCompleted({ date: "19/3/2026", qty: 7, lineTotal: 987.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DORMANT SPRAY", date: "2/2/2026", qty: 1, lineTotal: 125.6 }),
      otherCompleted({ treatment: "DRENCH #1", date: "19/2/2026", qty: 6, lineTotal: 5669.52 }),
      otherCompleted({ treatment: "FUNGAL SPRAY #3 + HEADWAY", date: "1/4/2026", qty: 1, lineTotal: 1095.4 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "13/4/2026", qty: 2, lineTotal: 1717.16 }),
      otherCompleted({ treatment: "DEEP ROOT TREATMENT", date: "18/5/2026", qty: 1, lineTotal: 913.88 }),
    ],
  },
];

async function buildDefaultAnnualRows() {
  const catalog = await OtherTreatment.find({
    status: "Active",
    programType: "annual_program",
  })
    .sort({ sortOrder: 1 })
    .lean();

  return catalog.map((item) => ({
    name: item.treatmentName,
    quantity: 0,
    scheduleDates: [],
    price: 0,
    cost: 0,
    status: "",
  }));
}

(async () => {
  await connectDB();
  const defaultAnnual = await buildDefaultAnnualRows();
  let ok = 0;
  let missing = 0;

  for (const row of CUSTOMERS) {
    const customer = await ChemicalCustomer.findOne({
      status: "Active",
      customerName: row.customerName,
    });

    if (!customer) {
      console.warn("NOT FOUND:", row.customerName);
      missing += 1;
      continue;
    }

    await ChemicalCustomer.updateOne(
      { _id: customer._id },
      {
        $set: {
          contractTotal: row.contractTotal,
          materialsUsedToDate: row.materialsUsedToDate,
          annualTreatments: [...defaultAnnual, ...row.completedAnnual],
          otherTreatments: [...row.completedOther],
        },
      }
    );

    const calcUsedAnnual = row.completedAnnual.reduce((s, t) => s + t.price, 0);
    const calcUsedOther = row.completedOther.reduce(
      (s, t) => s + t.qty * t.totalPricePerTank,
      0
    );
    const calcUsed = money(calcUsedAnnual + calcUsedOther);

    console.log(
      `${row.customerName} | contract=$${row.contractTotal.toFixed(2)} | used=$${row.materialsUsedToDate.toFixed(2)} (calc $${calcUsed.toFixed(2)}) | remaining=$${money(row.contractTotal - row.materialsUsedToDate).toFixed(2)}`
    );
    ok += 1;
  }

  console.log(`\nUpdated: ${ok}, Missing: ${missing}`);
  await mongoose.connection.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

/* eslint-disable no-console */
/**
 * Import completed treatments (sheet 2) — batch 4 (final)
 * Usage: node scripts/seed-completed-treatments-batch4.js
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
    customerName: "STUBBE, MARK",
    contractTotal: 3876.0,
    materialsUsedToDate: 1063.79,
    completedAnnual: [
      annualCompleted({ date: "18/2/2026", qty: 2, lineTotal: 282.0 }),
      annualCompleted({ date: "25/2/2026", qty: 2, lineTotal: 282.0 }),
      annualCompleted({ date: "4/3/2026", qty: 0.5, lineTotal: 70.5 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "SOD SPRAY #5", date: "4/3/2026", qty: 0.5, lineTotal: 429.29 }),
    ],
  },
  {
    customerName: "STUCKEY, CAMILLE",
    contractTotal: 5417.0,
    materialsUsedToDate: 3024.13,
    completedAnnual: [
      annualCompleted({ date: "6/2/2026", qty: 2, lineTotal: 282.0 }),
      annualCompleted({ date: "13/2/2026", qty: 3, lineTotal: 423.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "20/2/2026", qty: 1, lineTotal: 944.92 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "4/3/2026", qty: 0.5, lineTotal: 429.29 }),
      otherCompleted({ treatment: "DRENCH #1", date: "12/5/2026", qty: 1, lineTotal: 944.92 }),
    ],
  },
  {
    customerName: "SWAN, MIKE & CAREY",
    contractTotal: 1376.0,
    materialsUsedToDate: 1367.92,
    completedAnnual: [
      annualCompleted({ date: "13/2/2026", qty: 1, lineTotal: 141.0 }),
      annualCompleted({ date: "20/2/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "24/2/2026", qty: 1, lineTotal: 944.92 }),
    ],
  },
  {
    customerName: "TRAN, DENNIS",
    contractTotal: 2757.04,
    materialsUsedToDate: 1656.21,
    completedAnnual: [
      annualCompleted({ date: "13/2/2026", qty: 1, lineTotal: 141.0 }),
      annualCompleted({ date: "20/2/2026", qty: 1, lineTotal: 141.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "18/2/2026", qty: 1, lineTotal: 944.92 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "13/4/2026", qty: 0.5, lineTotal: 429.29 }),
    ],
  },
  {
    customerName: "TRIMBLE, JIM",
    contractTotal: 1528.0,
    materialsUsedToDate: 0,
    completedAnnual: [],
    completedOther: [],
  },
  {
    customerName: "VERDUCCI, FRANK",
    contractTotal: 2259.96,
    materialsUsedToDate: 2171.84,
    completedAnnual: [
      annualCompleted({ date: "19/2/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "16/2/2026", qty: 2, lineTotal: 1889.84 }),
    ],
  },
  {
    customerName: "WALLACE, MOLLIE",
    contractTotal: 7286.0,
    materialsUsedToDate: 2954.85,
    completedAnnual: [
      annualCompleted({ date: "17/2/2026", qty: 4, lineTotal: 564.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "12/2/2026", qty: 2, lineTotal: 1889.84 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "4/3/2026", qty: 0.5, lineTotal: 429.29 }),
      otherCompleted({ treatment: "INSECTICIDE SPRAY #2", date: "4/3/2026", qty: 0.5, lineTotal: 59.77 }),
      otherCompleted({ treatment: "INSECTICIDE SPRAY #2", date: "1/4/2026", qty: 0.1, lineTotal: 11.95 }),
    ],
  },
  {
    customerName: "WILSON AIR",
    contractTotal: 5595.0,
    materialsUsedToDate: 780.6,
    completedAnnual: [
      annualCompleted({ date: "9/2/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: 'PENTA 4"', date: "1/6/2026", qty: 180, lineTotal: 498.6 }),
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

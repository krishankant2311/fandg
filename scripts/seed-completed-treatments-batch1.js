/* eslint-disable no-console */
/**
 * Import completed treatments (sheet 2) — batch 1: BEVERS, BRESNER, BROGDON
 * Usage: node scripts/seed-completed-treatments-batch1.js
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
    customerName: "BEVERS, DIANE",
    contractTotal: 3056.96,
    materialsUsedToDate: 1585.71,
    completedAnnual: [
      annualCompleted({ date: "6/2/2026", qty: 0.5, lineTotal: 70.5 }),
      annualCompleted({ date: "13/2/2026", qty: 1, lineTotal: 141.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "SOD SPRAY #5", date: "13/4/2026", qty: 0.5, lineTotal: 429.29 }),
      otherCompleted({ treatment: "DRENCH #1", date: "15/4/2026", qty: 1, lineTotal: 944.92 }),
    ],
  },
  {
    customerName: "BRESNER, BOBBY",
    contractTotal: 2263.0,
    materialsUsedToDate: 1343.49,
    completedAnnual: [
      annualCompleted({ date: "18/2/2026", qty: 1, lineTotal: 141.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "15/4/2026", qty: 1, lineTotal: 944.92 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "15/4/2026", qty: 0.3, lineTotal: 257.57 }),
    ],
  },
  {
    customerName: "BROGDON, MATHEW",
    contractTotal: 3923.0,
    materialsUsedToDate: 2965.41,
    completedAnnual: [
      annualCompleted({ date: "13/2/2026", qty: 0.5, lineTotal: 70.5 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "18/12/2025", qty: 1, lineTotal: 944.92 }),
      otherCompleted({ treatment: "DRENCH #1", date: "18/2/2026", qty: 1.5, lineTotal: 1417.38 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "14/4/2026", qty: 0.3, lineTotal: 317.19 }),
      otherCompleted({ treatment: "SOD SPRAY #4", date: "20/4/2026", qty: 0.3, lineTotal: 215.42 }),
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

  for (const row of CUSTOMERS) {
    const customer = await ChemicalCustomer.findOne({
      status: "Active",
      customerName: row.customerName,
    });

    if (!customer) {
      console.warn("NOT FOUND:", row.customerName);
      continue;
    }

    const annualTreatments = [
      ...defaultAnnual,
      ...row.completedAnnual,
    ];
    const otherTreatments = [...row.completedOther];

    await ChemicalCustomer.updateOne(
      { _id: customer._id },
      {
        $set: {
          contractTotal: row.contractTotal,
          materialsUsedToDate: row.materialsUsedToDate,
          annualTreatments,
          otherTreatments,
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
      `${row.customerName} | contract=$${row.contractTotal.toFixed(2)} | used=$${row.materialsUsedToDate.toFixed(2)} (calc $${calcUsed.toFixed(2)}) | remaining=$${money(row.contractTotal - row.materialsUsedToDate).toFixed(2)} | annual+${row.completedAnnual.length} other+${row.completedOther.length}`
    );
  }

  await mongoose.connection.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

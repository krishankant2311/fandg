/* eslint-disable no-console */
/**
 * Import completed treatments (sheet 2) — batch 2: CARTER, CLINCH, DEGREVE
 * Usage: node scripts/seed-completed-treatments-batch2.js
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
    customerName: "CARTER, MONICA",
    contractTotal: 6320.0,
    materialsUsedToDate: 3430.83,
    completedAnnual: [
      annualCompleted({ date: "6/2/2026", qty: 2, lineTotal: 282.0 }),
      annualCompleted({ date: "13/2/2026", qty: 2, lineTotal: 282.0 }),
    ],
    completedOther: [
      otherCompleted({
        treatment: "FUNGAL SPRAY #3 + HEADWAY",
        date: "7/1/2026",
        qty: 0.5,
        lineTotal: 547.7,
      }),
      otherCompleted({ treatment: "DRENCH #1", date: "18/2/2026", qty: 2, lineTotal: 1889.84 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "4/3/2026", qty: 0.5, lineTotal: 429.29 }),
    ],
  },
  {
    customerName: "CLINCH, KARYN",
    contractTotal: 5523.0,
    materialsUsedToDate: 2883.13,
    completedAnnual: [
      annualCompleted({ date: "11/2/2026", qty: 4, lineTotal: 564.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "20/2/2026", qty: 2, lineTotal: 1889.84 }),
      otherCompleted({ treatment: "SOD SPRAY #5", date: "13/4/2026", qty: 0.5, lineTotal: 429.29 }),
    ],
  },
  {
    customerName: "DEGREVE, MARIANA",
    contractTotal: 3913.0,
    materialsUsedToDate: 1367.92,
    completedAnnual: [
      annualCompleted({ date: "18/2/2026", qty: 3, lineTotal: 423.0 }),
    ],
    completedOther: [
      otherCompleted({ treatment: "DRENCH #1", date: "12/5/2026", qty: 1, lineTotal: 944.92 }),
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
      `${row.customerName} | contract=$${row.contractTotal.toFixed(2)} | used=$${row.materialsUsedToDate.toFixed(2)} (calc $${calcUsed.toFixed(2)}) | remaining=$${money(row.contractTotal - row.materialsUsedToDate).toFixed(2)} | annual+${row.completedAnnual.length} other+${row.completedOther.length}`
    );
  }

  await mongoose.connection.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

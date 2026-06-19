/* eslint-disable no-console */
/**
 * Compare SOD SPRAY #1–#5 in DB vs client spreadsheet reference.
 *
 * Usage (API — staff logged in, copy token from localStorage "f&gstafftoken"):
 *   set STAFF_TOKEN=your_jwt_here
 *   node scripts/compare-sod-spray-mixes.js
 *
 * Usage (Mongo — IP whitelisted on Atlas):
 *   node scripts/compare-sod-spray-mixes.js --mongo
 */

const mongoose = require("mongoose");
const ChemicalMaintenance = require("../modules/ChemicalMaintenance/Model/chemicalMaintenanceModel");

const MONGO_URI =
  "mongodb+srv://abhinandan_db_user:MqVfTUZp9pq1bR8G@cluster0.qtbcn0b.mongodb.net/fandgdummy?retryWrites=true&w=majority&appName=Cluster0";
const API_URL = "https://fandg.onrender.com/api/chemical-maintenance/mixes";

const TOL = 0.02;

const CLIENT_REFERENCE = [
  {
    mixName: "SOD SPRAY #1",
    costPerTank: 76.8,
    clientPricePerTank: 303.6,
    chemicals: [
      { name: "RENOVA", qty: 48, costPerOz: 0.55, lineCost: 26.4 },
      { name: "AXILO MIX (B)", qty: 24, costPerOz: 0.63, lineCost: 15.12 },
      { name: "AXILO MIX (Fe)", qty: 24, costPerOz: 0.63, lineCost: 15.12 },
      { name: "KINETIC", qty: 8, costPerOz: 0.63, lineCost: 5.04 },
      { name: "BREXIL", qty: 24, costPerOz: 0.63, lineCost: 15.12 },
    ],
  },
  {
    mixName: "SOD SPRAY #2",
    costPerTank: 367.97,
    clientPricePerTank: 885.93,
    chemicals: [
      { name: "CORON 28-0-0", qty: 320, costPerOz: 0.2, lineCost: 64.0 },
      { name: "BREXIL", qty: 24, costPerOz: 0.63, lineCost: 15.12 },
      { name: "COMPENDIUM", qty: 128, costPerOz: 2.21, lineCost: 282.88 },
      { name: "CRITERION", qty: 1.6, costPerOz: 1.76, lineCost: 2.82 },
      { name: "KINETIC", qty: 5, costPerOz: 0.63, lineCost: 3.15 },
    ],
  },
  {
    mixName: "SOD SPRAY #3",
    costPerTank: 43.86,
    clientPricePerTank: 237.71,
    chemicals: [
      { name: "ELE-MAX 0-0-25", qty: 48, costPerOz: 0.2, lineCost: 9.6 },
      { name: "CRITERION", qty: 1.6, costPerOz: 1.76, lineCost: 2.82 },
      { name: "RENOVA", qty: 48, costPerOz: 0.55, lineCost: 26.4 },
      { name: "KINETIC", qty: 8, costPerOz: 0.63, lineCost: 5.04 },
    ],
  },
  {
    mixName: "SOD SPRAY #4",
    costPerTank: 309.04,
    clientPricePerTank: 768.08,
    chemicals: [
      { name: "CORON 28-0-0", qty: 320, costPerOz: 0.2, lineCost: 64.0 },
      { name: "LEXICON", qty: 8, costPerOz: 30.0, lineCost: 240.0 },
      { name: "KINETIC", qty: 8, costPerOz: 0.63, lineCost: 5.04 },
    ],
  },
  {
    mixName: "SOD SPRAY #5",
    costPerTank: 379.29,
    clientPricePerTank: 908.58,
    chemicals: [
      { name: "CORON 28-0-0", qty: 320, costPerOz: 0.2, lineCost: 64.0 },
      { name: "RENOVA", qty: 64, costPerOz: 0.55, lineCost: 35.2 },
      { name: "RECEPTOR", qty: 15, costPerOz: 0.55, lineCost: 8.25 },
      { name: "ACELEPRYN", qty: 12, costPerOz: 6.25, lineCost: 75.0 },
      { name: "ZYPRO", qty: 12, costPerOz: 0.9, lineCost: 10.8 },
      { name: "HERITAGE", qty: 8, costPerOz: 22.94, lineCost: 183.52 },
      { name: "KINETIC", qty: 4, costPerOz: 0.63, lineCost: 2.52 },
    ],
  },
];

const norm = (s) =>
  String(s || "")
    .toUpperCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const near = (a, b, tol = TOL) => Math.abs(Number(a) - Number(b)) <= tol;

function lineKey(c) {
  return norm(c.brandName || c.chemicalName || c.name);
}

function resolveLineCost(c) {
  const qty = Number(c.quantity);
  const cpo = Number(c.costPerOz);
  if (qty > 0 && cpo > 0) return qty * cpo;
  return Number(c.cost) || 0;
}

function resolveCostPerOz(c) {
  const qty = Number(c.quantity);
  const cost = Number(c.cost);
  const cpo = Number(c.costPerOz);
  if (cpo > 0) return cpo;
  if (qty > 0 && cost > 0) return cost / qty;
  return 0;
}

function compareMix(ref, dbMix) {
  const issues = [];
  if (!dbMix) {
    return [`MISSING — "${ref.mixName}" DB mein nahi mila`];
  }

  const dbChems = dbMix.chemicals || [];
  if (dbChems.length !== ref.chemicals.length) {
    issues.push(
      `Chemical count: client ${ref.chemicals.length}, DB ${dbChems.length}`
    );
  }

  for (const refLine of ref.chemicals) {
    const refKey = norm(refLine.name);
    const dbLine = dbChems.find((c) => {
      const k = lineKey(c);
      return k.includes(refKey) || refKey.includes(k.split(" ")[0]);
    });

    if (!dbLine) {
      issues.push(`Missing chemical: ${refLine.name}`);
      continue;
    }

    if (!near(dbLine.quantity, refLine.qty, 0.001)) {
      issues.push(
        `${refLine.name}: qty client ${refLine.qty}, DB ${dbLine.quantity}`
      );
    }

    const dbCpo = resolveCostPerOz(dbLine);
    if (!near(dbCpo, refLine.costPerOz)) {
      issues.push(
        `${refLine.name}: COST/OZ client $${refLine.costPerOz}, DB $${dbCpo.toFixed(4)}`
      );
    }

    const dbLineCost = resolveLineCost(dbLine);
    if (!near(dbLineCost, refLine.lineCost)) {
      issues.push(
        `${refLine.name}: line cost client $${refLine.lineCost}, DB $${dbLineCost.toFixed(2)}`
      );
    }
  }

  const dbSum = dbChems.reduce((s, c) => s + resolveLineCost(c), 0);
  const dbTankCost = Number(dbMix.totalCostPerTank) || dbSum;

  if (!near(dbTankCost, ref.costPerTank)) {
    issues.push(
      `COST PER TANK: client $${ref.costPerTank}, DB $${dbTankCost.toFixed(2)}`
    );
  }

  const appPricePerTank = dbTankCost * 2;
  const dbPrice = Number(dbMix.totalPricePerTank) || 0;
  if (!near(dbPrice, appPricePerTank)) {
    issues.push(
      `PRICE PER TANK (app 2× rule): expected $${appPricePerTank.toFixed(2)}, DB $${dbPrice.toFixed(2)}`
    );
  }

  if (ref.clientPricePerTank != null && !near(dbPrice, ref.clientPricePerTank)) {
    issues.push(
      `PRICE PER TANK vs client yellow cell: client $${ref.clientPricePerTank}, DB $${dbPrice.toFixed(2)} (app uses 2× cost, not yellow)`
    );
  }

  return issues;
}

async function fetchFromMongo() {
  await mongoose.connect(MONGO_URI);
  const mixes = await ChemicalMaintenance.find({
    mixName: /^SOD SPRAY/i,
    status: "Active",
  })
    .lean();
  await mongoose.disconnect();
  return mixes;
}

async function fetchFromApi(token) {
  const res = await fetch(API_URL, { headers: { token } });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "API failed");
  return (json.data || []).filter((m) => /^SOD SPRAY/i.test(m.mixName));
}

async function main() {
  const useMongo = process.argv.includes("--mongo");
  let dbMixes;

  if (useMongo) {
    console.log("Fetching from MongoDB...");
    dbMixes = await fetchFromMongo();
  } else {
    const token = process.env.STAFF_TOKEN;
    if (!token) {
      console.error(
        "Set STAFF_TOKEN env var (from localStorage f&gstafftoken) or use --mongo"
      );
      process.exit(1);
    }
    console.log("Fetching from API...");
    dbMixes = await fetchFromApi(token);
  }

  console.log(`Found ${dbMixes.length} SOD SPRAY mix(es) in DB\n`);

  let allOk = true;
  for (const ref of CLIENT_REFERENCE) {
    const dbMix = dbMixes.find(
      (m) => norm(m.mixName) === norm(ref.mixName)
    );
    const issues = compareMix(ref, dbMix);
    console.log(`=== ${ref.mixName} ===`);
    if (issues.length === 0) {
      console.log("OK — cost, chemicals, calculations match client data");
    } else {
      allOk = false;
      issues.forEach((i) => console.log("  ✗", i));
    }
    console.log("");
  }

  const extra = dbMixes.filter(
    (m) => !CLIENT_REFERENCE.some((r) => norm(r.mixName) === norm(m.mixName))
  );
  if (extra.length) {
    console.log("Extra SOD SPRAY mixes in DB:", extra.map((m) => m.mixName));
  }

  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});

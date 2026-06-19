/* eslint-disable no-console */
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const ChemicalMaintenance = require("../modules/ChemicalMaintenance/Model/chemicalMaintenanceModel");
const { mixes: refMixes } = require("./data/deepRootAndFungalSprayMixes");

const TOL = 0.02;
const norm = (s) =>
  String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const near = (a, b, tol = TOL) => Math.abs(Number(a) - Number(b)) <= tol;

function lineKey(c) {
  return norm(c.brandName || c.chemicalName);
}

function resolveCostPerOz(c) {
  const qty = Number(c.quantity);
  const cpo = Number(c.costPerOz);
  if (cpo > 0) return cpo;
  const cost = Number(c.cost);
  if (qty > 0 && cost > 0) return cost / qty;
  return 0;
}

function resolveLineCost(c) {
  const qty = Number(c.quantity);
  const cpo = resolveCostPerOz(c);
  if (qty > 0 && cpo > 0) return qty * cpo;
  return Number(c.cost) || 0;
}

function compareMix(ref, dbMix) {
  const issues = [];
  if (!dbMix) return { ok: false, issues: ["MISSING from DB"] };

  const dbChems = dbMix.chemicals || [];
  if (dbChems.length !== ref.chemicals.length) {
    issues.push(`Chemical count: client ${ref.chemicals.length}, DB ${dbChems.length}`);
  }

  for (const refLine of ref.chemicals) {
    const refKey = lineKey(refLine);
    const dbLine = dbChems.find((c) => {
      const k = lineKey(c);
      return k === refKey || k.includes(refKey) || refKey.includes(k.split(" ")[0]);
    });

    if (!dbLine) {
      issues.push(`Missing: ${refLine.brandName}`);
      continue;
    }

    if (norm(dbLine.type) !== norm(refLine.type)) {
      issues.push(`${refLine.brandName} TYPE: client "${refLine.type}", DB "${dbLine.type}"`);
    }
    if (!near(dbLine.quantity, refLine.quantity, 0.001)) {
      issues.push(`${refLine.brandName} QTY: client ${refLine.quantity}, DB ${dbLine.quantity}`);
    }
    if (!near(resolveCostPerOz(dbLine), refLine.costPerOz)) {
      issues.push(`${refLine.brandName} COST/OZ: client $${refLine.costPerOz}, DB $${resolveCostPerOz(dbLine).toFixed(4)}`);
    }
    if (!near(resolveLineCost(dbLine), refLine.cost)) {
      issues.push(`${refLine.brandName} TOTAL COST: client $${refLine.cost}, DB $${resolveLineCost(dbLine).toFixed(2)}`);
    }
    const dbPpo = Number(dbLine.pricePerOz) || resolveCostPerOz(dbLine) * 2;
    if (!near(dbPpo, refLine.pricePerOz)) {
      issues.push(`${refLine.brandName} PRICE/OZ: expected $${refLine.pricePerOz}, DB $${dbPpo.toFixed(4)}`);
    }
  }

  const dbSum = dbChems.reduce((s, c) => s + resolveLineCost(c), 0);
  const dbTankCost = Number(dbMix.totalCostPerTank) || dbSum;
  if (!near(dbTankCost, ref.totalCostPerTank)) {
    issues.push(`COST PER TANK: client $${ref.totalCostPerTank}, DB $${dbTankCost.toFixed(2)}`);
  }

  const expectedPrice = ref.totalPricePerTank;
  const dbPrice = Number(dbMix.totalPricePerTank) || 0;
  if (!near(dbPrice, expectedPrice)) {
    issues.push(`PRICE PER TANK: expected $${expectedPrice} (2×cost), DB $${dbPrice.toFixed(2)}`);
  }

  return { ok: issues.length === 0, issues };
}

(async () => {
  await connectDB();
  const names = refMixes.map((m) => m.mixName);
  const dbMixes = await ChemicalMaintenance.find({
    mixName: { $in: names },
    status: "Active",
  }).lean();

  let allOk = true;
  console.log("\n=== CLIENT vs DB AUDIT ===\n");

  for (const ref of refMixes) {
    const dbMix = dbMixes.find((m) => norm(m.mixName) === norm(ref.mixName));
    const { ok, issues } = compareMix(ref, dbMix);
    console.log(`${ok ? "✅" : "❌"} ${ref.mixName}`);
    console.log(`   Client COST PER TANK: $${ref.totalCostPerTank} | PRICE: $${ref.totalPricePerTank}`);
    if (dbMix) {
      console.log(`   DB     COST PER TANK: $${dbMix.totalCostPerTank} | PRICE: $${dbMix.totalPricePerTank}`);
    }
    if (!ok) {
      allOk = false;
      issues.forEach((i) => console.log(`   → ${i}`));
    }
    console.log("");
  }

  await mongoose.connection.close();
  process.exit(allOk ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

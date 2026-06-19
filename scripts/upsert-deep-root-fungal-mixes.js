/* eslint-disable no-console */
/**
 * Upsert DEEP ROOT INJECTION #1–#3 + FUNGAL SPRAY #1–#3
 * Usage: cd node_backendFandG && node scripts/upsert-deep-root-fungal-mixes.js
 */
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const ChemicalMaintenance = require("../modules/ChemicalMaintenance/Model/chemicalMaintenanceModel");
const { mixes, duplicateMixNamesToRetire } = require("./data/deepRootAndFungalSprayMixes");

async function upsertMix(doc) {
  const payload = {
    mixName: doc.mixName,
    chemicals: doc.chemicals,
    totalCostPerTank: doc.totalCostPerTank,
    totalPricePerTank: doc.totalPricePerTank,
    notes: doc.notes || "",
    pdfOrder: doc.pdfOrder,
    status: "Active",
  };

  const existing = await ChemicalMaintenance.findOne({
    mixName: doc.mixName,
    status: "Active",
  });

  if (existing) {
    existing.set(payload);
    await existing.save();
    console.log(`Updated: ${doc.mixName}`);
    return existing;
  }

  const created = await ChemicalMaintenance.create(payload);
  console.log(`Created: ${doc.mixName}`);
  return created;
}

(async () => {
  try {
    await connectDB();
    for (const doc of mixes) {
      await upsertMix(doc);
      console.log(
        `  ${doc.mixName} → COST $${doc.totalCostPerTank} | PRICE $${doc.totalPricePerTank} | ${doc.chemicals.length} chemicals`
      );
    }
    for (const name of duplicateMixNamesToRetire || []) {
      const dup = await ChemicalMaintenance.findOne({ mixName: name, status: "Active" });
      if (dup) {
        dup.status = "Deleted";
        await dup.save();
        console.log(`Retired corrupt duplicate: ${name}`);
      }
    }

    console.log(`\nDone. ${mixes.length} mixes upserted.`);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();

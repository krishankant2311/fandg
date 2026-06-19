/* eslint-disable no-console */
/**
 * Upsert batch 3 mixes (basil, bore, dormant, weed, pre-emergent, mite, mosquito)
 * Usage: cd node_backendFandG && node scripts/upsert-basil-weed-mite-mixes.js
 */
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const ChemicalMaintenance = require("../modules/ChemicalMaintenance/Model/chemicalMaintenanceModel");
const { mixes, duplicateMixNamesToRetire } = require("./data/basilWeedMiteMixes");

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
        `  → COST $${doc.totalCostPerTank} | PRICE $${doc.totalPricePerTank} | ${doc.chemicals.length} chemicals`
      );
    }

    for (const name of duplicateMixNamesToRetire) {
      const dup = await ChemicalMaintenance.findOne({ mixName: name, status: "Active" });
      if (dup) {
        dup.status = "Deleted";
        await dup.save();
        console.log(`Retired duplicate: ${name}`);
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

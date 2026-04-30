/* eslint-disable no-console */
/**
 * Upsert MULTI-PURPOSE ROOT DRENCH mixes #1–#7 into ChemicalMaintenance collection.
 *
 * Source: CHEM MIX FORM updated PDF (MULTI-PURPOSE ROOT DRENCH formulations).
 *
 * Usage (from repo root):
 *   cd node_backendFandG && node scripts/upsert-multi-purpose-root-drenchs.updated.js
 *
 * Uses the same MongoDB connection as ./config/db.js.
 */
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const ChemicalMaintenance = require("../modules/ChemicalMaintenance/Model/chemicalMaintenanceModel");
const { mixes } = require("./data/multiPurposeRootDrenchMixes.updated");

async function upsertMix(doc) {
  const {
    pdfOrder,
    mixName,
    chemicals,
    totalCostPerTank,
    totalPricePerTank,
    notes,
  } = doc;

  const payload = {
    mixName,
    chemicals,
    totalCostPerTank,
    totalPricePerTank,
    notes: notes || "",
    pdfOrder,
    status: "Active",
  };

  let existing = await ChemicalMaintenance.findOne({
    mixName,
    status: "Active",
  });

  const altDrench7Names = ["DRENCH #7"];
  if (!existing && /^DRENCH #7\b/i.test(mixName)) {
    existing = await ChemicalMaintenance.findOne({
      mixName: { $in: altDrench7Names },
      status: "Active",
    });
  }

  if (existing) {
    existing.set(payload);
    await existing.save();
    console.log(`Updated mix: ${mixName} (_id: ${existing._id})`);
    return existing;
  }

  const created = await ChemicalMaintenance.create(payload);
  console.log(`Created mix: ${mixName} (_id: ${created._id})`);
  return created;
}

(async () => {
  try {
    await connectDB();
    for (const doc of mixes) {
      await upsertMix(doc);
    }
    console.log(`Done. Processed ${mixes.length} drench mixes.`);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();

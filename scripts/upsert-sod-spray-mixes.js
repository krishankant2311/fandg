/* eslint-disable no-console */
/**
 * Upsert SOD SPRAY mixes from scripts/data/sodSprayMixes.js
 *
 * Usage: cd node_backendFandG && node scripts/upsert-sod-spray-mixes.js
 */
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const ChemicalMaintenance = require("../modules/ChemicalMaintenance/Model/chemicalMaintenanceModel");
const { mixes } = require("./data/sodSprayMixes");

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

  const existing = await ChemicalMaintenance.findOne({
    mixName,
    status: "Active",
  });

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
      console.log(
        `  → ${doc.mixName}: COST PER TANK $${doc.totalCostPerTank}, PRICE PER TANK $${doc.totalPricePerTank}`
      );
      doc.chemicals.forEach((c) => {
        console.log(
          `     ${c.brandName} | ${c.type} | ${c.quantity} oz | COST/OZ $${c.costPerOz} | TOTAL COST $${c.cost} | PRICE/OZ $${c.pricePerOz} | TOTAL PRICE $${c.price}`
        );
      });
    }
    console.log(`Done. Processed ${mixes.length} SOD SPRAY mix(es).`);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
})();

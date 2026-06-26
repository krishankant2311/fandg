/* eslint-disable no-console */
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const ChemicalMaintenance = require("../modules/ChemicalMaintenance/Model/chemicalMaintenanceModel");

const sources = [
  require("./data/sodSprayMixes"),
  require("./data/deepRootAndFungalSprayMixes"),
  require("./data/fungalSprayDrenchBatch2"),
  require("./data/insecticideSprayMixes"),
  require("./data/basilWeedMiteMixes"),
];

(async () => {
  await connectDB();
  const all = await ChemicalMaintenance.find({ status: "Active" }).lean();

  for (const src of sources) {
    for (const ref of src.mixes) {
      const db = all.find((m) => m.mixName === ref.mixName);
      console.log(`\n${ref.mixName}`);
      if (!db) {
        console.log("  (missing)");
        continue;
      }
      for (const c of db.chemicals || []) {
        console.log(`  ${c.brandName || c.chemicalName} → ${c.type || "(empty)"}`);
      }
    }
  }

  await mongoose.connection.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
   
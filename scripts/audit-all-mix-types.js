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

const norm = (s) =>
  String(s || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const chemKey = (c) => norm(c.brandName || c.chemicalName);

const findChem = (dbChems, refChem) => {
  const rk = chemKey(refChem);
  const exact = (dbChems || []).find((c) => chemKey(c) === rk);
  if (exact) return exact;

  // Allow minor spacing/parenthesis differences only when unambiguous
  const partial = (dbChems || []).filter((c) => {
    const k = chemKey(c);
    return k.includes(rk) || rk.includes(k);
  });
  return partial.length === 1 ? partial[0] : null;
};

(async () => {
  await connectDB();
  const all = await ChemicalMaintenance.find({ status: "Active" }).lean();
  let bad = 0;

  for (const src of sources) {
    for (const ref of src.mixes) {
      const db = all.find((m) => m.mixName === ref.mixName);
      console.log(`\n=== ${ref.mixName} ===`);
      if (!db) {
        console.log("  MISSING IN DB");
        bad++;
        continue;
      }
      let mixOk = true;
      for (const rc of ref.chemicals) {
        const dc = findChem(db.chemicals, rc);
        if (!dc) {
          console.log(`  MISSING CHEM: ${rc.brandName}`);
          mixOk = false;
          continue;
        }
        const dbType = String(dc.type || "").trim();
        const refType = String(rc.type || "").trim();
        if (!dbType || norm(dbType) !== norm(refType)) {
          console.log(`  TYPE MISMATCH: ${rc.brandName}`);
          console.log(`    expected: "${refType}"`);
          console.log(`    DB:       "${dbType || "(empty)"}"`);
          mixOk = false;
        }
      }
      if (mixOk) console.log("  ALL TYPES OK");
      else bad++;
    }
  }

  console.log(`\n--- ${bad} mix(es) with type issues ---`);
  await mongoose.connection.close();
  process.exit(bad > 0 ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

(async () => {
  try {
    const MONGO_URI =
      process.env.MONGO_URI ||
      "mongodb://fandgadmin:Fandg1234@50.172.153.160.host.secureserver.net:27017/database?authSource=admin";
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      tlsAllowInvalidCertificates: true,
    });
    const db = mongoose.connection.db;
    const col = db.collection("chemicalcustomers");

    // 1) Full backup of deleted customers before touching anything
    const deletedDocs = await col.find({ status: "Deleted" }).toArray();
    const backupFile = path.join(
      __dirname,
      `backup_deleted_chemical_customers_${Date.now()}.json`
    );
    fs.writeFileSync(backupFile, JSON.stringify(deletedDocs, null, 2));
    console.log(`Backup saved: ${backupFile} (${deletedDocs.length} customers)`);

    // 2) Clear schedule dates only on DELETED customers
    const r1 = await col.updateMany(
      { status: "Deleted", "annualTreatments.0": { $exists: true } },
      {
        $set: {
          "annualTreatments.$[].scheduleDates": [],
          "annualTreatments.$[].scheduleDate": null,
        },
      }
    );
    console.log(
      `Annual treatments cleared: matched=${r1.matchedCount}, modified=${r1.modifiedCount}`
    );

    const r2 = await col.updateMany(
      { status: "Deleted", "otherTreatments.0": { $exists: true } },
      { $set: { "otherTreatments.$[].date": null } }
    );
    console.log(
      `Other treatments cleared: matched=${r2.matchedCount}, modified=${r2.modifiedCount}`
    );

    // 3) Verify nothing schedule-related remains on deleted customers
    const remaining = await col
      .find({
        status: "Deleted",
        $or: [
          { "annualTreatments.scheduleDates.0": { $exists: true } },
          { "annualTreatments.scheduleDate": { $nin: [null, ""] } },
          { "otherTreatments.date": { $nin: [null, ""] } },
        ],
      })
      .project({ customerName: 1 })
      .toArray();
    console.log(`Deleted customers still having schedule dates: ${remaining.length}`);
    remaining.forEach((c) => console.log(" !", c._id, c.customerName));

    // 4) Sanity check: Active customers untouched
    const activeCount = await col.countDocuments({ status: "Active" });
    console.log(`Active customers (untouched): ${activeCount}`);

    process.exit(0);
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
})();

require("dotenv").config();
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
    console.log("Connected to db:", mongoose.connection.name);

    const statuses = await db
      .collection("chemicalcustomers")
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .toArray();
    console.log("\nChemical customers by status:", JSON.stringify(statuses));

    const deleted = await db
      .collection("chemicalcustomers")
      .find({ status: { $ne: "Active" } })
      .project({
        customerName: 1,
        status: 1,
        annualTreatments: 1,
        otherTreatments: 1,
      })
      .toArray();

    console.log("\nNon-active (deleted) chemical customers:", deleted.length);
    for (const c of deleted) {
      const annual = Array.isArray(c.annualTreatments) ? c.annualTreatments : [];
      const other = Array.isArray(c.otherTreatments) ? c.otherTreatments : [];
      const countDates = (arr) =>
        arr.reduce(
          (n, t) =>
            n + (Array.isArray(t.scheduleDates) ? t.scheduleDates.length : 0),
          0
        );
      console.log(
        ` - ${c._id} | ${c.customerName} | status=${c.status} | annualTreatments=${annual.length} (dates=${countDates(
          annual
        )}) | otherTreatments=${other.length} (dates=${countDates(other)})`
      );
    }
    process.exit(0);
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
})();

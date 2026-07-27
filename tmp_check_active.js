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

    const active = await db
      .collection("chemicalcustomers")
      .find({ status: "Active" })
      .project({ customerName: 1, annualTreatments: 1, otherTreatments: 1 })
      .toArray();

    console.log("Active chemical customers:", active.length);
    for (const c of active) {
      const annual = Array.isArray(c.annualTreatments) ? c.annualTreatments : [];
      const other = Array.isArray(c.otherTreatments) ? c.otherTreatments : [];
      const countDates = (arr) =>
        arr.reduce(
          (n, t) =>
            n + (Array.isArray(t.scheduleDates) ? t.scheduleDates.length : 0),
          0
        );
      console.log(
        ` - ${c._id} | ${c.customerName} | annual dates=${countDates(annual)} | other dates=${countDates(other)}`
      );
    }
    process.exit(0);
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
})();

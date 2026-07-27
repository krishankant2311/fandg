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
    const col = db.collection("chemicalcustomers");

    for (const id of [
      "6989bc7a68216ce97ed2f4a3", // "r"
      "69dfd5d8635ca857776fddd8", // "test1"
      "6a4b76aa78e366de7825aced", // "test" (had other dates, not flagged)
    ]) {
      const doc = await col.findOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { projection: { customerName: 1, annualTreatments: 1, otherTreatments: 1 } }
      );
      if (!doc) continue;
      console.log(`\n=== ${doc.customerName} (${id}) ===`);
      (doc.annualTreatments || []).forEach((t, i) =>
        console.log(
          ` annual[${i}] scheduleDate=${JSON.stringify(t.scheduleDate)} scheduleDates=${JSON.stringify(t.scheduleDates)} qty=${t.quantity}`
        )
      );
      (doc.otherTreatments || []).forEach((t, i) =>
        console.log(
          ` other[${i}] date=${JSON.stringify(t.date)} qty=${t.qty}`
        )
      );
    }
    process.exit(0);
  } catch (e) {
    console.error("ERROR:", e.message);
    process.exit(1);
  }
})();

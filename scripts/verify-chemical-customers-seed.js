/* eslint-disable no-console */
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const ChemicalCustomer = require("../modules/ChemicalMaintenance/Model/customerModel");

const NAMES = [
  "BEVERS, DIANE", "BRESNER, BOBBY", "BROGDON, MATHEW", "CARTER, MONICA",
  "CLINCH, KARYN", "DEGREVE, MARIANA", "GRAY, TONY", "HINES PIERCE, LAURA",
  "MACKEY, BARBARA", "MAKRIS, JUSTIN", "MILLER, ADAM & RUTHIE", "MILLER, ADAM & SARA",
  "NASH, JOHN", "OBULANEY, DIANA", "PARMAR, SUNIL", "PAPPERT, MEGAN & KASE",
  "REIZEN, RENNE", "SIEGEL, ADAM & KIMBERLY", "SMITH, PLINY", "SMITH, SANDRA",
  "STEPANIAN, ANDY & LIZ", "STUBBE, MARK", "STUCKEY, CAMILLE", "SWAN, MIKE & CAREY",
  "TRAN, DENNIS", "TRIMBLE, JIM", "VERDUCCI, FRANK",
];

(async () => {
  await connectDB();
  for (const n of NAMES) {
    const c = await ChemicalCustomer.findOne({ status: "Active", customerName: n }).lean();
    if (!c) {
      console.log("MISSING:", n);
      continue;
    }
    const scheduled = (c.annualTreatments || []).filter(
      (t) =>
        Number(t.quantity) > 0 ||
        t.scheduleDate ||
        (Array.isArray(t.scheduleDates) && t.scheduleDates.length)
    );
    console.log(
      `${n} | ${c.customerEmail || "-"} | ${c.customerPhone || "-"} | annual=${c.annualTreatments.length} sched=${scheduled.length} other=${c.otherTreatments.length}`
    );
  }
  const count = await ChemicalCustomer.countDocuments({
    status: "Active",
    customerName: { $in: NAMES },
  });
  console.log(`\nTotal in list: ${count}/27`);
  await mongoose.connection.close();
})();

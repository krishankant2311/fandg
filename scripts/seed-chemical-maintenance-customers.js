/* eslint-disable no-console */
/**
 * Seed Chemical Maintenance customers from client list (screenshot).
 * Creates records with 7 annual treatment rows (qty 0, no dates) and no other treatments.
 *
 * Usage: node scripts/seed-chemical-maintenance-customers.js
 *        node scripts/seed-chemical-maintenance-customers.js --dry-run
 */
const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const Customer = require("../modules/Customer/Model/CustomerModel");
const Project = require("../modules/Projects/Model/projectModel");
const ChemicalCustomer = require("../modules/ChemicalMaintenance/Model/customerModel");
const OtherTreatment = require("../modules/ChemicalMaintenance/Model/otherTreatmentModel");

const DRY_RUN = process.argv.includes("--dry-run");

/** Screenshot names; mainCustomerMatch = exact DB customerName when needed */
const CLIENT_CUSTOMERS = [
  {
    customerName: "BEVERS, DIANE",
    mainCustomerMatch: "BEVERS, DIANE",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "BRESNER, BOBBY",
    mainCustomerMatch: "Bresner, Bobby",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "BROGDON, MATHEW",
    mainCustomerMatch: null,
    isChemicalMaintenanceEnabled: true,
    fallbackJobAddress: "HOUSTON, TX",
  },
  {
    customerName: "CARTER, MONICA",
    mainCustomerMatch: "Carter, Monica",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "CLINCH, KARYN",
    mainCustomerMatch: "Clinch, Karyn",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "DEGREVE, MARIANA",
    mainCustomerMatch: "Degreve, Myriam",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "GRAY, TONY",
    mainCustomerMatch: "Gray, Tony",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "HINES PIERCE, LAURA",
    mainCustomerMatch: null,
    isChemicalMaintenanceEnabled: true,
    fallbackJobAddress: "HOUSTON, TX",
  },
  {
    customerName: "MACKEY, BARBARA",
    mainCustomerMatch: "Mackey, Barbara",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "MAKRIS, JUSTIN",
    mainCustomerMatch: "Makris, Justin",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "MILLER, ADAM & RUTHIE",
    mainCustomerMatch: "Miller, Adam & Ruthie",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "MILLER, ADAM & SARA",
    mainCustomerMatch: "Miller, R. Adam & Sara",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "NASH, JOHN",
    mainCustomerMatch: "Nash, John",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "OBULANEY, DIANA",
    mainCustomerMatch: "Obulaney, Diana",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "PARMAR, SUNIL",
    mainCustomerMatch: "Parmar, Sunil ",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "PAPPERT, MEGAN & KASE",
    mainCustomerMatch: null,
    isChemicalMaintenanceEnabled: true,
    fallbackJobAddress: "HOUSTON, TX",
  },
  {
    customerName: "REIZEN, RENNE",
    mainCustomerMatch: "Raizen, Renne",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "SIEGEL, ADAM & KIMBERLY",
    mainCustomerMatch: "SIEGEL, ADAM & KIMBERLY",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "SMITH, PLINY",
    mainCustomerMatch: "Smith, Pliny",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "SMITH, SANDRA",
    mainCustomerMatch: "Smith, Sandra",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "STEPANIAN, ANDY & LIZ",
    mainCustomerMatch: "Stepanian, Andy & Liz",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "STUBBE, MARK",
    mainCustomerMatch: "Stubbe, Mark",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "STUCKEY, CAMILLE",
    mainCustomerMatch: "Stuckey, Camille",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "SWAN, MIKE & CAREY",
    mainCustomerMatch: "SWAN, MIKE AND CAREY",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "TRAN, DENNIS",
    mainCustomerMatch: "Tran, Dennis",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "TRIMBLE, JIM",
    mainCustomerMatch: "Trimble, Jim",
    isChemicalMaintenanceEnabled: true,
  },
  {
    customerName: "VERDUCCI, FRANK",
    mainCustomerMatch: "Verducci, Frank",
    isChemicalMaintenanceEnabled: true,
  },
];

const FALLBACK_ANNUAL = [
  { treatmentName: "ROOT DRENCH (PER 100 GAL. TANK)", cost: 80, price: 100, lowerPrice: 70 },
  { treatmentName: "FUNGAL TREATMENT - LIQUID (PER 100 GAL. TANK)", cost: 80, price: 100, lowerPrice: 70 },
  { treatmentName: "FUNGAL TREATMENT (Headway G -BAG)", cost: 80, price: 100, lowerPrice: 70 },
  { treatmentName: "INSECTICIDE TREATMENT (PER 100G GAL.TANK)", cost: 80, price: 100, lowerPrice: 70 },
  { treatmentName: "OSMOCOTE FERTILIZER (PER 40LBS. BAG)", cost: 80, price: 100, lowerPrice: 70 },
  { treatmentName: "HERBICIDE (PER 2 GAL. BOTTLE)", cost: 80, price: 100, lowerPrice: 70 },
  { treatmentName: "TOP CHOICE -ANT CONTROL", cost: 80, price: 100, lowerPrice: 70 },
];

function normName(s) {
  return String(s || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/\s*&\s*/g, " & ");
}

function buildAnnualRows(catalog, isChemEnabled) {
  return catalog.map((item) => {
    const unitCost = Number(item.cost) || 80;
    const unitPrice = isChemEnabled
      ? Number(item.lowerPrice ?? item.price ?? 100)
      : Number(item.price ?? 100);
    return {
      name: item.treatmentName,
      quantity: 0,
      scheduleDates: [],
      price: 0,
      cost: 0,
      status: "",
    };
  });
}

async function resolveMainCustomer(mainCustomerMatch) {
  if (!mainCustomerMatch) return null;
  const exact = await Customer.findOne({
    status: "Active",
    customerName: mainCustomerMatch,
  }).lean();
  if (exact) return exact;
  return Customer.findOne({
    status: "Active",
    customerName: new RegExp(
      `^${mainCustomerMatch.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i"
    ),
  }).lean();
}

async function resolveJobAddress(mainCustomer, screenshotName) {
  const fromCustomer = Array.isArray(mainCustomer?.jobAddress)
    ? mainCustomer.jobAddress.find((a) => String(a || "").trim())
    : mainCustomer?.jobAddress;
  if (fromCustomer && String(fromCustomer).trim()) {
    return String(fromCustomer).trim();
  }

  const project = await Project.findOne({
    status: { $nin: ["Delete", "Completed"] },
    customerName: mainCustomer
      ? new RegExp(mainCustomer.customerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
      : new RegExp(screenshotName.split(",")[0].trim(), "i"),
  })
    .sort({ updatedAt: -1 })
    .select("jobAddress")
    .lean();

  if (project?.jobAddress && String(project.jobAddress).trim()) {
    return String(project.jobAddress).trim();
  }

  return "";
}

async function findExistingChemicalCustomer(screenshotName, mainCustomer) {
  const exact = await ChemicalCustomer.findOne({
    status: "Active",
    customerName: screenshotName,
  }).lean();
  if (exact) return exact;

  const targetNorm = normName(screenshotName);
  const mainNorm = mainCustomer ? normName(mainCustomer.customerName) : "";

  const candidates = await ChemicalCustomer.find({ status: "Active" }).lean();

  if (mainNorm) {
    const byMain = candidates.find((c) => normName(c.customerName) === mainNorm);
    if (byMain) return byMain;
  }

  return candidates.find((c) => normName(c.customerName) === targetNorm) || null;
}

(async () => {
  await connectDB();

  const catalog =
    (await OtherTreatment.find({
      status: "Active",
      programType: "annual_program",
    })
      .sort({ sortOrder: 1 })
      .lean()) || [];

  const annualCatalog = catalog.length ? catalog : FALLBACK_ANNUAL;

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of CLIENT_CUSTOMERS) {
    const mainCustomer = await resolveMainCustomer(row.mainCustomerMatch);
    const jobAddress =
      (await resolveJobAddress(mainCustomer, row.customerName)) ||
      row.fallbackJobAddress ||
      "";

    if (!jobAddress) {
      console.warn(`SKIP (no job address): ${row.customerName}`);
      skipped += 1;
      continue;
    }

    const customerEmail = (mainCustomer?.customerEmail || "").trim();
    const customerPhone = (mainCustomer?.customerPhone || "").trim();
    const annualTreatments = buildAnnualRows(
      annualCatalog,
      row.isChemicalMaintenanceEnabled
    );

    const existing = await findExistingChemicalCustomer(
      row.customerName,
      mainCustomer
    );

    const payload = {
      customerName: row.customerName,
      customerEmail,
      customerPhone,
      jobAddress,
      contractTotal: 0,
      description: "",
      isChemicalMaintenanceEnabled: row.isChemicalMaintenanceEnabled,
      annualTreatments,
      otherTreatments: [],
      status: "Active",
    };

    if (existing) {
      const hasScheduled =
        (existing.annualTreatments || []).some(
          (t) =>
            Number(t.quantity) > 0 ||
            (Array.isArray(t.scheduleDates) && t.scheduleDates.length > 0) ||
            t.scheduleDate
        ) || (existing.otherTreatments || []).length > 0;

      if (hasScheduled) {
        console.log(`UPDATE (reset treatments): ${row.customerName}`);
        if (!DRY_RUN) {
          await ChemicalCustomer.updateOne(
            { _id: existing._id },
            {
              $set: {
                customerName: row.customerName,
                customerEmail,
                customerPhone,
                jobAddress,
                isChemicalMaintenanceEnabled: row.isChemicalMaintenanceEnabled,
                annualTreatments,
                otherTreatments: [],
              },
            }
          );
        }
        updated += 1;
      } else {
        console.log(`UPDATE (profile): ${row.customerName}`);
        if (!DRY_RUN) {
          await ChemicalCustomer.updateOne(
            { _id: existing._id },
            {
              $set: {
                customerName: row.customerName,
                customerEmail,
                customerPhone,
                jobAddress,
                isChemicalMaintenanceEnabled: row.isChemicalMaintenanceEnabled,
                annualTreatments,
                otherTreatments: [],
              },
            }
          );
        }
        updated += 1;
      }
      continue;
    }

    console.log(`CREATE: ${row.customerName}`);
    if (!DRY_RUN) {
      await ChemicalCustomer.create(payload);
    }
    created += 1;
  }

  console.log(
    `\nDone${DRY_RUN ? " (dry-run)" : ""}: created=${created}, updated=${updated}, skipped=${skipped}`
  );
  await mongoose.connection.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

const ChemicalCustomer = require("../Model/customerModel");
const ArchivedPlan = require("../Model/archivedPlanModel");

const DEFAULT_TIMEZONE =
  process.env.PLAN_ROLLOVER_TIMEZONE || "America/New_York";

const toMoneyNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
};

const isCompletedStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase() === "completed";

const computeUsedAmount = (customer) => {
  const annualUsed = (customer.annualTreatments || [])
    .filter((at) => isCompletedStatus(at.status))
    .reduce((sum, at) => sum + Number(at.price || 0), 0);

  const otherUsed = (customer.otherTreatments || [])
    .filter((ot) => isCompletedStatus(ot.status))
    .reduce((sum, ot) => {
      const qty = Number(ot.qty || 0);
      const pricePerTank = Number(ot.totalPricePerTank || 0);
      return sum + qty * pricePerTank;
    }, 0);

  const stored = Number(customer.materialsUsedToDate || 0);
  const calculated = annualUsed + otherUsed;
  return toMoneyNumber(Math.max(calculated, Number.isFinite(stored) ? stored : 0));
};

const isPausedStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase() === "paused";

const isOverdueStatus = (status) =>
  String(status || "")
    .trim()
    .toLowerCase() === "overdue";

const hasAnnualTreatmentActivity = (at) => {
  const qty = Number(at.quantity || 0);
  const dates = Array.isArray(at.scheduleDates)
    ? at.scheduleDates.filter(Boolean)
    : at.scheduleDate
      ? [at.scheduleDate]
      : [];
  const status = String(at.status || "").trim();
  return (
    qty > 0 ||
    dates.length > 0 ||
    isCompletedStatus(status) ||
    isPausedStatus(status) ||
    isOverdueStatus(status) ||
    Number(at.price || 0) > 0 ||
    Number(at.cost || 0) > 0 ||
    String(at.projectCode || "").trim().length > 0
  );
};

const hasOtherTreatmentActivity = (ot) => {
  const qty = Number(ot.qty || 0);
  const status = String(ot.status || "").trim();
  return (
    qty > 0 ||
    ot.date != null ||
    isCompletedStatus(status) ||
    isPausedStatus(status) ||
    isOverdueStatus(status) ||
    Number(ot.totalPricePerTank || 0) > 0 ||
    Number(ot.totalCostPerTank || 0) > 0 ||
    String(ot.projectCode || "").trim().length > 0
  );
};

const extractYearEndTreatments = (customer) => {
  const rows = [];

  (customer.annualTreatments || []).forEach((at) => {
    if (!hasAnnualTreatmentActivity(at)) return;
    const dates = Array.isArray(at.scheduleDates)
      ? at.scheduleDates.filter(Boolean)
      : at.scheduleDate
        ? [at.scheduleDate]
        : [];
    rows.push({
      type: "annual",
      treatment: at.name,
      qty: Number(at.quantity || 0),
      date: dates[0] || at.scheduleDate || null,
      price: Number(at.price || 0),
      cost: Number(at.cost || 0),
      status: "Completed",
      projectCode: String(at.projectCode || "").trim(),
    });
  });

  (customer.otherTreatments || []).forEach((ot) => {
    if (!hasOtherTreatmentActivity(ot)) return;
    const qty = Number(ot.qty || 0);
    const pricePerTank = Number(ot.totalPricePerTank || 0);
    const costPerTank = Number(ot.totalCostPerTank || 0);
    rows.push({
      type: "other",
      treatment: ot.treatment || ot.mixName || "Other",
      qty,
      date: ot.date || null,
      price: qty * pricePerTank,
      cost: qty * costPerTank,
      status: "Completed",
      projectCode: String(ot.projectCode || "").trim(),
    });
  });

  return rows;
};

const buildFreshAnnualTreatments = (annualTreatments = []) => {
  const seen = new Set();
  const fresh = [];

  (annualTreatments || []).forEach((at) => {
    const name = String(at.name || "").trim();
    if (!name || seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());
    fresh.push({
      name,
      quantity: 0,
      scheduleDates: [],
      scheduleDate: null,
      price: 0,
      cost: 0,
      projectCode: "",
      status: "Scheduled",
    });
  });

  return fresh;
};

const applyRolloverToCustomer = (customer, nextYear, contractTotal) => {
  customer.planYear = nextYear;
  customer.annualTreatments = buildFreshAnnualTreatments(customer.annualTreatments);
  customer.otherTreatments = [];
  customer.contractTotal = contractTotal;
  customer.materialsUsedToDate = 0;
};

const getYearInTimeZone = (timeZone = DEFAULT_TIMEZONE) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
  }).formatToParts(new Date());
  const yearPart = parts.find((p) => p.type === "year");
  return Number(yearPart?.value) || new Date().getFullYear();
};

/**
 * Archive ending plan year and start next year for one customer.
 * Returns { ok, skipped, reason, ... } — does not throw for already-archived.
 */
const rolloverCustomerPlanRecord = async (
  customer,
  { archivedBy = null, archiveStatus = "Archived" } = {}
) => {
  const currentYear = Number(customer.planYear) || getYearInTimeZone();
  const nextYear = currentYear + 1;

  const existingArchive = await ArchivedPlan.findOne({
    customerId: customer._id,
    planYear: currentYear,
  });
  if (existingArchive) {
    return {
      ok: false,
      skipped: true,
      reason: "already_archived",
      customerId: customer._id,
      customerName: customer.customerName,
      planYear: currentYear,
    };
  }

  const contractTotal = toMoneyNumber(customer.contractTotal);
  const usedAmount = computeUsedAmount(customer);
  const remainingAmount = toMoneyNumber(Math.max(contractTotal - usedAmount, 0));
  const yearEndTreatments = extractYearEndTreatments(customer);

  const archivedPlan = await ArchivedPlan.create({
    customerId: customer._id,
    customerName: customer.customerName,
    customerEmail: customer.customerEmail,
    customerPhone: customer.customerPhone,
    jobAddress: customer.jobAddress,
    planYear: currentYear,
    status: archiveStatus,
    contractTotal,
    usedAmount,
    remainingAmount,
    isChemicalMaintenanceEnabled: !!customer.isChemicalMaintenanceEnabled,
    description: customer.description || "",
    annualTreatments: JSON.parse(JSON.stringify(customer.annualTreatments || [])),
    otherTreatments: JSON.parse(JSON.stringify(customer.otherTreatments || [])),
    completedTreatments: yearEndTreatments,
    expiredAt: new Date(`${currentYear}-12-31T23:59:59.000Z`),
    archivedAt: new Date(),
    archivedBy: archivedBy || undefined,
  });

  if (yearEndTreatments.length > 0) {
    const history = Array.isArray(customer.completedTreatmentsHistory)
      ? customer.completedTreatmentsHistory.filter(
          (block) => Number(block.planYear) !== currentYear
        )
      : [];
    history.push({
      planYear: currentYear,
      archivedAt: new Date(),
      treatments: yearEndTreatments,
    });
    customer.completedTreatmentsHistory = history;
  }

  applyRolloverToCustomer(customer, nextYear, contractTotal);
  await customer.save();

  return {
    ok: true,
    skipped: false,
    customerId: customer._id,
    customerName: customer.customerName,
    fromYear: currentYear,
    toYear: nextYear,
    contractTotal,
    archivedPlan,
    customer,
  };
};

/**
 * Rollover all active customers whose plan year ended (planYear < current calendar year).
 * Runs after 31 Dec — e.g. on 1 Jan the 2026 plan expires and 2027 plan starts.
 */
const processDuePlanRollovers = async ({
  timeZone = DEFAULT_TIMEZONE,
  onlyChemicalEnabled = false,
  archiveStatus = "Expired",
} = {}) => {
  const currentYear = getYearInTimeZone(timeZone);
  const filter = {
    status: "Active",
    planYear: { $lt: currentYear },
  };
  if (onlyChemicalEnabled) {
    filter.isChemicalMaintenanceEnabled = true;
  }

  const customers = await ChemicalCustomer.find(filter);
  const summary = {
    currentYear,
    timeZone,
    checked: customers.length,
    rolledOver: 0,
    skipped: 0,
    failed: 0,
    results: [],
  };

  for (const customer of customers) {
    try {
      const result = await rolloverCustomerPlanRecord(customer, {
        archivedBy: null,
        archiveStatus,
      });
      if (result.ok) {
        summary.rolledOver += 1;
        console.log(
          `[YearEndRollover] ${result.customerName}: ${result.fromYear} expired → ${result.toYear} started (contract $${result.contractTotal.toFixed(2)})`
        );
      } else if (result.skipped) {
        summary.skipped += 1;
      }
      summary.results.push(result);
    } catch (error) {
      summary.failed += 1;
      console.error(
        `[YearEndRollover] Failed for ${customer.customerName}:`,
        error.message || error
      );
      summary.results.push({
        ok: false,
        customerId: customer._id,
        customerName: customer.customerName,
        error: error.message || String(error),
      });
    }
  }

  if (summary.rolledOver > 0) {
    console.log(
      `[YearEndRollover] Done: ${summary.rolledOver} plan(s) expired and rolled over for ${currentYear}`
    );
  }

  return summary;
};

/**
 * Restore an archived plan snapshot back onto the active customer.
 * Removes the archived plan record after a successful restore.
 */
const restoreArchivedPlanRecord = async (archivedPlan) => {
  const customer = await ChemicalCustomer.findOne({
    _id: archivedPlan.customerId,
    status: "Active",
  });
  if (!customer) {
    return {
      ok: false,
      reason: "customer_not_found",
      message: "Active customer not found for this archived plan",
    };
  }

  const archivedYear = Number(archivedPlan.planYear);
  const currentYear = Number(customer.planYear) || archivedYear;

  if (currentYear > archivedYear + 1) {
    return {
      ok: false,
      reason: "newer_plan_active",
      message: `Customer is on plan year ${currentYear}. Restore or delete newer archived plans first.`,
    };
  }

  customer.planYear = archivedYear;
  customer.contractTotal = toMoneyNumber(archivedPlan.contractTotal);
  customer.materialsUsedToDate = toMoneyNumber(archivedPlan.usedAmount);
  customer.annualTreatments = JSON.parse(
    JSON.stringify(archivedPlan.annualTreatments || [])
  );
  customer.otherTreatments = JSON.parse(
    JSON.stringify(archivedPlan.otherTreatments || [])
  );
  customer.isChemicalMaintenanceEnabled = !!archivedPlan.isChemicalMaintenanceEnabled;
  if (archivedPlan.description != null) {
    customer.description = archivedPlan.description;
  }

  customer.completedTreatmentsHistory = (
    customer.completedTreatmentsHistory || []
  ).filter((block) => Number(block.planYear) !== archivedYear);

  await customer.save();
  await ArchivedPlan.findByIdAndDelete(archivedPlan._id);

  return {
    ok: true,
    customer,
    restoredYear: archivedYear,
    customerName: customer.customerName,
  };
};

module.exports = {
  rolloverCustomerPlanRecord,
  processDuePlanRollovers,
  restoreArchivedPlanRecord,
  getYearInTimeZone,
  DEFAULT_TIMEZONE,
};

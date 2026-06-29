const {
  processDuePlanRollovers,
  DEFAULT_TIMEZONE,
} = require("../modules/ChemicalMaintenance/Services/yearEndPlanRolloverService");

const HOURLY_MS = 60 * 60 * 1000;
const STARTUP_DELAY_MS = 15 * 1000;

let jobRunning = false;
let intervalHandle = null;

const isJobEnabled = () => {
  const flag = String(process.env.YEAR_END_ROLLOVER_ENABLED ?? "true").toLowerCase();
  return flag !== "false" && flag !== "0" && flag !== "off";
};

const runYearEndRolloverJob = async (trigger = "scheduled") => {
  if (!isJobEnabled()) return null;
  if (jobRunning) {
    console.log("[YearEndRollover] Previous run still in progress, skipping.");
    return null;
  }

  jobRunning = true;
  try {
    console.log(`[YearEndRollover] Checking due plans (${trigger})…`);
    const summary = await processDuePlanRollovers({
      timeZone: process.env.PLAN_ROLLOVER_TIMEZONE || DEFAULT_TIMEZONE,
      archiveStatus: "Expired",
    });
    if (summary.checked === 0) {
      console.log(
        `[YearEndRollover] No active plans past ${summary.currentYear - 1} — nothing to expire.`
      );
    }
    return summary;
  } catch (error) {
    console.error("[YearEndRollover] Job error:", error);
    throw error;
  } finally {
    jobRunning = false;
  }
};

const startYearEndPlanJob = () => {
  if (!isJobEnabled()) {
    console.log("[YearEndRollover] Automatic plan expiry disabled (YEAR_END_ROLLOVER_ENABLED=false).");
    return;
  }

  const timeZone = process.env.PLAN_ROLLOVER_TIMEZONE || DEFAULT_TIMEZONE;
  console.log(
    `[YearEndRollover] Automatic plan expiry enabled — checks hourly after 31 Dec (${timeZone}).`
  );

  setTimeout(() => {
    runYearEndRolloverJob("startup").catch(() => {});
  }, STARTUP_DELAY_MS);

  intervalHandle = setInterval(() => {
    runYearEndRolloverJob("hourly").catch(() => {});
  }, HOURLY_MS);

  if (typeof intervalHandle.unref === "function") {
    intervalHandle.unref();
  }
};

const stopYearEndPlanJob = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
};

module.exports = {
  startYearEndPlanJob,
  stopYearEndPlanJob,
  runYearEndRolloverJob,
};

/* eslint-disable no-console */
/**
 * Import chemical mixes from the client-provided PDF into MongoDB.
 *
 * - Parses the PDF into text (via pdf-parse)
 * - Extracts mix blocks that include COST/OZ + TOTAL COST + "COST PER TANK" summary
 * - Upserts by mixName (safe to re-run; won't create duplicates)
 *
 * Usage:
 *   node scripts/import-chemical-mixes-from-pdf.js "C:\\Users\\Nitin\\Downloads\\CHEM MIX FORM 5-23-24.pdf"
 *
 * Notes:
 * - The PDF content is not perfectly tabular; this parser is conservative and focuses on the detailed cost pages.
 * - Price-per-oz per chemical is often blank in the PDF; we store per-chemical price fields as 0 and keep
 *   totalPricePerTank from the mix summary when present.
 */

const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const mongoose = require("mongoose");

const ChemicalMaintenance = require("../modules/ChemicalMaintenance/Model/chemicalMaintenanceModel");

// Keep the same Mongo URI used by the app config (no env in this repo).
const MONGO_URI =
  "mongodb+srv://abhinandan_db_user:MqVfTUZp9pq1bR8G@cluster0.qtbcn0b.mongodb.net/fandgdummy?retryWrites=true&w=majority&appName=Cluster0";

const toNumber = (s) => {
  if (s == null) return null;
  const cleaned = String(s).replace(/[$,]/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const normalizeMixName = (name) =>
  String(name || "")
    .replace(/\s+/g, " ")
    .trim();

// De-dupe key: many sections repeat the same mix with/without an application descriptor.
// Keep MOSQUITO CONTROL descriptors (they differentiate MISTING vs FOGGING) and keep WEED SPRAY text.
const mixKey = (name) => {
  const n = normalizeMixName(name);
  if (/^MOSQUITO CONTROL\b/i.test(n)) return n.toUpperCase();
  if (/^WEED SPRAY\b/i.test(n)) return n.toUpperCase();
  // Strip trailing "( ... )" descriptor to merge repeats (e.g. "MITE SPRAY" vs "MITE SPRAY ( SPRAY APPLICATION )")
  return n.replace(/\s*\([^)]*\)\s*$/g, "").toUpperCase();
};

const isHeaderLine = (line) => {
  const l = line.toUpperCase();
  return (
    l.includes("DECRIPTION") ||
    l.includes("DESCRIPTION") ||
    (l.includes("PRODUCT BRAND NAME") && l.includes("EPA")) ||
    l.includes("COST / OZ") ||
    l.includes("TOTAL COST")
  );
};

const MIX_TITLE_PREFIX_RE =
  /^(DRENCH|SOD SPRAY|DEEP ROOT INJECTION|FUNGAL SPRAY|FUNGAL DRENCH|INSECTICIDE DRENCH|INSCECTICIDE DRENCH|INSECTICIDE SPRAY|INSCECTICIDE SPRAY|INSCECTICIDE-GRUB SPRAY|INSECTICIDE-GRUB SPRAY|WEED SPRAY|MITE SPRAY|BORE SPRAY|DORMANT SPRAY|MOSQUITO CONTROL|PRE-EMERGENT SPRAY)\b/i;

const looksLikeMixTitle = (line) => {
  const l = String(line || "").trim();
  if (!l) return false;
  const upper = l.toUpperCase();
  if (upper.startsWith("COST PER TANK")) return false;
  if (upper.startsWith("PRICE PER TANK")) return false;
  if (upper.startsWith("COST / OZ")) return false;
  if (upper.startsWith("PRICE /")) return false;
  if (!MIX_TITLE_PREFIX_RE.test(l)) return false;
  // Accept:
  // - "DRENCH #1:"
  // - "DRENCH #3:COST / OZ" (colon not necessarily at the end)
  const idx = l.indexOf(":");
  if (idx === -1) return false;
  const tail = l.slice(idx + 1).toUpperCase();
  if (
    tail.includes("PRICE /") ||
    tail.includes("TOTAL COST") ||
    tail.includes("TOTAL PRICE")
  ) {
    return false;
  }
  const head = l.slice(0, idx + 1);
  // Keep '-' at the end of class to avoid range issues in some JS engines
  return /^[A-Z0-9][A-Z0-9 #()\\/.,'-]{2,}:$/i.test(head);
};

const extractMixTitle = (line) => {
  const l = String(line || "").trim();
  const idx = l.indexOf(":");
  if (idx === -1) return normalizeMixName(l.replace(/:$/, ""));
  const left = l.slice(0, idx).trim();
  const right = l.slice(idx + 1).trim();
  // Some titles have extra metadata after colon that should NOT be part of the mix name
  // (e.g. "DRENCH #3:COST / OZ"). Keep the right side only when it looks like a real descriptor.
  const rightUpper = right.toUpperCase();
  const ignore =
    rightUpper.includes("COST / OZ") ||
    rightUpper.includes("PRICE /") ||
    rightUpper.includes("TOTAL COST") ||
    rightUpper.includes("TOTAL PRICE");
  if (ignore || !right) return normalizeMixName(left);
  // Keep descriptor (e.g. "MOSQUITO CONTROL: (MISTING SYSTEM)")
  return normalizeMixName(`${left} ${right}`.replace(/\s+/g, " "));
};

const normalizeRowText = (s) =>
  String(s || "")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([)])([0-9])/g, "$1 $2")
    .replace(/([0-9])([()])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

// Parse rows from the non-$ tables (e.g. WEED SPRAY, MOSQUITO FOGGING) where we only have qty.
// Example: "CELSIUS432-1507GRASSY WEED CONTROL0.17"
const parseSimpleChemicalRow = (line) => {
  const raw = normalizeRowText(line);
  if (!raw) return null;
  if (looksLikeMixTitle(raw)) return null;
  if (isHeaderLine(raw)) return null;
  if (raw.includes("$")) return null;
  if (!/[A-Za-z]/.test(raw)) return null;

  const nums = raw.match(/\d+(?:\.\d+)?/g) || [];
  if (nums.length < 1) return null;
  const qtyRaw = nums[nums.length - 1];
  const qty = Number(qtyRaw);
  if (!Number.isFinite(qty)) return null;

  // Remove last numeric token (qty) from the end
  const qtyRe = new RegExp(`${qtyRaw.replace(".", "\\.")}$`);
  const leftText = raw.replace(qtyRe, "").trim();
  if (!leftText) return null;

  const leftTokens = leftText.split(" ").filter(Boolean);
  let epaStart = -1;
  let epaEnd = -1;
  for (let i = 0; i < leftTokens.length - 2; i++) {
    if (
      leftTokens[i].toUpperCase() === "EPA" &&
      leftTokens[i + 1].toLowerCase() === "not" &&
      leftTokens[i + 2].toLowerCase() === "required"
    ) {
      epaStart = i;
      epaEnd = i + 3;
      break;
    }
  }
  if (epaStart === -1) {
    const regIdx = leftTokens.findIndex((t) => /^\d+(?:-\d+)+$/.test(t));
    if (regIdx !== -1) {
      epaStart = regIdx;
      epaEnd = regIdx + 1;
    }
  }

  let brandName = "";
  let epaRegNo = "";
  let type = "";
  if (epaStart !== -1) {
    brandName = leftTokens.slice(0, epaStart).join(" ").trim();
    epaRegNo = leftTokens.slice(epaStart, epaEnd).join(" ").trim();
    type = leftTokens.slice(epaEnd).join(" ").trim();
  } else {
    brandName = leftTokens.join(" ").trim();
  }

  const chemicalName = brandName || raw;
  return {
    chemicalName,
    brandName: brandName || chemicalName,
    epaRegNo,
    type,
    quantity: Math.max(0, qty),
    measure: "OZ / 100 GAL",
    costPerOz: 0,
    pricePerOz: 0,
    cost: 0,
    price: 0,
  };
};

/**
 * Parse a detailed item row from the cost table section.
 *
 * Example rows in extracted PDF text:
 *  "SAFARI 86203-11-59639 INSCECTICIDE 32 6.91 $ 221.12 $"
 *  "CRITERION (1POUCH PER 100GL) 432-1318 INSECTICIDE 1.6 2.5 1.76 $ 2.82 $ 1.88 $"
 */
const parseChemicalRow = (line) => {
  const raw = normalizeRowText(line);
  if (!raw) return null;
  if (raw.toUpperCase().startsWith("COST PER TANK")) return null;
  if (looksLikeMixTitle(raw)) return null;
  if (isHeaderLine(raw)) return null;
  // Skip subtotal-like rows that are only numbers/totals (e.g. "32.40$ 3.62$ 32.23$")
  if (/^[\d\s.,$()-]+$/.test(raw) && !/[A-Za-z]/.test(raw)) return null;

  // We expect a well-formed detailed cost row to contain at least one "$ <amount>$" total-cost token.
  // Example:
  //   SAFARI ... INSCECTICIDE326.91$ 221.12$
  // where "326.91" is actually "32" + "6.91" (oz + cost/oz).
  const dollarNums = raw
    .split("$")
    .map((s) => toNumber(s))
    .filter((n) => n != null);
  if (dollarNums.length < 1) return null;
  const totalCost100 = Number(dollarNums[0] || 0);
  const totalCostAlt = dollarNums.length >= 2 ? Number(dollarNums[1] || 0) : null;

  // Find the number just BEFORE the first "$" which encodes oz+costPerOz (and sometimes includes other columns).
  const beforeDollar = raw.split("$")[0] || "";
  const compact = beforeDollar.replace(/\b[0-9A-Z]+(?:-[0-9A-Z]+)+\b/gi, " "); // remove EPA-like hyphen IDs (EPA reg, 28-0-0, etc.)
  const numsBefore = (compact.match(/\d+(?:\.\d+)?/g) || [])
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n));
  if (numsBefore.length < 1) return null;
  const lastNum = numsBefore[numsBefore.length - 1]; // last numeric token before $

  // Two formats exist in the PDF extract:
  // A) "glued" combo: OZ + COST/OZ merged into one number (e.g. 326.91 => 32 & 6.91)
  // B) "separate" columns: OZ (100 gal), OZ (5 gal/other), COST/OZ are separate numbers before $ total (e.g. 5 0.25 6.06 $ 30.30 $ 1.52 $)
  // We try format (B) first when there are enough numbers; otherwise fall back to (A).

  let oz100 = 0;
  let costPerOz = 0;
  let bestErr = Infinity;

  const totalCostTarget = Number(totalCost100) || 0;
  const near = (a, b, tol = 0.06) => Math.abs(a - b) <= tol;

  // Special-case format: some rows have TWO totals ($100gal/$5gal or $55gal/$225gal).
  // In those cases, the "qty" columns are often glued (e.g. "50.25"), but we can derive quantities from totals:
  //   qtyMain = totalCostMain / costPerOz
  //   qtyAlt  = totalCostAlt / costPerOz
  // We only display the main-tank qty in the UI (OZ / TANK 100 GAL).
  if (totalCostAlt != null && numsBefore.length >= 1) {
    // Try costPerOz candidates among the last 3 numeric tokens before "$"
    const cpoCandidates = [
      numsBefore[numsBefore.length - 1],
      numsBefore[numsBefore.length - 2],
      numsBefore.length >= 3 ? numsBefore[numsBefore.length - 3] : null,
    ].filter((n) => n != null);

    for (const cpoCand of cpoCandidates) {
      const cpo = Number(cpoCand);
      if (!Number.isFinite(cpo) || cpo <= 0) continue;
      const qMain = totalCostTarget / cpo;
      const qAlt = totalCostAlt / cpo;
      const qMainSnap = Math.round((Math.round(qMain * 100) / 100) / 0.25) * 0.25;
      const qAltSnap = Math.round((Math.round(qAlt * 100) / 100) / 0.25) * 0.25;
      const qMainErr = Math.abs(qMainSnap - qMain);
      const qAltErr = Math.abs(qAltSnap - qAlt);
      // Accept if quantities are sensible and snap well to 0.25 increments (prevents bad picks like 5.05 @ 6.00)
      if (
        qMain >= 1 &&
        qAlt > 0 &&
        qMainErr <= 0.06 &&
        qAltErr <= 0.06 &&
        near(qMainSnap * cpo, totalCostTarget, 0.12)
      ) {
        oz100 = Math.round(qMain * 1000) / 1000;
        costPerOz = cpo;
        bestErr = Math.abs(qMain * cpo - totalCostTarget);
        break;
      }
      // If alt total is the main column in that section, still prefer first $ as "main"
      // (we don't store the alt qty; it's available via totals/costPerOz if needed later).
      void qAlt;
    }
  }

  // Another special-case: for some multi-total tables (e.g. 55/225 gal), the PDF glues
  // qtyMain + qtyAlt into a single big integer part and uses a 2-digit fractional part as cost/oz:
  //   "642560.72" => qtyMain=64, qtyAlt=256, costPerOz=0.72
  // Try to decode this when it fits both totals.
  if (totalCostAlt != null && (oz100 <= 0 || costPerOz <= 0)) {
    const m = String(lastNum).match(/^(\d+)\.(\d{2})$/);
    if (m && m[1] && m[2] && m[1].length >= 4) {
      const intParts = [m[1]];
      if (m[1].endsWith("0") && m[1].length >= 5) intParts.push(m[1].slice(0, -1)); // handle patterns like 642560 -> 64256
      const frac = m[2];
      const cpo = Number(`0.${frac}`);
      if (Number.isFinite(cpo) && cpo > 0) {
        let best = null;
        for (const intPart of intParts) {
          for (let split = 1; split <= intPart.length - 1; split++) {
            const qMain = Number(intPart.slice(0, split));
            const qAlt = Number(intPart.slice(split));
            if (!Number.isFinite(qMain) || !Number.isFinite(qAlt) || qMain <= 0 || qAlt <= 0) continue;
            const errMain = Math.abs(qMain * cpo - totalCostTarget);
            const errAlt = Math.abs(qAlt * cpo - totalCostAlt);
            const err = errMain + errAlt;
            if (errMain <= 0.25 && errAlt <= 0.5) {
              if (!best || err < best.err) best = { qMain, qAlt, cpo, err };
            }
          }
        }
        if (best) {
          oz100 = best.qMain;
          costPerOz = best.cpo;
          bestErr = best.err;
        }
      }
    }
  }

  // If we have two totals but couldn't infer cpo/qty from tokens (common for glued multi-column quantities like "642560.72"),
  // derive using brute-force plausible qtys in 0.25 increments.
  if (totalCostAlt != null) {
    let best = null;
    for (let q = 1; q <= 600; q += 0.25) {
      const cpo = totalCostTarget / q;
      if (!Number.isFinite(cpo) || cpo <= 0) continue;
      const cpo2 = Math.round(cpo * 100) / 100; // cost/oz in PDF is typically 2 decimals
      if (cpo2 <= 0 || cpo2 > 150) continue;
      const qAlt = totalCostAlt / cpo2;
      if (!Number.isFinite(qAlt) || qAlt <= 0) continue;
      // Expect alt qty to be in 0.25 increments too (or very close), and typically > main qty for 225gal case
      const qAltRounded = Math.round(qAlt * 100) / 100;
      const qAltSnap = Math.round(qAltRounded / 0.25) * 0.25;
      const altErr = Math.abs(qAltSnap - qAltRounded);
      if (altErr > 0.06) continue;
      const mainErr = Math.abs(q * cpo2 - totalCostTarget);
      if (mainErr > 0.12) continue;
      const score = mainErr + altErr;
      if (!best || score < best.score) {
        best = { q, cpo2, score };
      }
      if (best && best.score < 0.001) break; // essentially exact
    }
    // Only override if brute-fit is better than what we already have
    if (best && (oz100 <= 0 || costPerOz <= 0 || best.score + 0.0001 < bestErr)) {
      oz100 = Math.round(best.q * 1000) / 1000;
      costPerOz = best.cpo2;
      bestErr = best.score;
    }
  }

  if (numsBefore.length >= 3) {
    // Candidate costPerOz is usually the last number before $
    const cpo = Number(lastNum);
    // Try OZ candidates among the previous 1-3 numbers (depending on whether a 5gal/225gal column is present)
    const ozCandidates = [
      numsBefore[numsBefore.length - 2],
      numsBefore[numsBefore.length - 3],
      numsBefore.length >= 4 ? numsBefore[numsBefore.length - 4] : null,
    ].filter((n) => n != null);

    if (Number.isFinite(cpo) && cpo > 0) {
      for (const ozCand of ozCandidates) {
        const oz = Number(ozCand);
        if (!Number.isFinite(oz) || oz <= 0) continue;
        const est = oz * cpo;
        const err = Math.abs(est - totalCostTarget);
        if (err < bestErr) {
          bestErr = err;
          oz100 = oz;
          costPerOz = cpo;
        }
      }
      // If we found a good match, use it.
      if (oz100 > 0 && costPerOz > 0 && near(oz100 * costPerOz, totalCostTarget)) {
        // continue to column parsing below
      } else {
        // reset so we can try glued format
        oz100 = 0;
        costPerOz = 0;
        bestErr = Infinity;
      }
    }
  }

  if (oz100 <= 0 || costPerOz <= 0) {
    // Format (A): split glued combo into (oz, costPerOz)
    const combo = lastNum;
    const comboStr = String(combo);
    const parts = comboStr.split(".");
    const intPart = parts[0] || "";
    const frac = (parts[1] || "").padEnd(2, "0").slice(0, 2);

    for (let costIntDigits = 1; costIntDigits <= Math.min(3, intPart.length); costIntDigits++) {
      const ozStr = intPart.slice(0, -costIntDigits);
      const costIntStr = intPart.slice(-costIntDigits);
      if (!ozStr) continue;
      const oz = Number(ozStr);
      const cpo = Number(`${Number(costIntStr)}.${frac}`);
      if (!Number.isFinite(oz) || !Number.isFinite(cpo) || oz <= 0 || cpo <= 0) continue;
      const est = oz * cpo;
      const err = Math.abs(est - totalCostTarget);
      if (err < bestErr) {
        bestErr = err;
        oz100 = oz;
        costPerOz = cpo;
      }
    }

    if (oz100 <= 0 || costPerOz <= 0) return null;
    if (bestErr > 0.06) return null;
  }

  // Extract columns like the PDF:
  // - Product Brand Name
  // - EPA Reg. # (or "EPA not required")
  // - TYPE
  // We do this by cutting the row at the combo token (oz+costPerOz) and parsing only the left side.
  // IMPORTANT: cut BEFORE '$' using the original row (then strip money),
  // otherwise '$' columns leak into Product/EPA columns.
  const beforeDollarText = (raw.split("$")[0] || raw).trim();
  const leftText = beforeDollarText.replace(/[$,]/g, "").replace(/\s+/g, " ").trim();
  const leftTokensRaw = leftText.split(" ").filter(Boolean);
  // Remove trailing numeric tokens (qty columns / cost-per-oz) that often get glued into the product column.
  // Example: "AVIDMITEOSIDE50.256.06 30.30 1.52" -> keep only "AVIDMITEOSIDE"
  const leftTokens = [...leftTokensRaw];
  while (leftTokens.length) {
    const t = leftTokens[leftTokens.length - 1];
    const isNumericish =
      /^\d+(?:\.\d+)?$/.test(t) || // 6.06, 30.30
      /^\d+\.\d+\.\d+$/.test(t) || // 50.256.06
      (/^\d[\d.]*$/.test(t) && !/[A-Za-z]/.test(t)); // fallback: digits/dots only
    if (!isNumericish) break;
    leftTokens.pop();
  }

  // Find EPA token group
  let epaStart = -1;
  let epaEnd = -1;
  // "EPA not required" (3 tokens)
  for (let i = 0; i < leftTokens.length - 2; i++) {
    if (
      leftTokens[i].toUpperCase() === "EPA" &&
      leftTokens[i + 1].toLowerCase() === "not" &&
      leftTokens[i + 2].toLowerCase() === "required"
    ) {
      epaStart = i;
      epaEnd = i + 3;
      break;
    }
  }
  // Otherwise, find a numeric reg token like 86203-11-59639 or 2217-937
  if (epaStart === -1) {
    const regIdx = leftTokens.findIndex((t) => /^\d+(?:-\d+)+$/.test(t));
    if (regIdx !== -1) {
      epaStart = regIdx;
      epaEnd = regIdx + 1;
    }
  }

  // Brand = tokens before EPA, Type = tokens after EPA
  let brandName = "";
  let epaRegNo = "";
  let type = "";
  if (epaStart !== -1) {
    brandName = leftTokens.slice(0, epaStart).join(" ").trim();
    epaRegNo = leftTokens.slice(epaStart, epaEnd).join(" ").trim();
    type = leftTokens.slice(epaEnd).join(" ").trim();
  } else {
    // If EPA not found, we still keep the left side as brandName (best-effort)
    brandName = leftTokens.join(" ").trim();
    epaRegNo = "";
    type = "";
  }

  const sanitizeText = (s) =>
    String(s || "")
      .replace(/\$/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const chemicalName = sanitizeText(brandName || beforeDollarText || raw);

  // Clamp: schema requires non-negative numeric fields.
  oz100 = Math.max(0, Number(oz100 || 0));
  costPerOz = Math.max(0, Number(costPerOz || 0));
  const totalCostClamped = Math.max(0, Number(totalCost100 || 0));

  return {
    chemicalName,
    brandName: sanitizeText(brandName || chemicalName),
    epaRegNo: sanitizeText(epaRegNo),
    type: sanitizeText(type),
    quantity: oz100,
    measure: "OZ / 100 GAL",
    costPerOz,
    pricePerOz: 0,
    cost: totalCostClamped,
    price: 0,
  };
};

const parseCostPerTankLine = (line) => {
  const raw = String(line || "").replace(/\s+/g, " ").trim();
  const upper = raw.toUpperCase();
  if (!upper.startsWith("COST PER TANK")) return null;

  // In the PDF the line can look like:
  // "COST PER TANK: 362.48 $ 874.96 $"
  // first number = totalCostPerTank
  // second number = totalPricePerTank (if present)
  const nums = (raw.match(/-?\d+(?:\.\d+)?/g) || []).map((n) => Number(n)).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  return {
    totalCostPerTank: nums[0],
    totalPricePerTank: nums.length > 1 ? nums[1] : null,
  };
};

const parseDollarOnlyLine = (line) => {
  const raw = String(line || "").replace(/\s+/g, " ").trim();
  if (!raw.startsWith("$")) return null;
  const n = toNumber(raw);
  return n == null ? null : n;
};

const finalizeMix = (mix) => {
  if (!mix) return null;
  if (!Array.isArray(mix.chemicals) || mix.chemicals.length === 0) return null;

  // Totals fallback: sum of per-line costs if missing
  if (mix.totalCostPerTank == null) {
    mix.totalCostPerTank = mix.chemicals.reduce(
      (s, c) => s + (Number(c.cost) || 0),
      0
    );
  }
  if (mix.totalPricePerTank == null) {
    mix.totalPricePerTank = 0;
  }

  // Derive per-chemical price fields when the PDF doesn't provide them.
  // We scale costPerOz -> pricePerOz so that totalPrice sums match the mix's totalPricePerTank.
  const totalCost = Number(mix.totalCostPerTank) || 0;
  const totalPrice = Number(mix.totalPricePerTank) || 0;
  const ratio = totalCost > 0 && totalPrice > 0 ? totalPrice / totalCost : 0;
  if (ratio > 0) {
    mix.chemicals = mix.chemicals.map((c) => {
      const qty = Number(c.quantity) || 0;
      const cpo = Number(c.costPerOz) || 0;
      const ppo = cpo * ratio;
      return {
        ...c,
        pricePerOz: Number.isFinite(ppo) ? ppo : 0,
        price: Number.isFinite(qty * ppo) ? qty * ppo : 0,
      };
    });
  }

  return mix;
};

async function main() {
  const pdfPath = process.argv[2];
  const dryRun = process.argv.includes("--dry-run");
  const dryRunAll = process.argv.includes("--dry-run-all");
  const debug = process.argv.includes("--debug");
  if (!pdfPath) {
    console.error("Missing PDF path argument.");
    process.exit(1);
  }

  const abs = path.isAbsolute(pdfPath) ? pdfPath : path.resolve(process.cwd(), pdfPath);
  if (!fs.existsSync(abs)) {
    console.error(`PDF not found: ${abs}`);
    process.exit(1);
  }

  console.log(`Reading PDF: ${abs}`);
  const buf = fs.readFileSync(abs);
  const parsed = await pdf(buf);

  const lines = String(parsed.text || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Parse the full PDF so we also capture quantity-only tables (WEED SPRAY, MOSQUITO FOGGING, etc.)
  const slice = lines;
  if (debug) {
    console.log("---- DEBUG: first 60 lines of parsed slice ----");
    console.log(slice.slice(0, 60).join("\n"));
    console.log("---- END DEBUG ----");
  }

  const mixes = [];
  let current = null;
  let pendingCostLine = false;
  let pdfOrder = 0;

  const flush = () => {
    if (!current) return;
    const finalized = finalizeMix(current);
    if (finalized) mixes.push(finalized);
    current = null;
  };

  for (const line of slice) {
    if (/^CONVERSIONS\b/i.test(line)) {
      // Don't let conversion table bleed into the last mix
      flush();
      break;
    }
    if (looksLikeMixTitle(line)) {
      flush();
      current = {
        mixName: extractMixTitle(line),
        chemicals: [],
        totalCostPerTank: null,
        totalPricePerTank: null,
        notes: "",
        pdfOrder: pdfOrder++,
      };
      pendingCostLine = false;
      continue;
    }
    if (!current) continue;
    if (isHeaderLine(line)) continue;

    const costSummary = parseCostPerTankLine(line);
    if (costSummary) {
      current.totalCostPerTank = costSummary.totalCostPerTank;
      current.totalPricePerTank = costSummary.totalPricePerTank;
      pendingCostLine = costSummary.totalPricePerTank == null;
      continue;
    }

    // Some PDFs put the price-per-tank on the NEXT line as "$ 874.96$"
    if (pendingCostLine) {
      const maybePrice = parseDollarOnlyLine(line);
      if (maybePrice != null) {
        current.totalPricePerTank = maybePrice;
        pendingCostLine = false;
        continue;
      }
    }

    const row = parseChemicalRow(line);
    if (row) {
      current.chemicals.push(row);
      continue;
    }
    const simpleRow = parseSimpleChemicalRow(line);
    if (simpleRow) current.chemicals.push(simpleRow);
  }
  flush();

  // De-dupe by mixName, keeping the best parsed version while preserving first PDF order.
  const byName = new Map();
  for (const m of mixes) {
    const key = mixKey(m.mixName);
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, m);
      continue;
    }
    const scorePrev =
      (prev.chemicals?.length || 0) +
      ((Number(prev.totalCostPerTank) || 0) > 0 ? 10 : 0) +
      ((Number(prev.totalPricePerTank) || 0) > 0 ? 5 : 0);
    const scoreNext =
      (m.chemicals?.length || 0) +
      ((Number(m.totalCostPerTank) || 0) > 0 ? 10 : 0) +
      ((Number(m.totalPricePerTank) || 0) > 0 ? 5 : 0);
    // Keep earliest order; keep the "nicer" name (prefer one that includes a descriptor if present)
    const keepNext = scoreNext > scorePrev;
    const nameBest =
      (prev.mixName || "").includes("(") || !(m.mixName || "").includes("(")
        ? prev.mixName
        : m.mixName;
    const merged = keepNext
      ? { ...m, mixName: nameBest || m.mixName, pdfOrder: prev.pdfOrder }
      : { ...prev, mixName: nameBest || prev.mixName };
    byName.set(key, merged);
  }
  const uniqueMixes = Array.from(byName.values()).sort((a, b) => (a.pdfOrder ?? 0) - (b.pdfOrder ?? 0));

  console.log(`Parsed mixes (PDF order, unique): ${uniqueMixes.length}`);
  if (mixes.length === 0) {
    console.log("No mixes found to import (parser likely didn't match the expected section).");
    process.exit(0);
  }

  if (dryRun) {
    const list = dryRunAll ? uniqueMixes : uniqueMixes.slice(0, 20);
    console.log(`Dry run summary (${dryRunAll ? "all mixes" : "first 20 mixes"}):`);
    for (const m of list) {
      const c0 = m.chemicals?.[0];
      console.log(
        `- ${m.mixName} | chemicals=${m.chemicals.length} | costTank=${m.totalCostPerTank} | priceTank=${m.totalPricePerTank} | first=${c0 ? `${c0.brandName} (${c0.quantity} @ ${c0.costPerOz})` : "-" }`
      );
    }
    process.exit(0);
  }

  await mongoose.connect(MONGO_URI);

  let created = 0;
  let updated = 0;

  for (const mix of uniqueMixes) {
    const mixName = normalizeMixName(mix.mixName);
    const payload = {
      mixName,
      chemicals: mix.chemicals,
      totalCostPerTank: toNumber(mix.totalCostPerTank) ?? 0,
      totalPricePerTank: toNumber(mix.totalPricePerTank) ?? 0,
      pdfOrder: Number.isFinite(mix.pdfOrder) ? mix.pdfOrder : 999999,
      // Notes are not present in the PDF; keep any existing notes if record exists.
    };

    const existing = await ChemicalMaintenance.findOne({ mixName });
    if (!existing) {
      await ChemicalMaintenance.create({
        ...payload,
        notes: "",
        status: "Active",
      });
      created += 1;
      continue;
    }

    await ChemicalMaintenance.updateOne(
      { _id: existing._id },
      {
        $set: {
          mixName: payload.mixName,
          chemicals: payload.chemicals,
          totalCostPerTank: payload.totalCostPerTank,
          totalPricePerTank: payload.totalPricePerTank,
          pdfOrder: payload.pdfOrder,
          // don't overwrite notes
        },
      }
    );
    updated += 1;
  }

  console.log(`Import complete. created=${created} updated=${updated}`);

  const missingPrice = uniqueMixes
    .filter((m) => (Number(m.totalPricePerTank) || 0) === 0)
    .map((m) => m.mixName)
    .slice(0, 100);
  if (missingPrice.length > 0) {
    console.log(
      `Mixes with missing/zero PRICE PER TANK in PDF parse (first ${missingPrice.length}):`
    );
    for (const n of missingPrice) console.log(`- ${n}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../../../middleware/jwt");

const chemicalMaintenanceController = require("../Controller/chemicalMaintenanceController");
const otherTreatmentController = require("../Controller/otherTreatmentController");

// -------------------------------
// Chemical Customer APIs
// -------------------------------

// Save Chemical Maintenance customer (with schedule)
router.post(
  "/customers",
  verifyJWT,
  chemicalMaintenanceController.createChemicalCustomer
);

// List Chemical Maintenance customers
router.get(
  "/customers",
  verifyJWT,
  chemicalMaintenanceController.getChemicalCustomers
);

// Get single customer by ID
router.get(
  "/customers/:id",
  verifyJWT,
  chemicalMaintenanceController.getChemicalCustomerById
);

// Update customer
router.put(
  "/customers/:id",
  verifyJWT,
  chemicalMaintenanceController.updateChemicalCustomer
);

// Delete customer (soft delete)
router.delete(
  "/customers/:id",
  verifyJWT,
  chemicalMaintenanceController.deleteChemicalCustomer
);

// -------------------------------
// Chemical Mixes CRUD
// -------------------------------
router.post(
  "/mixes",
  verifyJWT,
  chemicalMaintenanceController.createChemicalMix
);

router.get(
  "/mixes",
  verifyJWT,
  chemicalMaintenanceController.getAllChemicalMixes
);

router.put(
  "/mixes/:id",
  verifyJWT,
  chemicalMaintenanceController.updateChemicalMix
);

router.delete(
  "/mixes/:id",
  verifyJWT,
  chemicalMaintenanceController.deleteChemicalMix
);

// -------------------------------
// Other Treatments master list
// -------------------------------
router.post(
  "/add-other-treatment",
  verifyJWT,
  otherTreatmentController.addOtherTreatment
);
router.get(
  "/get-all-other-treatment",
  verifyJWT,
  otherTreatmentController.getAllOtherTreatments
);
router.put(
  "/update-other-treatment/:id",
  verifyJWT,
  otherTreatmentController.updateOtherTreatment
);
router.delete(
  "/delete-other-treatment/:id",
  verifyJWT,
  otherTreatmentController.deleteOtherTreatment
);
router.post(
  "/seed-other-treatments",
  verifyJWT,
  otherTreatmentController.seedDefaultOtherTreatments
);

// -------------------------------
// Archived Plans (year-end Option B)
// -------------------------------
router.get(
  "/archived-plans",
  verifyJWT,
  chemicalMaintenanceController.getArchivedPlans
);

router.get(
  "/archived-plans/:id",
  verifyJWT,
  chemicalMaintenanceController.getArchivedPlanById
);

router.post(
  "/customers/:id/rollover",
  verifyJWT,
  chemicalMaintenanceController.rolloverCustomerPlan
);

module.exports = router;